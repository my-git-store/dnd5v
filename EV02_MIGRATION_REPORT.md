# EV-02 Migration Report

## Результат

EV-02 завершён. Реализован безопасный переход из Character schema v1/v2 в независимый Character v3 envelope.

Миграция:

- не удаляет v1/v2 localStorage keys;
- не перезаписывает исходные JSON при чтении;
- создаёт независимую v3-копию;
- сохраняет legacy ручные значения;
- не заменяет повреждённые данные mock-defaults;
- допускает повторный запуск без повторного преобразования.

## Изменённые и добавленные файлы

Добавлены:

- src/modules/character-sheet/types/characterV3.ts — типы v3 envelope и вложенных секций;
- src/modules/character-sheet/validation/characterV3Validation.ts — validation v3;
- src/modules/character-sheet/migration/characterMigrationV3.ts — v1/v2 → v3 и idempotent pass-through;
- src/modules/character-sheet/api/characterV3Storage.ts — отдельный v3 storage-adapter;
- tests/character-sheet/characterMigrationV3.test.ts — тесты миграции, validation и storage keys;
- EV02_MIGRATION_REPORT.md.

## Сопоставление данных

### Identity

- name → identity.name;
- class → identity.class;
- level → identity.level;
- experience → identity.experience;
- race, subclass, background и alignment получают безопасные defaults.

### Abilities

Шесть raw ability scores переносятся без изменений. Modifier не создаётся и не сохраняется.

### Skills

Для каждой записи сохраняются id, name, value, ability и proficiency.

Добавляются:

- calculationMode = manual для legacy записей;
- additionalBonus = 0, если его не было.

CharacterSkill.value не пересчитывается и не заменяется derived bonus.

### Attacks

Сохраняются attackBonus как строка, id, name, damage, description и additionalBonus.

bonusSource переносится в v3 abilitySource. Добавляются calculationMode = manual, proficient = false, kind = other и безопасные defaults для новых полей.

Legacy attackBonus не парсится.

### Combat

armorClass переносится в combat.armorClass.value с mode = manual. Остальные combat-поля получают безопасные defaults и не вычисляются автоматически.

### Spells

- v2 spells → spellcasting.knownSpells;
- v2 cantrips → spellcasting.cantrips;
- описания и исходные записи сохраняются;
- spellcasting ability — null;
- preparedSpellIds — пустой список;
- spell slots уровней 1–9 получают max/used = 0.

### Inventory и деньги

Предметы переносятся в inventory.items. Сохраняются id, name, quantity и description. Добавляются defaults weight = null, equipped = false и properties = [].

Все пять денежных номиналов переносятся без конвертации.

### Personality

- bio.biography → personality.biography;
- bio.traits → personality.traits;
- bio.features → personality.features;
- ideals, bonds и flaws получают пустые строки.

## Storage policy

Используются ключи:

- nastolka:character-sheet:v3:<id>;
- nastolka:character-sheet:v2:<id>;
- nastolka:character-sheet:v1:<id>.

Порядок чтения: v3, затем v2, затем v1. При обнаружении старой записи адаптер возвращает v3-копию в памяти. Запись v3 выполняется только явным вызовом write adapter.

Исходные v1/v2 ключи не удаляются и не изменяются. Текущий characterApi, mock API и UI продолжают работать с прежней v2-моделью; новый v3 adapter пока не подключается к ним.

## Сохранение неизвестных данных

Неизвестные поля корневого v2 объекта собираются в v3.extensions.

Неизвестные поля атак, заклинаний и предметов сохраняются при нормализации через object copy. Это предотвращает потерю дополнительных пользовательских данных при миграции.

## Тесты

Добавлены проверки:

- v2 → v3;
- v1 → v2 → v3;
- повторный запуск миграции;
- независимость возвращаемой копии;
- повреждённые v1/v2/v3 данные;
- сохранение attackBonus и CharacterSkill.value;
- сохранение spells, inventory и money;
- сохранение неизвестных root/nested полей;
- чтение v1/v2 keys;
- запись v3 без удаления старых keys;
- validation v3.

## Проверки

- npm run typecheck — успешно;
- npm test — 19/19 успешно;
- npm run build — успешно;
- в build остаются только предупреждения Rollup о комментариях __PURE__ в стороннем @vueuse/core.

## Ограничения

- v3 пока не подключена к текущему Vue UI и mock Character API;
- Character schema v2 и существующий runtime-контур не изменены;
- автоматический rules engine, computed UI, spell catalog и backend API не входят в EV-02;
- следующий этап должен отдельно согласовать v3 adapter для composable/UI и момент переключения storage.

