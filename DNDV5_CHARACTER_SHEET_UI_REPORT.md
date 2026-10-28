# DND5V — Character Sheet UI pass

Дата: 2026-10-27

## Изменения

- В списке «Черты персонажа» сохранено компактное отображение только названия и действий; длинное название сокращается через `…`, а полное значение доступно в `title` и при открытии редактора. Описание не удаляется из модели и не выводится в строке списка.
- Для полей листа добавлен единый вертикальный отступ между подписью и контролом (`input`, `select`, `textarea`), включая компактные поля навыков и модальные редакторы.
- После разделителя секции спасбросков добавлен небольшой отступ перед строкой заголовков «Добавка» / «Итог».
- В редакторе черты сохранена одноколоночная раскладка и увеличенная изменяемая textarea для длинного описания; draft/save/cancel остаются без изменений.

## Изменённые файлы

- `src/modules/character-sheet/components/CharacterFeatList.vue`
- `src/modules/character-sheet/styles/character-sheet.css`

## Проверки

- `npm run typecheck` — PASS.
- `npm test` — PASS, 124 теста.
- `npm run build` — PASS. Остались только существующие предупреждения Rollup о размере чанка и аннотациях в `@vueuse/core`.
- `git diff --check` — PASS.

## Browser smoke

Dev-сервер запускался на `http://127.0.0.1:5173/`. Локальный пакет Playwright и CUA недоступны (CUA возвращает ошибку kernel assets), поэтому для фактической проверки использован временный `npx playwright@1.52.0` с установленным Microsoft Edge. В проект зависимости и конфигурация не добавлялись.

Проверены viewport `1440×900`, `1024×768`, `800×800`, `430×932` и `375×812`: первый рендер, отсутствие overflow, русские пользовательские строки, адаптивная модалка черты и основные вкладки.

Проверены: пустое состояние без ложного класса и прогрессии; характеристики, навыки, спасброски, бой, магия, инвентарь, БИО; CRUD черты с длинным названием, ellipsis, скрытым описанием в списке и draft/save/cancel/delete; шаги создания персонажа; отступ после разделителя «Добавка / Итог»; центрированный loader и retry; все d4/d6/d8/d10/d12/d20/d100, landing, history, сворачивание и очистка; Initiative Tracker с добавлением, редактированием и переходом хода.

Browser diagnostics: `console.error` — 0, `console.warn` — 0, page errors — 0, failed requests — 0.

## Этап: сохранение и несколько персонажей

### Изменения

- В v3 storage добавлен безопасный индекс персонажей и отдельный ключ активного персонажа. Старые v1/v2/v3 ключи остаются читаемыми; schemaVersion и миграция не менялись.
- `useCharacterSheet` теперь поддерживает список, выбор, создание, копирование и удаление персонажей. Активный персонаж восстанавливается после reload, а после удаления последнего показывается явное empty state.
- Копирование сначала сохраняет исходный draft, поэтому виртуальный demo-персонаж не теряется. Все текущие поля листа проходят через существующий adapter/save flow.
- Добавлена единая панель управления персонажами и модальное подтверждение переключения, создания и удаления при наличии несохранённых изменений.
- Статус листа показывает «Сохранено» после успешной загрузки или записи и «Есть несохранённые изменения» после редактирования.

### Изменённые файлы

- `src/modules/character-sheet/api/characterV3Storage.ts`
- `src/modules/character-sheet/api/characterMockApi.ts`
- `src/modules/character-sheet/data/character.mock.ts`
- `src/modules/character-sheet/adapters/characterSheetAdapter.ts`
- `src/modules/character-sheet/composables/useCharacterSheet.ts`
- `src/modules/character-sheet/CharacterSheetPage.vue`
- `src/modules/character-sheet/components/CharacterManagerBar.vue`
- `src/modules/character-sheet/components/CharacterActionConfirmModal.vue`
- `src/modules/character-sheet/components/CharacterSheetHeader.vue`
- `src/modules/character-sheet/styles/character-sheet.css`
- `tests/character-sheet/characterCollection.test.ts`

### Проверки

- Unit-тесты покрывают безопасные defaults нового персонажа, сохранение HP/spell slots/feats/inventory/skills/spells, reload, индекс, копирование с новым ID, выбор активного персонажа, удаление, empty state и чтение старого v2 payload.
- `npm run typecheck` — PASS.
- `npm test` — PASS, 128 тестов.
- `npm run build` — PASS. Остались только существующие предупреждения Rollup о размере чанков и аннотациях `@vueuse/core`.
- `git diff --check` — PASS.

