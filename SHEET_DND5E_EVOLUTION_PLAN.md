# DND5e Character Sheet Evolution Plan

## Статус и границы

Документ описывает целевую эволюцию автономного листа персонажа в репозитории `dnd5v`. На этом шаге изменяется только документация: исходный код, `localStorage`, тесты и конфигурация не меняются.

В плане сохранены текущие технические ограничения:

- Vue 3, Composition API, TypeScript, Vite и существующий UI-kit;
- mock Character API и `localStorage` как текущий способ хранения;
- `schemaVersion: 2` как совместимый envelope;
- четыре существующие вкладки листа;
- ручные значения, введённые пользователем, имеют приоритет над будущими вычислениями;
- backend, HTTP API, multiplayer, Nastolka и `my-table` не входят в реализацию этого этапа.

Правила ниже основаны на предоставленном русском Player's Handbook D&D 5e. В качестве базовой редакции принимается PHB 2014; различия с более поздними редакциями нужно будет согласовать отдельным решением до реализации рас, классов и каталога заклинаний.

Ориентиры в книге: модификаторы характеристик и базовые правила создания — PDF, с. 13–16; владение и expertise — с. 21; пример расчётов заклинателя — с. 54; описание личности и предысторий — разделы примерно с. 121; снаряжение — примерно с. 143; заклинания — с. 211 и далее.

## 1. Текущее состояние

### Архитектура

`src/modules/character-sheet/CharacterSheetPage.vue` является контейнером листа. Он вызывает `useCharacterSheet`, показывает состояния загрузки и ошибки, сохраняет общий черновик и переключает вкладки:

1. Основное;
2. Магия / Заклинания;
3. Инвентарь;
4. БИО.

Модель находится в `src/modules/character-sheet/types/character.ts`. В ней уже есть имя, класс, уровень, опыт, КД, шесть характеристик, навыки, атаки, заклинания, заговоры, инвентарь, деньги и три текстовых поля био.

Текущий state/mock-контур:

- `useCharacterSheet.ts` хранит черновик и последнюю сохранённую копию;
- `characterApi.ts` предоставляет абстракцию получения и сохранения;
- `characterMockApi.ts` имитирует задержку и ошибки;
- `characterStorage.ts` читает и пишет versioned `localStorage`;
- `characterMigration.ts` переводит историческую v1-запись в v2;
- `characterValidation.ts` проверяет структуру перед чтением и сохранением.

### Ограничения текущей v2

- `class` — строка, без subclass и источника правил;
- `level`, `experience`, `armorClass` — сохраняемые поля без связанных расчётов;
- модификатор характеристики вычисляется, но не хранится;
- `skill.value` — ручное число, его семантика пока не заменена rules engine;
- у навыка уже подготовлены `ability` и `proficiency`, но они не меняют отображаемый ручной `value`;
- атака совместима со старым `attackBonus: string` и имеет `bonusSource`/`additionalBonus`, без парсинга формул;
- заклинания, заговоры и предметы — пользовательские записи, а не справочники;
- `bio` пока содержит `biography`, `traits`, `features`.

## 2. Целевая модель Character

Модель проектируется как расширение существующего v2 envelope. Новые разделы добавляются аддитивно и получают defaults при чтении старых записей. Производные значения не должны становиться вторым источником истины.

### Identity

| Поле | Назначение | Правило хранения |
|---|---|---|
| `id` | Стабильный идентификатор персонажа | Сохраняется как есть |
| `name` | Имя персонажа | Существующее обязательное поле |
| `playerName` | Имя игрока | Новое необязательное текстовое поле, default — пустая строка |
| `portrait` | Ссылка/ключ изображения | Не загружать файл на этом этапе; nullable и необязательное |
| `alignment` | Мировоззрение | Текстовое поле, без каталога допустимых значений |

`portrait` не должен превращаться в data URL большого размера без отдельного решения о лимите. Пока разрешается только короткий URL или локальный ключ.

### Race

| Поле | Назначение |
|---|---|
| `name` | Раса из PHB, введённая/выбранная пользователем |
| `subrace` | Подраса, если применима |
| `size` | Размер, например Medium или Small |
| `speed` | Базовая скорость в футах |
| `traits` | Человекочитаемые расовые особенности |
| `abilityBonuses` | Бонусы к характеристикам как данные источника, без автоматического применения на первом проходе |
| `languages` | Языки |

