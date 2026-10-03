# CR-02 — Creation Expansion Report

Дата: 2026-10-02  
Репозиторий: `dnd5v`

## Итог

Вкладка «Создание» расширена поверх текущего Character v3 и adapter/draft flow. Добавлены безопасные варианты подрас, предысторий и стартовых наборов снаряжения. Backend, API, migration layer, storage architecture и domain helpers вне задачи не менялись.

## Реализовано

### Подрасы

- Добавлены подрасы для дварфа, эльфа, полурослика и гнома.
- Вариант содержит описание, дополнительные бонусы характеристик, особенности и языки.
- Профиль расы сохраняет выбранную подрасу, а бонусы пересчитываются от `creation.baseAbilityScores`.
- `subraceId`, `subraceFeatures`, `subraceLanguages` и `subraceSkillIds` сохраняются в creation metadata.
- Повторное применение и смена подрасы не накапливают бонусы и снимают предыдущий источник `race`.

### Предыстории

- Добавлены семь компактных вариантов: прислужник, преступник, народный герой, благородный, мудрец, солдат и беспризорник.
- Для каждой доступны описание, навыки, инструменты, языки, feature и небольшой стартовый набор.
- Профиль предыстории хранится в `identity.background`.
- Навыки получают источник `background`; смена предыстории снимает только старый background source и сохраняет race/class/manual.
- Инструменты и языки также пересобираются по своим tracked metadata.

### Стартовое снаряжение

- Для классов и предысторий добавлены небольшие фиксированные наборы выбора, без общего каталога предметов.
- Предметы создаются как обычные `inventoryData.items` с маркером `source: "creation"`.
- Идентификаторы детерминированы по персонажу, источнику, набору и позиции.
- Повторный выбор заменяет только ранее созданные creation items, поэтому дубликаты не появляются.
- Пользовательские предметы без маркера creation сохраняются.
- Старые вызовы доменного helper без equipment payload остаются без побочного добавления предметов.

### Flow UI

Добавлен wizard из девяти шагов:

`Имя → Раса → Подраса → Класс → Предыстория → Характеристики → Навыки → Снаряжение → Проверка`.

Есть итоговый экран «Персонаж готов». После применения черновик остаётся в текущем save flow; кнопка «Открыть лист» возвращает на основной лист. Компонент создания перемонтируется при возврате во вкладку, поэтому повторное открытие получает актуальный draft.

## Обратная совместимость

- `schemaVersion` не менялся.
- Новые поля в `CharacterCreationV3` optional.
- `raceAbilityChoices` теперь сохраняется, поэтому выборы half-elf не теряются после reload.
- Старые payload без background/equipment сохраняют прежнюю семантику и не заменяют существующий background или инвентарь.
- Legacy `attackBonus`, заклинания, атаки, inventory, personality и combat остаются в adapter round-trip.
- Старые inventory items без `source` проходят validation.

## Изменённые файлы CR-02

- `src/modules/character-sheet/types/characterV3.ts` — metadata подрасы/предыстории/equipment, marker источника inventory item.
- `src/modules/character-sheet/data/dnd5eOptions.ts` — подрасы, предыстории, небольшие equipment options и helpers поиска/объединения профилей.
- `src/modules/character-sheet/domain/characterCreation.ts` — детерминированное применение выбора, source tracking и idempotent starting equipment.
- `src/modules/character-sheet/adapters/characterSheetAdapter.ts` — безопасные defaults новых metadata и восстановление background/subrace skill sources.
- `src/modules/character-sheet/validation/characterV3Validation.ts` — проверка optional inventory source.
- `src/modules/character-sheet/components/CharacterCreationTab.vue` — девятишаговый flow, выбор подрасы/предыстории/снаряжения и финальный экран.
- `src/modules/character-sheet/CharacterSheetPage.vue` — подключение flow и возврат к листу после завершения.
- `src/modules/character-sheet/styles/character-sheet.css` — стили stepper и финального состояния.
- `tests/character-sheet/creation.test.ts` — регрессии подрасы, источников background, смены предыстории, equipment idempotency и reload.
- `CR02_CREATION_EXPANSION_REPORT.md` — этот отчёт.

## Проверки

- `npm run typecheck` — PASS.
- `npm test` — PASS, 38/38 тестов.
- `npm run build` — PASS.
- `git diff --check` — PASS; только стандартные предупреждения Git о преобразовании LF/CRLF.

Build выводит два существующих предупреждения Rollup о комментариях `@vueuse/core`; они находятся в `node_modules` и не влияют на успешную сборку.

## Ограничения и что не входит

- Не добавлялись подрасы/варианты вне компактного набора, feats, multiclass, progression или полноценный rules engine.
- Нет каталога предметов, автоматического расчёта стоимости/веса и сложных equipment restrictions.
- Дополнительные языки вроде «Дополнительный язык 1» требуют ручного уточнения пользователем.
- Browser automation в этой сессии не запускалась; проверены компиляция, unit/integration tests и production build.
- Следующий этап может подключать backend Character API, не меняя UI-контракт payload и adapter boundary.

CR-02 завершён. Дальнейшие этапы не начинались.
