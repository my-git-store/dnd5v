# EV-03B.2 UI Report

## Результат

Вкладка «Основное» получила боевой блок Character v3 поверх существующего draft/save flow.
Combat и атаки используют текущую v3-модель и sheet adapter; UI не обращается к localStorage или API напрямую.

### CombatStatsFields

Добавлен `CombatStatsFields.vue` с полями:

- armor class;
- manual/computed режим КД;
- initiative и дополнительная поправка;
- speed: base, override, fly, swim;
- hit points: max, current, temporary;
- hit dice: size, total, spent;
- death saves: successes, failures.

В computed-режиме КД и инициатива вычисляются при отображении. Производные значения не сохраняются отдельно. Ручной КД сохраняется в `combat.armorClass.value` и остаётся совместимым с мигрированными персонажами.

### AttackList и AttackEditor

Существующий список атак расширен без смены storage-контракта:

- название;
- тип атаки;
- источник способности;
- proficiency;
- manual/computed режим;
- ручной `attackBonus: string`;
- damage, damage type, properties и range;
- описание;
- редактирование и удаление через существующие `EntryActions` и `openConfirmModal`.

В computed-режиме итоговый attack bonus рассчитывается существующим helper. В manual-режиме исходная строка `attackBonus` показывается и сохраняется без разбора или преобразования.

## Изменённые файлы

- `src/modules/character-sheet/types/characterView.ts` — расширена UI-проекция полями combat и полной v3-моделью атаки.
- `src/modules/character-sheet/adapters/characterSheetAdapter.ts` — v3 combat и расширенные поля атак передаются в UI и записываются обратно; старые значения сохраняются.
- `src/modules/character-sheet/composables/useCharacterSheet.ts` — добавлено обновление combat draft и расширенного списка атак.
- `src/modules/character-sheet/components/CombatStatsFields.vue` — новый боевой блок.
- `src/modules/character-sheet/components/AttackList.vue` — отображение v3-полей атак, derived/manual статусы, edit/delete.
- `src/modules/character-sheet/components/AttackEditor.vue` — редактор типа, источника, proficiency, режима, урона и свойств атаки.
- `src/modules/character-sheet/components/CharacterMainTab.vue` — подключение combat и обновлённого списка атак.
- `src/modules/character-sheet/components/CharacterSheetPage.vue` — подключение события обновления combat.
- `src/modules/character-sheet/components/IdentityFields.vue` — редактирование уровня и опыта перенесено в identity-прослойку, чтобы убрать дублирование старого блока.
- `src/modules/character-sheet/styles/character-sheet.css` — стили combat-карточек, режимов, attack metadata и responsive layout.
- `tests/character-sheet/characterSheetAdapter.test.ts` — проверка round-trip combat и полной формы атаки с сохранением legacy bonus string.

## Что не изменялось

- backend и API;
- `characterV3Storage.ts` (storage adapter);
- migration layer;
- domain helpers;
- mock/localStorage format;
- dice roller, автоматическое применение урона и боевые правила.

## Проверки

- `npm run typecheck` — успешно.
- `npm test` — успешно, 25/25 тестов.
- `npm run build` — успешно.

Сборка сохраняет существующие предупреждения Rollup о комментариях `__PURE__` внутри `@vueuse/core`; ошибок проекта нет.

## Ограничения

- Computed AC использует только текущие поля v3 брони/щита и не является полноценным rules engine.
- Initiative, speed и HP не имеют автоматического расчёта от класса, уровня или экипировки.
- Attack bonus не парсит формулы и не запускает броски кубиков.
- Визуальная проверка браузером и интеграция с backend относятся к следующим этапам.
