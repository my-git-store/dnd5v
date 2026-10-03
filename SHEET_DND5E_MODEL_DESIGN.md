# DND5V Character Model Design

## Статус документа

Это проектирование финальной модели персонажа для автономного листа D&D 5e в репозитории dnd5v. Код, компоненты, storage и тесты этим документом не изменяются.

Модель опирается на текущую schemaVersion 2, SHEET_SCHEMA_V2_PLAN.md, отчёты ТЗ №2 и SHEET_DND5E_EVOLUTION_PLAN.md. Базовая редакция правил — русская версия Player's Handbook 2014 из предоставленного PDF. Backend, API, multiplayer, Nastolka и my-table не входят в эту работу.

## 1. Канонический envelope Character v3

Для v3 выбирается нормализованный envelope с отдельными разделами. Значения пользователя хранятся только в одном каноническом месте; модификаторы и итоговые бонусы вычисляются в памяти.

| Раздел | Содержимое |
|---|---|
| schemaVersion | Число 3 |
| id | Стабильный идентификатор персонажа |
| identity | Имя, раса, класс, уровень, опыт, background, alignment |
| abilities | Шесть исходных значений характеристик |
| proficiency | Состояние владения и derived proficiency bonus |
| savingThrows | Владение спасбросками и ручные добавки |
| combat | AC, инициатива, скорость, HP, hit dice и death saves |
| skills | Навыки с ability, proficiency и legacy manual value |
| attacks | Оружейные и прочие атаки |
| spellcasting | Способность заклинаний, ячейки и spellbook |
| inventory | Предметы и деньги |
| personality | Traits, ideals, bonds, flaws и biography |

Производные поля не записываются в envelope:

- modifier характеристики;
- proficiency bonus;
- итоговый бонус навыка и спасброска;
- итоговая инициатива;
- computed AC;
- computed attack bonus;
- spell save DC;
- spell attack bonus;
- оставшиеся spell slots.

Так предотвращается рассинхронизация между исходными score/level и сохранёнными итогами.

## 2. Identity

### Канонические поля

| Поле | Тип/ограничение | Хранение и миграция |
|---|---|---|
| name | Непустая строка, рекомендованный лимит 120 символов | v2.name переносится без изменения |
| race | Объект RaceProfile | Для v2 создаётся пустой профиль |
| class | Строка, рекомендованный лимит 120 символов | v2.class сохраняется как есть |
| subclass | Строка или пустое значение | Default — пустая строка |
| level | Целое число 1–20 | v2.level сохраняется |
| experience | Неотрицательное целое число | v2.experience сохраняется |
| background | Объект BackgroundProfile | Для v2 создаётся пустой профиль |
| alignment | Строка или пустое значение | Default — пустая строка |

class остаётся строкой, а не превращается в объект: это сохраняет прямую совместимость с текущей моделью и не создаёт справочник классов в рамках листа. Детали subclass и класса хранятся отдельными полями.

### RaceProfile

| Поле | Назначение |
|---|---|
| name | Название расы |
| subrace | Подраса, если есть |
| size | Размер персонажа |
| speed | Базовая скорость в футах |
| abilityBonuses | Явно указанные расовые бонусы по AbilityKey |
| traits | Список расовых особенностей или заметка |
| languages | Список языков |

abilityBonuses — источник информации. Миграция и UI не применяют эти бонусы к abilities.value автоматически.

### BackgroundProfile

| Поле | Назначение |
|---|---|
| name | Название предыстории |
| feature | Особенность предыстории |
| skillProficiencies | ID навыков с владением |
| toolProficiencies | Владение инструментами |
| languages | Языки |
| notes | Свободная заметка |

Конфликты между background и уже выбранным proficiency показываются пользователю. Тихое повышение владения запрещено.

## 3. Ability Scores

Доступны ровно шесть ключей:

- strength;
- dexterity;
- constitution;
- intelligence;
- wisdom;
- charisma.

### Решение о формате