Расовые бонусы не должны молча менять введённые ability scores. До появления явного режима выбора пользователь видит исходные значения и отдельно источник расового бонуса.

### Class и progression

| Поле | Назначение |
|---|---|
| `name` | Текущий класс; совместимо с существующим `class` |
| `subclass` | Архетип/подкласс, необязательный текст |
| `level` | Уровень 1–20; существующее поле |
| `experience` | Опыт; существующее поле, неотрицательное целое |
| `hitDie` | Размер кости хитов как данные класса |
| `spellcastingAbility` | `AbilityKey` или null для классов без магии/не настроенных заклинателей |
| `classFeatures` | Краткие заметки об особенностях класса, не rules engine |

Текущие `class`, `level`, `experience` сохраняются. `hitDie`, `subclass`, `spellcastingAbility` и `classFeatures` получают безопасные defaults.

### Background

| Поле | Назначение |
|---|---|
| `name` | Название предыстории |
| `feature` | Особенность предыстории |
| `skillProficiencies` | Идентификаторы навыков с владением |
| `toolProficiencies` | Владение инструментами |
| `languages` | Дополнительные языки |
| `notes` | Свободные заметки |

Предыстория не должна автоматически перезаписывать установленное владение навыком. При конфликте показывается источник и требуется явное действие пользователя.

### Ability scores и производные значения

Хранятся шесть исходных значений: Strength, Dexterity, Constitution, Intelligence, Wisdom и Charisma. Модификатор всегда вычисляется из исходного score и не хранится отдельно.

Для совместимости с текущей моделью `abilities` остаётся плоской записью `AbilityKey → number`. Целевой UI может группировать данные по карточкам, но не меняет формат без отдельной миграции.

Производные значения:

- ability modifier;
- proficiency bonus по уровню;
- initiative из Dexterity modifier и ручной поправки;
- passive Perception из Wisdom modifier + proficiency, если применимо;
- skill bonus и saving throw bonus.

### Proficiency bonus

Proficiency bonus выводится только из level. Таблица PHB:

| Уровни | Бонус |
|---|---:|
| 1–4 | +2 |
| 5–8 | +3 |
| 9–12 | +4 |
| 13–16 | +5 |
| 17–20 | +6 |

Уровень вне диапазона 1–20 считается ошибкой валидации. Автоматический level-up, выдача опыта и выбор классовых особенностей в этот план не входят.

### Saving throws

Для каждой из шести характеристик хранится состояние владения:

- `none`;
- `proficient`.

Итоговый бонус сохраняется только как вычисленное представление. Пользовательский override допускается лишь как явно обозначенный ручной режим, чтобы не потерять текущие данные. Один и тот же proficiency bonus не складывается дважды.

### Skills

Текущая структура навыка сохраняется:

- стабильный `id`;
- отображаемое `name`;
- связанная `ability`;
- `proficiency: none | proficient | expertise`;
- `value` как legacy/manual значение.

Для будущего rules-режима добавляется понятие `calculationMode: manual | computed` или эквивалентный явный признак. До его включения `value` продолжает отображаться и сохраняться как ручной итог. Это устраняет неоднозначность без удаления поля.

При вычислении:

- `none` = modifier способности;
- `proficient` = modifier способности + proficiency bonus;
- `expertise` = modifier способности + 2 × proficiency bonus.

Expertise разрешается только для навыка, у которого есть обычное владение; проверка и предупреждение должны быть явными, а не тихим исправлением данных.

### Combat stats

Текущий `armorClass` сохраняется как ручное значение. Целевая модель готовит раздел:

| Поле | Статус |
|---|---|
| `armorClass` | Существующее ручное/итоговое значение |
| `armorClassMode` | `manual` или `computed`, вводить после согласования |
| `armor` | Название/тип надетой брони |
| `shieldBonus` | Бонус щита |
| `armorDexCap` | Ограничение Dexterity modifier для брони |
| `initiativeBonus` | Ручная поправка к инициативе |
| `speed` | Скорость из race/class/equipment |
| `hitPoints.max` | Максимум хитов |
| `hitPoints.current` | Текущие хиты |
| `hitPoints.temporary` | Временные хиты |
| `hitDice` | Количество и размер костей хитов |
| `deathSaves` | Успехи и провалы |