### Browser smoke

Через реальный Microsoft Edge и временный Playwright проверены viewport `1440×900`, `1024×768`, `800×800`, `430×932` и `375×812`.

Проверены создание, копирование, редактирование имени, dirty/save status, сохранение и reload активного персонажа, отмена переключения с несохранёнными изменениями, удаление с подтверждением, автоматический выбор другого персонажа и empty state после удаления последнего. Проверен горизонтальный overflow на всех пяти размерах.

Diagnostics: `console.error` — 0, `console.warn` — 0, page errors — 0. Локальный Playwright и CUA недоступны в окружении; временный Playwright не добавлялся в проект.

## Этап 2: автоматические расчёты листа

### Изменения

- Вынесен расчёт инициативы в чистый domain helper: модификатор Ловкости плюс ручная добавка пересчитываются реактивно; навыки, спасброски и атаки также читают текущий уровень для бонуса мастерства.
- Для атак в режиме «Расчёт» отображается отдельный модификатор урона из выбранной характеристики. Свободный текст урона и атаки в ручном/legacy режиме не изменяются.
- В списке навыков добавлена явная отметка режима «Расчёт» / «Вручную»; ручное значение и дополнительная поправка остаются независимыми от derived-итога.
- В боевых карточках явно обозначены ручной КД и автоматически рассчитанная инициатива.
- Добавлены тесты на знаки модификаторов, уровни бонуса мастерства, зависимые навыки/спасброски/атаки, инициативу, spell DC/attack, manual priority и adapter round-trip после reload.

### Изменённые файлы

- `src/modules/character-sheet/domain/attackBonus.ts`
- `src/modules/character-sheet/domain/combatCalculations.ts`
- `src/modules/character-sheet/components/AttackList.vue`
- `src/modules/character-sheet/components/CombatStatsFields.vue`
- `src/modules/character-sheet/components/SkillFields.vue`
- `src/modules/character-sheet/styles/character-sheet.css`
- `tests/character-sheet/automaticCalculations.test.ts`

### Проверки

- `npm run typecheck` — PASS.
- `npm test` — PASS, 132 теста.
- `npm run build` — PASS. Остались только ранее известные предупреждения Rollup о размере чанков и аннотациях `@vueuse/core`.
- `git diff --check` — PASS.

### Browser smoke

Dev-сервер `http://127.0.0.1:5173/` проверен через временный Playwright 1.52.0 с установленным Microsoft Edge; проектные зависимости не менялись. Фактически проверены `1440×900`, `1024×768`, `800×800`, `430×932` и `375×812`: первый рендер, изменение Силы с немедленным обновлением модификатора, переходы во вкладки «Бой» и «Магия / Заклинания», отсутствие горизонтального overflow и локального переполнения новых режимных меток.

На всех размерах: `console.error` — 0, `console.warn` — 0, page errors — 0, failed requests — 0. Проверка реального ввода уровня/атаки/заклинания в браузере ограничена пустым персонажем без записей; формулы и сохранение их входов проверены unit/adapter-тестами.

## Этап 3: игровые действия

### Изменения

- Добавлены чистые операции короткого и длительного отдыха поверх существующих v3-полей: кости хитов, HP, временные HP, спасброски от смерти и ячейки заклинаний. Короткий отдых бросает доступные кости с модификатором Телосложения и ограничивает лечение максимумом HP; длительный отдых восстанавливает HP/ячейки и половину общего запаса костей хитов.
- В боевую вкладку добавлены подтверждение отдыха, выбор количества костей, disabled-состояния и сообщение о результате.
- Для ячеек заклинаний добавлены действия «Потратить» и «Вернуть» с границами `0..максимум`; действия сохраняются через существующий Save flow.
- Для атак добавлены броски атаки и урона на базе существующего dice-domain, отображение формулы/результата, защита от повторного клика и локальная история последних бросков. Ручные и legacy-бонусы не изменяются.
- В инвентаре добавлены inline-кнопки изменения количества, отметка расходуемости по существующему свойству предмета и действие «Использовать» с автосохранением. Отрицательное количество невозможно.
- Новых полей schema v3 и migration не потребовалось: используются существующие `combat`, `spellcasting.spellSlots` и `inventory.items`.

### Изменённые файлы

