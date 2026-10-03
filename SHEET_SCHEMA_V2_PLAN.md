# Sheet schema v2 plan

## Статус

Подготовлен безопасный переход локальной модели листа с `schemaVersion: 1` на `schemaVersion: 2`. Backend, API, `my-table` и другие репозитории не затрагиваются.

## Текущая схема v1

Текущий исторический формат содержит:

- `schemaVersion: 1`;
- `id`, `name`;
- `class`, `level`, `experience`, `armorClass` — в поздних v1-записях; самые старые записи могли их не иметь;
- шесть числовых `abilities`;
- навыки `{ id, name, value }`, где `value` является ручным значением;
- атаки `{ id, name, attackBonus, damage, description }`;
- `spells`, `cantrips`, `inventory`, `money`, `bio`.

Исторический ключ хранения:

```text
nastolka:character-sheet:v1:<id>
```

## Предлагаемая схема v2

Новая запись использует ключ:

```text
nastolka:character-sheet:v2:<id>
```

Корневой `Character` сохраняет существующие поля и имеет `schemaVersion: 2`.

### Навык

```ts
interface CharacterSkill {
  id: string
  name: string
  value: number
  ability: AbilityKey | null
  proficiency: 'none' | 'proficient' | 'expertise'
}
```

- `value` остаётся ручным значением и не удаляется.
- `ability` фиксирует связанную характеристику.
- `proficiency` подготовлен для будущего, но пока не участвует в вычислениях.
- Для неизвестного навыка `ability` допускает `null`.

### Атака

```ts
interface CharacterAttack {
  id: string
  name: string
  attackBonus: string
  bonusSource: 'manual' | AbilityKey
  additionalBonus: number
  damage: string
  description: string
}
```

`attackBonus` остаётся строкой для совместимости с ручными и старыми значениями. `bonusSource` и `additionalBonus` становятся нормализованными полями v2. Парсинг формул, расчёт урона и D&D rules engine не входят в схему.

### Данные персонажа

```ts
interface Character {
  id: string
  schemaVersion: 2
  name: string
  class: string
  level: number
  experience: number
  armorClass: number
  abilities: CharacterAbilities
  skills: CharacterSkill[]
  attacks: CharacterAttack[]
  spells: CharacterSpell[]
  cantrips: CharacterSpell[]
  inventory: InventoryItem[]
  money: CharacterMoney
  bio: CharacterBio
}
```

`class` — текстовое поле, `level` и `experience` — неотрицательные/положительные целые по текущим правилам, `armorClass` — неотрицательное целое. Эти поля пока не связаны с автоматическими правилами.

## Migration strategy

1. Чтение сначала проверяет `v2` key.
2. Если `v2` отсутствует, читается legacy `v1` key.
3. Для v1 применяются defaults отсутствующих полей:

   ```text
   class      = ""
   level      = 1
   experience = 0
   armorClass = 10
   ```

4. Навыки получают `ability` из стабильной таблицы стандартных навыков и `proficiency: 'none'`.
5. Атаки получают `bonusSource: 'manual'` и `additionalBonus: 0`.
6. Корневая версия меняется на `2` в памяти.
7. Повреждённые или неподдерживаемые данные не заменяются mock-defaults молча.
8. Legacy v1 key не удаляется и не перезаписывается автоматически.
9. При следующем сохранении запись валидируется как v2 и записывается в v2 key.

Миграция идемпотентна: повторное чтение уже преобразованной v2-записи не применяет v1 преобразования.

## Реализованные безопасные изменения

- Типы v2 и тип legacy v1 разделены.
- Добавлен чистый мигратор `migrateCharacterV1`.
- Storage читает оба ключа и сохраняет только v2.
- Validation разделяет допустимые формы v1 и v2.
- Добавлены тесты defaults, миграции навыков/атак и совместимости старого ручного бонуса.
- UI продолжает показывать ручные значения навыков и бонусов без новых D&D вычислений.

## Риски

- Записи с повреждёнными данными не мигрируют и требуют восстановления; это намеренно, чтобы не терять данные молча.
- Legacy v1 key остаётся в localStorage и не очищается автоматически.
- Значение `skill.value` всё ещё не имеет формальной семантики итогового бонуса; это нужно решить отдельно перед rules integration.
- `proficiency` и `expertise` пока только данные, без расчёта.
- `attackBonus` остаётся свободной строкой; серверный DTO в будущем должен явно согласовать это поле.
- Дальнейшее добавление полей потребует отдельной версии или расширения мигратора.

## Не входит в v2

- backend, HTTP API и PostgreSQL;
- перенос в `my-table`;
- авторизация и Character System;
- proficiency/expertise calculations;
- парсинг формул атаки и расчёт урона;
- каталог заклинаний;
- полноценные правила D&D, level-up и inventory engine;
- удаление legacy данных;
- новый UI и модальные окна.

## Файлы

Изменены:

- `src/modules/character-sheet/types/character.ts`
- `src/modules/character-sheet/data/characterFields.ts`
- `src/modules/character-sheet/data/character.mock.ts`
- `src/modules/character-sheet/validation/characterValidation.ts`
- `src/modules/character-sheet/api/characterStorage.ts`
- `src/modules/character-sheet/components/AttackList.vue`
- `src/modules/character-sheet/components/SkillFields.vue`
- `tests/character-sheet/characterValidation.test.ts`
- `tests/character-sheet/browser-check.mjs`

Добавлен:

- `src/modules/character-sheet/migration/characterMigration.ts`