В v3 abilities остаётся отображением AbilityKey → value, где value — исходное целое число. Отдельный объект value + modifier не вводится: текущий проект уже использует плоскую запись, а modifier является полностью производным.

| Значение | Статус |
|---|---|
| abilities.strength и остальные пять | Хранимый raw score |
| modifier | Не хранится; считается floor((value - 10) / 2) |
| Расовые/временные бонусы | Не смешиваются с raw score без явного решения |

Ориентир PHB: таблица значений и модификаторов на с. 14. Валидация требует конечное целое значение; интерфейс предлагает диапазон 1–30 и не должен молча обрезать значение.

## 4. Proficiency

### Общий бонус владения

proficiencyBonus вычисляется только из identity.level по таблице PHB:

| Уровень | Бонус |
|---|---:|
| 1–4 | +2 |
| 5–8 | +3 |
| 9–12 | +4 |
| 13–16 | +5 |
| 17–20 | +6 |

proficiencyBonus не сохраняется и не редактируется. Ошибка уровня не исправляется автоматически.

### Уровень владения

Для навыков используется существующий enum:

- none — владения нет;
- proficient — обычное владение, добавляется один proficiency bonus;
- expertise — двойной proficiency bonus.

Для спасбросков и атак достаточно boolean proficient, потому что expertise к ним в базовой модели не применяется. Для инструментов и языков background хранит списки источников, а не итоговые числа.

## 5. Skills

### Каноническая запись навыка

| Поле | Решение |
|---|---|
| id | Стабильный ключ навыка |
| name | Отображаемое имя; допускает локализацию |
| ability | AbilityKey или null для неизвестной связи |
| proficiency | none, proficient или expertise |
| value | Сохраняемый ручной итог для совместимости |
| calculationMode | manual или computed, default для старых данных — manual |
| additionalBonus | Необязательная ручная поправка, default 0 |

### Семантика CharacterSkill.value

value не удаляется и не переименовывается. В режиме manual это число, которое ввёл пользователь, и оно показывается как итог. В режиме computed вычисленный бонус показывается отдельно, а value остаётся резервным ручным значением и не уничтожается.

Итог в computed-режиме:

- none: ability modifier + additionalBonus;
- proficient: ability modifier + proficiencyBonus + additionalBonus;
- expertise: ability modifier + 2 × proficiencyBonus + additionalBonus.

Итоговый bonus не хранится. Хранятся только источник расчёта и ручные настройки.

## 6. Saving Throws

Доступны спасброски по всем шести характеристикам:

- Strength;
- Dexterity;
- Constitution;
- Intelligence;
- Wisdom;
- Charisma.

Для каждой характеристики хранится:

| Поле | Назначение |
|---|---|
| proficient | Есть ли владение спасброском |
| additionalBonus | Ручная поправка от предмета/эффекта, default 0 |

Итог:

- без владения: ability modifier + additionalBonus;
- с владением: ability modifier + proficiencyBonus + additionalBonus.

Итоговый bonus и отдельный modifier не сохраняются.

## 7. Combat

### Armor Class

Канонический combat.armorClass:

| Поле | Назначение |
|---|---|
| mode | manual или computed |
| value | Текущее ручное значение AC; обязательно сохраняется для legacy |
| armorBase | База надетой брони, nullable |
| armorDexCap | Ограничение Dex modifier, nullable |
| shieldBonus | Бонус щита, default 0 |
| additionalBonus | Прочие бонусы, default 0 |

В manual-режиме используется value. В computed-режиме применяется формула выбранной брони; при отсутствии брони используется 10 + Dexterity modifier. Computed-режим не включается автоматически при миграции.

### Остальные combat-поля

| Поле | Структура/правило |
|---|---|
| initiative | additionalBonus; итог = Dexterity modifier + поправка |
| speed | base, optional fly, swim, override |
| hitPoints | max, current, temporary; current может быть 0 |
| hitDice | size, total, spent |
| deathSaves | successes и failures, каждое 0–3 |

Максимум HP, кость хитов и скорость вводятся как данные персонажа. Автоматический расчёт от класса, уровня или Constitution в v3 не выполняется.