На первом rules-проходе достаточно сохранить `armorClass` и добавить безопасные необязательные поля. Формула брони не должна заменять введённый AC без выбранной брони и щита.

### Attacks

В v2 остаются `attackBonus: string`, `bonusSource` и `additionalBonus`. Целевой нормализованный набор:

- `name`;
- `kind: melee | ranged | spell | other`;
- `abilitySource: AbilityKey | manual`;
- `proficient: boolean`;
- `additionalBonus: number`;
- `attackBonus` как legacy/manual отображение;
- `damage` как свободный текст;
- `damageType` как необязательный текст;
- `range` как необязательный текст;
- `description`.

Если выбран computed-режим, бонус атаки равен modifier выбранной способности + proficiency bonus при `proficient` + `additionalBonus`. Если остаётся manual-режим, старый `attackBonus` показывается без попытки распарсить строку. Расчёт урона и формул не добавляется.

### Spells и cantrips

Существующие коллекции `spells` и `cantrips` сохраняются. Запись заклинания может постепенно получить:

- `name`;
- `level` (0 для cantrip, 1–9 для заклинания);
- `school`;
- `castingTime`;
- `range`;
- `components`;
- `duration`;
- `concentration`;
- `ritual`;
- `description`.

Дополнительные поля необязательны и не требуются для загрузки старой записи. Каталог заклинаний, автоматическое изучение и проверка полного текста PHB не входят в эту эволюцию.

В разделе spellcasting нужны:

- выбранная `spellcastingAbility`;
- computed `spellSaveDc`;
- computed `spellAttackModifier`;
- явное состояние «не настроено», если способность не выбрана.

### Inventory и money

Текущий предмет сохраняет `id`, `name`, `quantity`, `description`. Для дальнейшего sheet допускаются:

- `category`;
- `weight`;
- `cost`;
- `equipped`;
- `attunement`.

Количество должно оставаться неотрицательным целым. Деньги сохраняются пятью видами монет; автоматическая конвертация и расчёт богатства не выполняются без отдельного решения.

### Personality

Существующие поля `bio.biography`, `bio.traits`, `bio.features` сохраняются. Целевая форма расширяется аддитивно:

- `personalityTraits`;
- `ideals`;
- `bonds`;
- `flaws`;
- `backstory` как понятное имя для текущей biography;
- `featuresAndTraits` как понятное имя для текущей features.

На миграции старые названия не удаляются одномоментно: UI работает через нормализованный адаптер, а сохранение продолжает записывать совместимые значения до отдельного решения о v3.

## 3. Обратная совместимость schema v2

### Основные правила

1. Корневой `schemaVersion: 2` остаётся действующим.
2. Все новые разделы получают defaults при чтении v2-записи.
3. Отсутствие нового поля не считается повреждением старого листа.
4. Legacy `skill.value` и `attack.attackBonus` никогда не перезаписываются вычисленным значением автоматически.
5. Производные значения вычисляются в памяти и не становятся обязательными ключами storage.
6. Старый ключ v1 продолжает читаться через существующий мигратор; исходная v1-запись не удаляется.
7. Поля с потенциально несовместимой семантикой добавляются как optional, пока не утверждены тестами и UI.
8. Если в будущем понадобится breaking change, вводится отдельная `schemaVersion: 3`; silent-перезапись v2 запрещена.

### Слой defaults/migration

Существующий `characterMigration.ts` должен получить следующий порядок нормализации:

1. проверить envelope и версию;
2. дополнить identity/race/class/background пустыми значениями;
3. дополнить combat и personality безопасными defaults;
4. нормализовать proficiency и calculation mode без изменения ручных чисел;
5. проверить диапазоны level, abilities, quantity и money;
6. вернуть независимую копию модели.

Данные неизвестной версии, повреждённые числа и некорректные коллекции должны приводить к понятной ошибке загрузки, а не к замене всего персонажа mock-defaults.

## 4. Расчёты по правилам PHB

### Модификатор характеристики