- `src/modules/character-sheet/domain/rest.ts`
- `src/modules/character-sheet/domain/rollFormula.ts`
- `src/modules/character-sheet/components/RestActions.vue`
- `src/modules/character-sheet/components/CharacterCombatTab.vue`
- `src/modules/character-sheet/components/AttackList.vue`
- `src/modules/character-sheet/components/SpellSlotsFields.vue`
- `src/modules/character-sheet/components/CharacterMagicTab.vue`
- `src/modules/character-sheet/components/InventoryList.vue`
- `src/modules/character-sheet/components/CharacterInventoryTab.vue`
- `src/modules/character-sheet/composables/useCharacterSheet.ts`
- `src/modules/character-sheet/CharacterSheetPage.vue`
- `src/modules/character-sheet/styles/character-sheet.css`
- `tests/character-sheet/restAndActions.test.ts`

### Проверки

- `npm run typecheck` — PASS.
- `npm test` — PASS, 138 тестов.
- `npm run build` — PASS. Сохранились только известные предупреждения Rollup о размере чанков и аннотациях `@vueuse/core`.
- `git diff --check` — PASS.

### Browser smoke

Dev-сервер проверен через временный Playwright 1.52.0 с установленным Microsoft Edge. Проверены `1440×900`, `1024×768`, `800×800`, `430×932` и `375×812`; на всех размерах ширина документа совпала с viewport.

На тестовом v3-персонаже реально проверены короткий отдых с тратой кости и лечением, длительный отдых с восстановлением HP/ячейки/спасбросков, бросок атаки, бросок урона, использование расходуемого предмета, использование ячейки, reload и сохранение изменённых значений. Browser diagnostics: `console.error` — 0, `console.warn` — 0, page errors — 0, failed requests — 0.

История бросков атаки отображается в текущей вкладке, как и существующая история общего Dice Roller; отдельная история атак не добавлялась в schema v3.

## Этап 4: переносимость данных и печать

### Изменения

- Добавлен JSON export текущего персонажа и всех сохранённых персонажей. Пакет содержит `schemaVersion`, `exportVersion`, дату экспорта и только данные персонажей; неизвестные служебные `extensions` и потенциальные секреты исключаются.
- Имя файла формируется из имени персонажа и даты. Для пакетного экспорта используется безопасное имя `personazhi-YYYY-MM-DD.json`.
- Добавлен импорт JSON с ограничением размера 2 МБ, проверкой структуры, миграцией v1/v2 через существующий `migrateCharacterToV3`, валидацией и preview имени/уровня/количества персонажей.
- Импорт поддерживает «Добавить как новых» и «Заменить текущего». При совпадении ID создаётся новый безопасный ID; текущий draft не записывается до подтверждения.
- Добавлены понятные success/error-состояния для экспорта и импорта, включая повреждённый JSON и oversized-файл.
- Добавлена кнопка «Печать листа». Перед browser print flow включается print-режим со всеми пятью разделами листа; служебная навигация, менеджер, кнопки и игровой стол скрываются через `@media print`.

### Изменённые файлы

- `src/modules/character-sheet/api/characterTransfer.ts`
- `src/modules/character-sheet/composables/useCharacterSheet.ts`
- `src/modules/character-sheet/components/CharacterManagerBar.vue`
- `src/modules/character-sheet/components/CharacterImportModal.vue`
- `src/modules/character-sheet/components/CharacterSheetHeader.vue`
- `src/modules/character-sheet/CharacterSheetPage.vue`
- `src/modules/character-sheet/styles/character-sheet.css`
- `tests/character-sheet/characterTransfer.test.ts`

### Проверки

- `npm run typecheck` — PASS.
- `npm test` — PASS, 142 теста.
- `npm run build` — PASS после фиксации print-селектора. Остались только известные предупреждения Rollup о размере чанков и аннотациях `@vueuse/core`.
- `git diff --check` — PASS перед commit.

### Browser smoke

Через временный Playwright 1.52.0 с Microsoft Edge проверены viewport `1440×900`, `1024×768`, `800×800`, `430×932` и `375×812`: export текущего персонажа, export всех персонажей, import как нового с обновлением списка, ошибка повреждённого JSON, имя экспортного файла, overflow и диагностика.

Print CSS дополнительно проверен через `emulateMedia('print')`: менеджер и вкладки скрыты, игровая вкладка скрыта, все пять листовых панелей остаются видимыми, overflow отсутствует. Нативное системное окно print preview автоматизация не открывала; проверен DOM/CSS print flow без имитации результата диалога.

На smoke viewport: `console.error` — 0, `console.warn` — 0, page errors — 0, failed requests — 0.