## 8. Attacks

### Каноническая запись

| Поле | Назначение |
|---|---|
| id | Стабильный ID |
| name | Название атаки |
| kind | melee, ranged, spell или other |
| abilitySource | AbilityKey либо manual |
| proficient | Добавлять ли proficiency bonus |
| attackBonus | Строка legacy/manual, сохраняется обязательно |
| calculationMode | manual или computed |
| additionalBonus | Целое число, default 0 |
| damage | Свободная строка, без parser |
| damageType | Необязательная строка |
| properties | Список свойств/тегов |
| range | Необязательная строка |
| description | Заметка |

В computed-режиме: ability modifier + proficiencyBonus при proficient + additionalBonus.

В manual-режиме attackBonus:string остаётся итогом пользователя. Произвольная строка вроде 1d20+5 не разбирается, не нормализуется и не заменяется числом.

Миграция v2 переносит bonusSource в abilitySource, additionalBonus сохраняет, calculationMode ставит в manual. Если старый bonusSource не задан, используется manual.

## 9. Spellcasting

### Общий раздел

| Поле | Решение |
|---|---|
| spellcastingAbility | AbilityKey или null |
| spellSaveDC | Вычисляется: 8 + proficiencyBonus + modifier способности |
| spellAttackBonus | Вычисляется: proficiencyBonus + modifier способности |
| knownSpells | Список известных заклинаний уровня 1–9 |
| preparedSpellIds | ID подготовленных заклинаний, ссылающиеся на knownSpells |
| cantrips | Список заговоров уровня 0 |
| spellSlots | Ячейки уровней 1–9 |

При spellcastingAbility = null DC и attack показываются как «не настроено», а не рассчитываются через Charisma по умолчанию.

### Spell slots

Для каждого уровня 1–9 хранится:

- max — максимальное число ячеек;
- used — израсходованное число.

Оставшиеся ячейки вычисляются как max - used; условие 0 ≤ used ≤ max проверяется валидацией. Хранение used, а не только remaining, облегчает восстановление после отдыха.

### Spell entry

Сохраняются текущие id, name, level, description. Дополнительные optional-поля:

- school;
- castingTime;
- range;
- components;
- duration;
- concentration;
- ritual.

Полного каталога заклинаний и автоматического выбора known/prepared spells в модель не добавляется.

## 10. Inventory

### Предмет

| Поле | Правило |
|---|---|
| id | Стабильный ID |
| name | Непустое название |
| quantity | Неотрицательное целое |
| weight | Nullable, неотрицательное число |
| description | Свободный текст |
| equipped | Boolean, default false |
| properties | Optional список тегов |

Существующие name, quantity, description переносятся без изменения. Вес не рассчитывается автоматически и не создаёт rules engine переносимого веса.

Деньги остаются в inventory.money с пятью номиналами: copper, silver, electrum, gold, platinum. Значения не конвертируются автоматически.

## 11. Personality

Канонический раздел personality:

| Поле | Назначение |
|---|---|
| traits | Черты характера |
| ideals | Идеалы |
| bonds | Привязанности |
| flaws | Слабости |
| biography | Биография/предыстория персонажа |
| features | Особенности и черты класса/расы |

Миграция v2 выполняет прямое сопоставление:

- bio.traits → personality.traits;
- bio.biography → personality.biography;
- bio.features → personality.features;
- ideals, bonds, flaws → пустые строки.

Содержимое остаётся обычным текстом: HTML, EditorJS и выполнение пользовательского содержимого не вводятся.

## 12. Migration schemaVersion 2 → 3

### Storage keys и порядок чтения

Вводится versioned key:

nastolka:character-sheet:v3:<id>

Порядок чтения:

1. v3 key;
2. v2 key;
3. существующий v1 key и текущий v1→v2 мигратор;
4. mock-defaults только если записи действительно нет.

При успешном чтении v2 создаётся независимая v3-копия в памяти. Только после обычного успешного сохранения она записывается в v3 key. v2 и v1 ключи не удаляются автоматически, чтобы откат и восстановление были возможны.