Модификатор равен `floor((ability score - 10) / 2)`. Это совпадает с уже используемым `domain/abilityModifier.ts`. Значения из таблицы PHB: 8–9 дают −1, 10–11 дают +0, 12–13 дают +1, 18–19 дают +4.

### Бонус навыка

`skill bonus = ability modifier + proficiency bonus`, если навык proficient. Для expertise добавляется двойной proficiency bonus. При `calculationMode: manual` показывается сохранённый `value`.

### Спасброски

`saving throw = ability modifier + proficiency bonus`, если для характеристики есть владение. Иначе — только modifier. Ручной override должен быть виден отдельно от вычисленного значения.

### Бонус атаки

Для computed-атаки:

`attack bonus = source ability modifier + proficiency bonus (если proficient) + additionalBonus`.

Способность выбирается источником атаки, а не выводится по названию. Для legacy/manual атаки строка `attackBonus` является итогом, который нельзя разбирать регулярным выражением.

### Spell save DC и spell attack

Если задана spellcasting ability:

- `spell save DC = 8 + proficiency bonus + spellcasting ability modifier`;
- `spell attack = proficiency bonus + spellcasting ability modifier`.

Если ability не задана, UI показывает `—` и не подставляет Charisma или другую способность автоматически. Это важно для персонажей, где класс или источник магии ещё не выбран.

### Armor Class

Для невооружённого персонажа PHB использует 10 + Dexterity modifier. Итоговый AC при броне и щите зависит от экипировки и ограничения Dexterity. Поэтому существующее ручное `armorClass` сохраняется, а computed-режим вводится только вместе с явной моделью брони.

## 5. Планируемые изменения существующих файлов

Это список будущих изменений, а не выполненные правки.

### Модель и хранение

- `src/modules/character-sheet/types/character.ts` — расширить типы identity, race, class, background, saves, combat, personality и нормализованные записи attacks/spells/inventory; сохранить legacy-поля.
- `src/modules/character-sheet/validation/characterValidation.ts` — добавить проверку optional-разделов, диапазона level, конечности чисел, режимов manual/computed и уровня заклинаний.
- `src/modules/character-sheet/migration/characterMigration.ts` — дополнить defaults для v2 без удаления и пересчёта ручных значений.
- `src/modules/character-sheet/api/characterStorage.ts` — сохранять расширенный v2 envelope и удержать текущие versioned keys.
- `src/modules/character-sheet/data/character.mock.ts` — добавить демонстрационные identity/race/background/combat/personality данные без справочника правил.
- `src/modules/character-sheet/data/characterFields.ts` — хранить метаданные подписей и связей характеристик/навыков.

### Domain-расчёты

- `src/modules/character-sheet/domain/abilityModifier.ts` — оставить текущую чистую функцию и расширить тестовые случаи.
- `src/modules/character-sheet/domain/attackBonus.ts` — поддержать computed/manual режим, не меняя поведение legacy строк.
- `src/modules/character-sheet/domain/proficiencyBonus.ts` — новый чистый модуль таблицы уровня 1–20.
- `src/modules/character-sheet/domain/skillBonus.ts` — новый модуль для none/proficient/expertise/manual.
- `src/modules/character-sheet/domain/savingThrow.ts` — новый модуль бонуса спасброска.
- `src/modules/character-sheet/domain/spellcasting.ts` — новый модуль DC и spell attack с null-состоянием.
- `src/modules/character-sheet/domain/armorClass.ts` — добавлять только после утверждения модели брони; до этого достаточно существующего ручного AC.

### State и UI

- `src/modules/character-sheet/composables/useCharacterSheet.ts` — обновить patch/update методы для новых разделов и сохранить один черновик.
- `src/modules/character-sheet/CharacterSheetPage.vue` — подключить новые секции без изменения API-границы mock слоя.
- `src/modules/character-sheet/components/CharacterMainTab.vue` — identity, race, class/background, abilities, saves, skills и combat.
- `src/modules/character-sheet/components/AbilityFields.vue` — показать raw score и derived modifier.
- `src/modules/character-sheet/components/SkillFields.vue` — добавить явное состояние ручного/вычисляемого значения и proficiency.
- `src/modules/character-sheet/components/AttackEditor.vue`, `AttackList.vue` — сохранить старый ввод и добавить computed-настройки.
- `src/modules/character-sheet/components/SpellList.vue`, `SpellEditor.vue` и вкладка магии — spellcasting summary и дополнительные поля записи.
- `src/modules/character-sheet/components/InventoryList.vue`, `InventoryItemEditor.vue` — optional weight/equipped/category без усложнения текущего CRUD.
- `src/modules/character-sheet/components/CharacterBioTab.vue` — personality traits, ideals, bonds и flaws.
- `src/modules/character-sheet/styles/character-sheet.css` — layout и parchment-поверхности, без замены темы проекта.

