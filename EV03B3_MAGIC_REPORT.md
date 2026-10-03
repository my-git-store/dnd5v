# EV-03B.3 Magic UI Report

## Результат

Вкладка «Магия / Заклинания» подключена к Character v3 и существующему draft/save flow.

Добавлено:

- `SpellcastingSummary` с выбором spellcasting ability;
- вычисляемые spell save DC и spell attack bonus;
- состояние «Не настроено» при отсутствии способности;
- spell slots уровней 1–9 с редактированием `max` и `used`;
- derived значение оставшихся ячеек;
- CRUD заговоров через существующий встроенный редактор и `openConfirmModal`;
- список известных заклинаний с уровнем, описанием, поиском и редактированием;
- отметка подготовленных заклинаний;
- фильтр «Только подготовленные»;
- сохранение `preparedSpellIds` и spell slots в v3 snapshot.

Производные DC, attack bonus и remaining slots не сохраняются отдельно. Каталог заклинаний и автоматический подбор не добавлялись.

## Изменённые файлы

- `src/modules/character-sheet/types/characterView.ts` — добавлена v3 spellcasting projection.
- `src/modules/character-sheet/adapters/characterSheetAdapter.ts` — spellcasting передаётся между v3 snapshot и UI; при сохранении удалённые known spells удаляются из `preparedSpellIds`.
- `src/modules/character-sheet/composables/useCharacterSheet.ts` — добавлен update flow для spellcasting draft.
- `src/modules/character-sheet/CharacterSheetPage.vue` — подключено событие spellcasting.
- `src/modules/character-sheet/components/CharacterMagicTab.vue` — новая компоновка summary, slots, cantrips и known spells.
- `src/modules/character-sheet/components/SpellcastingSummary.vue` — новый summary-блок магии.
- `src/modules/character-sheet/components/SpellSlotsFields.vue` — новый блок ячеек уровней 1–9.
- `src/modules/character-sheet/components/SpellList.vue` — prepared toggle, prepared filter и сохранённый CRUD.
- `src/modules/character-sheet/styles/character-sheet.css` — стили summary, slots и prepared controls.
- `tests/character-sheet/characterSheetAdapter.test.ts` — round-trip проверка spellcasting, slots и prepared IDs.

## Сохранённые границы

- backend и API не подключались;
- `characterV3Storage.ts` не изменялся;
- migration layer и domain helpers не изменялись;
- spell slots хранят только `max` и `used`;
- derived значения рассчитываются при отображении;
- CRUD удаления использует существующую modal-систему;
- поиск работает только как фильтр отображения и не меняет исходные массивы.

## Проверки

- `npm run typecheck` — успешно.
- `npm test` — успешно, 26/26 тестов.
- `npm run build` — успешно.
- `git diff --check` — без ошибок содержимого; присутствуют только стандартные предупреждения Git о LF/CRLF.

Build сохраняет ранее известные предупреждения Rollup о комментариях `__PURE__` внутри `@vueuse/core`.

## Ограничения

- Нет каталога заклинаний и автоподбора known/prepared.
- SpellEditor редактирует текущие поля name, level и description; расширенные v3 metadata сохраняются adapter-ом.
- Визуальная браузерная проверка и backend Character API остаются отдельными этапами.