### Таблица сопоставления

| v2 | v3 | Правило |
|---|---|---|
| id | id | Без изменений |
| name | identity.name | Без изменений |
| class | identity.class | Остаётся строкой |
| level | identity.level | Проверка 1–20 |
| experience | identity.experience | Без потери числа |
| отсутствует | identity.race | Пустой RaceProfile |
| отсутствует | identity.subclass | Пустая строка |
| отсутствует | identity.background | Пустой BackgroundProfile |
| отсутствует | identity.alignment | Пустая строка |
| abilities[key] | abilities[key] | Raw score сохраняется; modifier не создаётся |
| отсутствует | proficiency | Derived bonus; источники получают defaults |
| отсутствует | savingThrows[key] | proficient false, additionalBonus 0 |
| armorClass | combat.armorClass.value | mode manual |
| отсутствует | combat.initiative и прочее | Безопасные defaults |
| skills[] | skills[] | id/name/ability/proficiency/value сохраняются; mode manual |
| attacks[].attackBonus | attacks[].attackBonus | Строка сохраняется дословно |
| attacks[].bonusSource | attacks[].abilitySource | manual или AbilityKey |
| attacks[].additionalBonus | attacks[].additionalBonus | Целое число сохраняется |
| отсутствует | attacks[].proficient | false |
| spells[] | spellcasting.knownSpells[] | Существующие записи сохраняются |
| cantrips[] | spellcasting.cantrips[] | Уровень 0 сохраняется |
| отсутствует | spellcasting.preparedSpellIds | Пустой список |
| отсутствует | spellcasting.spellSlots | Уровни 1–9 с max/used = 0 |
| inventory[] | inventory.items[] | name/quantity/description сохраняются |
| отсутствует | inventory.items[].weight | null |
| отсутствует | inventory.items[].equipped | false |
| money | inventory.money | Все пять номиналов сохраняются |
| bio.biography | personality.biography | Без изменения текста |
| bio.traits | personality.traits | Без изменения текста |
| bio.features | personality.features | Без изменения текста |
| отсутствует | personality.ideals/bonds/flaws | Пустые строки |

### Безопасность миграции

- Миграция чистая и идемпотентная: v2 повторно не преобразуется после появления v3.
- Исходные v2/v1 JSON не перезаписываются и не удаляются.
- Неизвестные поля v2 не выбрасываются до решения о compatibility policy; валидатор должен либо сохранить их в extension-поле, либо сообщить о необходимости ручного разбора.
- Старые CharacterSkill.value копируются без округления, знака или пересчёта.
- Старые CharacterAttack.attackBonus копируются как строка, даже если содержат формулу или произвольный текст.
- При ошибке миграции v2 остаётся доступной, а UI показывает ошибку загрузки; mock-defaults не подменяют повреждённую запись.

## 13. Валидация v3

Минимальные правила:

- schemaVersion ровно 3;
- id и identity.name — непустые строки;
- identity.level — целое 1–20;
- identity.experience — целое не меньше 0;
- все ability scores — конечные целые;
- skill.proficiency — только none, proficient, expertise;
- skill.value — конечное число, если сохраняется manual fallback;
- savingThrows содержит ровно шесть ключей AbilityKey;
- deathSaves.successes/failures — целые 0–3;
- spell.level — 0–9, при этом cantrip имеет 0;
- preparedSpellIds не содержит дубликатов и ссылается только на knownSpells;
- spellSlot.max и used — целые, 0 ≤ used ≤ max;
- inventory.quantity — целое не меньше 0;
- денежные значения — целые не меньше 0;
- attackBonus остаётся строкой и не парсится;
- текстовые поля ограничиваются разумным размером для localStorage.

Производные поля проверяются тестами функций, а не валидируются как входной JSON.

## 14. Decision log

### D-01. Новая schemaVersion: 3

**Решение:** перейти с v2 на v3 при появлении вложенных разделов.