### Проверки

- `tests/character-sheet/characterValidation.test.ts` — defaults, v2 compatibility и rejection некорректных диапазонов.
- Новый `tests/character-sheet/characterRules.test.ts` — таблица modifiers, proficiency, skills, saves и spellcasting.
- Новый `tests/character-sheet/characterMigration.test.ts` — старые v1/v2 записи и сохранение manual values.
- `tests/character-sheet/browser-check.mjs` — сценарии редактора и переключение manual/computed.

Файлы `src/App.vue`, UI-kit, backend, `my-table`, `nastolka-sheet-dnd5` вне текущего репозитория и legacy API этим планом не изменяются.

## 6. Новые компоненты

Компоненты должны оставаться небольшими и использовать существующие `CInput`, `CTextarea`, `CBtn`, `CCard`, `CTabs`, `CModal`.

### Основное

- `IdentityFields.vue` — имя, игрок, мировоззрение, portrait key.
- `RaceFields.vue` — race/subrace, size, speed, traits и languages.
- `ClassProgressionFields.vue` — class, subclass, level, experience, hit die и spellcasting ability.
- `BackgroundFields.vue` — background feature и proficiency notes.
- `DerivedStatsCard.vue` — proficiency bonus, initiative, passive Perception.
- `SavingThrowFields.vue` — шесть saves и флаги proficiency.
- `CombatStatsFields.vue` — AC, HP, speed, hit dice и death saves.

### Навыки и атаки

- `SkillRow.vue` — одна строка с ability, proficiency, manual/computed value и подписью источника.
- `SkillFields.vue` остаётся контейнером списка, а не большим редактором.
- `AttackEditor.vue` расширяется без распознавания формул.
- `AttackCalculationSummary.vue` — поясняет, из чего получен computed bonus.

### Магия, инвентарь и личность

- `SpellcastingSummary.vue` — ability, DC, attack modifier и состояние «не настроено».
- `SpellDetailsEditor.vue` — дополнительные поля заклинания, все необязательные.
- `InventoryDetailsEditor.vue` — вес, стоимость, category, equipped и attunement.
- `PersonalityFields.vue` — traits, ideals, bonds, flaws и backstory.

Общие `DerivedValue`, `SectionCard`, `SourceBadge` и `EmptyCollection` можно вынести только после появления повторения. Не создавать второй UI-kit или монолитный `CharacterSheetPage.vue`.

## 7. UI-концепция

### Визуальное направление

Используется классический образ character sheet: светлая пергаментная поверхность, тёмно-коричневые акценты, тонкие рамки карточек и контрастные заголовки секций. Визуальные изменения ограничиваются существующей темой и CSS проекта; изображения, шрифты и отдельный дизайн-системный пакет не добавляются.

### Desktop

- верхняя строка: identity, class/level/background и статус сохранения;
- основное: две колонки — abilities/saves/skills и combat/attacks;
- magic: summary spellcasting над двумя списками cantrips/spells;
- inventory: предметы слева, деньги и переносимый вес справа;
- bio: широкие многострочные блоки.

Производные значения визуально отделяются от полей ввода. Для каждого computed значения должна быть короткая подсказка с формулой и источником.

### Mobile

- одна колонка и последовательные секции;
- вкладки не обрезают подписи и допускают горизонтальную прокрутку либо компактный список;
- sticky-кнопка сохранения не перекрывает поля;
- карточки атак, заклинаний и предметов раскрываются вертикально;
- модальные подтверждения остаются доступными с клавиатуры и не требуют hover.

### Удобство заполнения

