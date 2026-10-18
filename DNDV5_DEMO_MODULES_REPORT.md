# DND5V — единая demo-ветка

## Ветка и источник

- Ветка: `feature/nastolka-demo-modules`.
- База: `feature/character-sheet-final`.
- Ветка создана от commit `6627eca`.
- Dice Roller и Initiative Tracker уже присутствуют в текущей архитектуре dnd5v в `src/modules/table-components/` и ранее были перенесены из локального проекта `D:\проект днд\nastolka-table-components`.
- Источник Dice Roller: локальный commit `06003d0` (`master`), включая PNG d4–d100, динамический выбор, rolling/landing, d100 result sync, history и fallback.

## Разделение модулей

- Character Sheet: `src/modules/character-sheet/` — создание персонажа, species/background/class, assets и fallback, старые v3 данные, draft/save/cancel, вкладки и adapter.
- Level Up: существующие `LevelUpModal.vue`, `characterProgression.ts` и progression-блок Character Sheet. Повышение ограничено одним уровнем и максимумом 20, история и preview choices сохраняются через текущий flow.
- Dice Roller: `src/modules/table-components/components/dice/`, `domain/dice.ts`, `assets/dice/` и `TableComponentsShowcase.vue`.
- Initiative Tracker: `src/modules/table-components/components/initiative/` и `domain/initiative.ts`.

Новая архитектура, backend, API, storage и миграции не добавлялись. `TableStub`, `node_modules`, `dist` и Git-история другого репозитория не переносились.

## Проверки

- `npm run typecheck` — PASS.
- `npm test` — PASS, 118/118.
- `npm run build` — PASS вне sandbox; Vite собрал 268 модулей. В sandbox запуск блокировался `spawn EPERM`; это ограничение среды.
- `git diff --check` — PASS.

## Browser smoke

Проверен локальный `http://127.0.0.1:5173/`:

- Character Sheet и существующие species/class/background summary — отображаются.
- Level Up — preview открывается, отмена закрывает modal без изменения сохранённого персонажа.
- Dice Roller — выбор d4, d6, d8, d10, d12, d20 и d100 меняет PNG; rolling завершается числовым результатом.
- History — записи появляются, после пяти отображается сворачивание.
- Initiative Tracker — участники, сортировка и переход хода доступны.
- Viewport 1440×900, 1024×768, 430×932 и 375×812 — горизонтального overflow нет.
- Console — ошибок и предупреждений в проверенном tab не обнаружено.

Fallback для сломанного PNG присутствует в `RollingDie.vue`, но доступный browser API предоставляет только чтение DOM и не позволяет безопасно подменить `src` или dispatch-нуть `error`; этот сценарий не выдаётся за выполненный browser smoke.

## Commit и публикация

После добавления отчёта создаётся commit:

`feat(dnd5v): add demo character sheet level up and dice modules`

Push выполняется только в `origin/feature/nastolka-demo-modules`. Основные и существующие feature-ветки не изменяются.