**Почему:** v2 имеет плоские bio, spells, cantrips, inventory и root armorClass; перенос в personality, spellcasting, inventory и combat меняет форму данных.

**Альтернатива:** оставить всё в v2 и добавлять поля рядом. Отклонена из-за дублирования и неясного источника истины.

### D-02. Modifiers не хранятся

**Решение:** сохраняются только raw ability scores; modifiers всегда вычисляются.

**Почему:** modifier однозначен, а сохранённое производное значение может устареть после изменения score.

**Альтернатива:** кэшировать modifier в JSON. Отклонена из-за риска рассинхронизации.

### D-03. Proficiency bonus не редактируется

**Решение:** вычислять его по level.

**Почему:** PHB задаёт единую таблицу уровней 1–20.

**Альтернатива:** хранить override. Оставляется только как будущий extension для нестандартных правил, но не входит в v3.

### D-04. CharacterSkill.value сохраняется

**Решение:** value остаётся manual fallback, а computed-режим получает отдельный calculationMode.

**Почему:** текущая модель уже хранит введённые числа, и их нельзя трактовать задним числом как правила D&D.

**Альтернатива:** заменить value на bonus. Отклонена из-за потери данных и неясной миграции.

### D-05. Saving throws хранят флаги, а не итоги

**Решение:** хранить proficient и additionalBonus, итог вычислять.

**Почему:** итог зависит от ability score и level, а дополнительные бонусы должны быть видны отдельно.

**Альтернатива:** хранить шесть итоговых чисел. Отклонена из-за устаревания.

### D-06. Attack bonus сохраняет строковый legacy-канал

**Решение:** attackBonus:string остаётся обязательным полем записи, computed-режим работает только при явном выборе.

**Почему:** старые атаки могут содержать +4, 1d20+5 или заметку; безопасно распознать их нельзя.

**Альтернатива:** преобразовать строки в числа. Отклонена из-за потери и неверной интерпретации.

### D-07. Spell slots хранят max и used

**Решение:** остаток выводится как max - used.

**Почему:** сохраняются и лимит, и расход; восстановление после отдыха не требует угадывать максимум.

**Альтернатива:** хранить только remaining. Отклонена: теряется максимум.

### D-08. Known/prepared — список и ссылки

**Решение:** known spells хранят записи, prepared — список ID.

**Почему:** одна запись заклинания не дублируется, а смена статуса prepared не изменяет описание.

**Альтернатива:** boolean prepared в каждом spell object. Отклонена из-за смешивания каталожных и пользовательских данных.

### D-09. Расовые бонусы не применяются автоматически

**Решение:** сохранять их как источник, raw ability scores не менять.

**Почему:** повторная миграция или смена расы не должна дважды прибавить бонус.

**Альтернатива:** прибавлять бонус при выборе race. Отклонена до появления журнала применённых модификаторов.

### D-10. AC имеет manual/computed режим

**Решение:** старое значение переносится в manual combat.armorClass.value; вычисление включается только после выбора брони/щита.

**Почему:** AC зависит от экипировки и ограничений Dexterity.

**Альтернатива:** всегда считать 10 + Dex. Отклонена: неверно для брони и щитов.

### D-11. class остаётся строкой

**Решение:** class и subclass — текстовые identity-поля; справочник классов не является частью v3.

**Почему:** сохраняется текущий формат и нет привязки листа к одному источнику правил.

**Альтернатива:** отдельный ClassProfile с прогрессией. Отклонена до отдельного rules/catalog этапа.

## 15. Не входит в модель v3

- backend, HTTP API, PostgreSQL и Character System;
- синхронизация между игроками и multiplayer;
- каталог рас, классов, background или заклинаний;
- автоматический level-up, multiclass и классовые features;
- полная экономика, весовая нагрузка и автоматическое управление экипировкой;
- parser формул урона и dice roller;
- автоматическое применение расовых/предметных бонусов;
- авторизация и серверное владение персонажем.

После утверждения этого документа следующий этап должен подготовить отдельный план мигратора и тестов v2→v3. До такого подтверждения код и компоненты не изменяются.

