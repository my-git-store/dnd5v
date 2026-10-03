# EV-01 Domain Report

## Результат

EV-01 завершён. В dnd5v добавлен чистый слой расчётов D&D 5e без изменения Character schema, localStorage, mock API и Vue-компонентов.

Производные значения не сохраняются. Helpers возвращают вычисленный результат либо null, когда исходных данных недостаточно.

## Изменённые файлы

Изменены:

- src/modules/character-sheet/domain/abilityModifier.ts
  - сохранена существующая формула;
  - добавлена null-safe функция для отсутствующих/некорректных значений.
- src/modules/character-sheet/domain/attackBonus.ts
  - сохранён legacy attackBonus:string;
  - добавлены manual/computed режимы;
  - поддержаны bonusSource и будущий abilitySource;
  - учтены proficiency и additionalBonus;
  - сохранено прежнее форматирование ручного бонуса.

Добавлены:

- src/modules/character-sheet/domain/proficiencyBonus.ts
- src/modules/character-sheet/domain/skillBonus.ts
- src/modules/character-sheet/domain/savingThrow.ts
- src/modules/character-sheet/domain/spellcasting.ts
- tests/character-sheet/characterRules.test.ts
- EV01_DOMAIN_REPORT.md

Файлы Character types, validation, migration, storage, mock API и Vue-компоненты в рамках EV-01 не менялись. Существующие изменения рабочей копии из предыдущих этапов не откатывались.

## Domain API

### Ability modifier

Формула:

floor((ability - 10) / 2)

Поддерживается null-safe вызов для отсутствующего или нечислового значения.

### Proficiency bonus

Таблица PHB:

- уровни 1–4: +2;
- уровни 5–8: +3;
- уровни 9–12: +4;
- уровни 13–16: +5;
- уровни 17–20: +6.

Уровень вне диапазона возвращает null.

### Skill bonus

Legacy skill без calculationMode считается manual и возвращает существующий CharacterSkill.value без пересчёта.

В computed-режиме:

- none: ability modifier + additionalBonus;
- proficient: ability modifier + proficiency bonus + additionalBonus;
- expertise: ability modifier + 2 × proficiency bonus + additionalBonus.

Если ability не настроена или для нужного режима недоступен level, возвращается null.

### Saving throw bonus

Для шести характеристик:

- без proficiency: ability modifier + additionalBonus;
- с proficiency: ability modifier + proficiency bonus + additionalBonus.

Не настроенная характеристика и некорректный необходимый level возвращают null.

### Attack bonus

Manual-режим возвращает legacy строку attackBonus. Она не парсится и не преобразуется в число.

Computed-режим:

ability modifier + proficiency bonus при proficient + additionalBonus

Поддержаны:

- текущий bonusSource;
- будущий abilitySource;
- отсутствие источника;
- legacy additionalBonus;
- явный calculationMode.

### Spell save DC

При настроенной spellcasting ability:

8 + proficiency bonus + ability modifier

Если способность или уровень не настроены, возвращается null.

### Spell attack bonus

При настроенной spellcasting ability:

proficiency bonus + ability modifier

Если способность или уровень не настроены, возвращается null.

## Проверки

- npm run typecheck — успешно.
- npm test — 13/13 успешно.
- npm run build — успешно.
- Rollup вывел только предупреждения о комментариях __PURE__ внутри @vueuse/core; это сторонняя зависимость и не относится к EV-01.
- В первой попытке build окружение заблокировало дочерний процесс esbuild с spawn EPERM; повторный запуск с разрешением процесса завершился успешно.

## Что не делалось

- Character schema не менялась.
- schemaVersion не менялась.
- localStorage и миграции не менялись.
- Mock API не менялся.
- Vue-компоненты и UI не подключали новые helpers.
- Backend, API и другие репозитории не затрагивались.

Следующий этап может подключить эти helpers к v3-adapter и UI после отдельного согласования миграции schemaVersion 2 → 3.