- raw score и modifier расположены рядом;
- ручное и computed значение явно подписаны;
- ошибки показываются у поля и не очищают черновик;
- отмена редактора восстанавливает копию записи;
- пустые разделы имеют понятный призыв к добавлению;
- ввод не зависит от backend или сетевого соединения.

## 8. Порядок реализации

### EV-01 — зафиксировать rules contract

Описать границы редакции PHB, допустимые диапазоны, таблицу proficiency и правила ручного режима. Результат — тестовые примеры до изменения UI.

### EV-02 — расширить v2 defaults

Добавить типы optional-разделов и migration/default layer. Сначала проверить чтение существующих localStorage данных; не менять существующие значения.

### EV-03 — чистые расчёты

Добавить и покрыть тестами proficiency, skill, save и spellcasting helpers. Ability modifier оставить совместимым с текущим helper.

### EV-04 — identity, race, class и background

Добавить поля и секции без автоматического применения расовых бонусов и классовых features.

### EV-05 — saves, skills и combat

Добавить явные proficiency-флаги, manual/computed режим и combat-поля. Сначала сохранить ручные `value`, `attackBonus` и `armorClass`.

### EV-06 — attacks и magic

Подключить computed attack bonus и spellcasting summary. Способность заклинаний выбирается явно; каталог заклинаний и damage parser не добавляются.

### EV-07 — inventory, personality и responsive UI

Расширить формы предметов и био, затем пройти desktop/mobile сценарии, localStorage migration и сохранение после перезагрузки.

Каждый этап заканчивается `typecheck`, тестами логики и `npm run build`. Массовый рефакторинг между этапами запрещён.

## 9. Риски и решения

| Риск | Решение в плане |
|---|---|
| Неясно, является ли `skill.value` бонусом или ручным числом | Сохранить поле, добавить явный manual/computed режим и не пересчитывать автоматически |
| Старые атаки содержат произвольные строки | Оставить manual режим; computed доступен только при выборе источника |
| Расовые бонусы могут дважды примениться | Хранить источник отдельно и не менять raw ability score без подтверждения |
| AC зависит от брони, щита и ограничения Dex | Оставить ручной AC до появления явной armor model |
| У разных классов разная spellcasting ability | Хранить `AbilityKey | null`, не угадывать значение |
| Expertise требует обычного proficiency | Показывать предупреждение и не исправлять данные молча |
| Поля заклинаний и инвентаря разрастаются | Делать их optional и вводить по этапам |
| Large portrait/data URL раздует localStorage | Использовать короткий URL/ключ и отдельное решение для файлов |
| Смена редакции правил | Зафиксировать PHB 2014; новую редакцию оформлять отдельным rules contract |
| Добавление новых полей может превратить v2 в неявную v3 | Только additive defaults; breaking изменения требуют отдельного schemaVersion |

## 10. Что не входит в этот план

- backend, GraphQL, REST, PostgreSQL и Character System;
- авторизация, multiplayer, realtime и синхронизация между клиентами;
- перенос в `my-table` или изменение `Nastolka`;
- каталог рас, классов, навыков и заклинаний как база данных;
- полноценный D&D rules engine, level-up, multiclass и выбор feature;
- автоматическая генерация листа по классу/расе;
- парсинг формул урона и бросков;
- автоматический расчёт веса, стоимости и конвертации денег;
- импорт/экспорт PDF и загрузка изображений;
- изменение текущего UI-kit без подтверждённой необходимости.

## 11. Критерии готовности будущей реализации

План считается выполненным только после того, как реализация, следующая ему, подтвердит:

- существующие v1/v2 localStorage записи открываются без потери ручных значений;
- все производные числа вычисляются из одного источника и имеют unit tests;
- manual/computed режимы видны пользователю и не смешиваются;
- level 1–20 даёт правильный proficiency bonus;
- skills, saves, attacks и spellcasting используют согласованные формулы;
- четыре вкладки остаются рабочими на desktop и mobile;
- редактирование, отмена, удаление, сохранение и повторная загрузка сохраняют текущую семантику;
- `npm run typecheck`, тесты и `npm run build` проходят без отключения strict TypeScript;
- никаких запросов к backend/OIDC/Socket.IO нет.

До отдельного подтверждения этот документ является архитектурным планом. Код, модели storage и UI по нему не изменяются.
