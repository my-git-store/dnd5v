# EV-07.6 — Final Browser Smoke Check and Demo-Ready Gate

Дата проверки: 2026-10-15/16  
Репозиторий: `dnd5v`

## Область проверки

Проверены Character Builder и Character Sheet без изменения backend, API, schema version, migration strategy и правил D&D.

В доступном browser automation viewport (около 1004 px по скриншоту) выполнены сценарии создания и редактирования. CUA-адаптер не предоставил управление viewport, поэтому отдельный прогон ровно на 1440, 1024, 430 и 375 px выполнить нельзя. Для responsive-поведения дополнительно проверены DOM/CSS breakpoints и отсутствие переполнения в доступном viewport.

## Проверенные сценарии

### Character Creation

- 2014: имя, редакция, species без подвида и species с подвидом, background, subrace, class, skills, equipment, финальный review.
- 2024: имя, редакция, gender, species choice, background abilities/skills/tools/origin feat, class, skills, equipment, финальный review.
- Переключение species очищает и пересобирает зависимые choices и источники; переход по шагам остаётся последовательным.
- После создания данные открываются в листе, сохраняются общей кнопкой и остаются после reload.

### Assets и fallback

- `public/images/species/`: 10 PNG — `aasimar`, `dragonborn`, `dwarf`, `elf`, `gnome`, `goliath`, `halfling`, `human`, `orc`, `tiefling`.
- `public/images/backgrounds/`: 16 PNG с mapping для 2024 backgrounds.
- `public/images/classes/`: 24 PNG — 12 женских/default и 12 мужских вариантов.
- Mapping использует стабильные IDs; неизвестное или старое значение безопасно возвращает fallback. В smoke UI отображались иконки species, background и class.
- В рамках аудита новые PNG не генерировались.

### Gender

- В creation gender переключается и меняет portrait.
- После создания поля gender заблокированы сообщением о фиксации пола.
- Portrait и сохранённый gender не расходятся после Save и reload.

### Draft / Save / Cancel

- Изменение имени в modal не меняет основной лист до действия modal Save.
- `Отмена` закрывает modal и отбрасывает draft.
- Modal Save применяет draft к черновику; общая кнопка Save сохраняет его в storage.
- Dirty state переключается между `Есть несохранённые изменения` и `Сохранено`; reload сохраняет ранее подтверждённые данные.

### Level Up

- Блок progression отображается на листе.
- Выполнено повышение ровно `1 → 2`; действие создаёт dirty state и сохраняется общей кнопкой.
- История последнего повышения отображается.
- ASI и черты автоматически не применяются; сохраняются только metadata/references.
- В domain-коде задан диапазон уровней 1..20, переходы больше чем на один уровень отклоняются, повышение без корректного класса отклоняется.

### Character Sheet

Проверены вкладки:

- Основное: identity, abilities, saving throws, skills, features, progression;
- Бой: combat stats, attacks, weapon data;
- Магия / Заклинания: spell metadata, cantrips, spell slots;
- Инвентарь: items, equipped filters, money;
- БИО: personality, notes и сохранение.

### Compatibility

Автоматические regression-тесты покрывают v1/v2/v3 migration, старый v3 без новых metadata, 2014 и 2024 creation, adapter roundtrip, progression defaults, icon fallback и сохранение legacy collections. В browser smoke отдельно проверен новый 2024 персонаж после reload; старые fixtures не подменялись и не перезаписывались.

## Найденные проблемы

### P0

Не обнаружены.

### P1

Не обнаружены.

### P2/P3

- Точный прогон четырёх viewport невозможен из-за отсутствия viewport override в подключённом CUA-адаптере; это ограничение проверки, а не подтверждённая ошибка интерфейса.
- На узких viewport навигация Builder рассчитана на горизонтальный scroll по step-nav; это предусмотрено CSS и не блокирует основные действия.
- В production build остаются предупреждения Rollup о `#__PURE__` в `@vueuse/core` и размере чанка; они не влияют на работоспособность и не относятся к P0/P1.

## Изменения в рамках EV-07.6

Функциональные исправления не потребовались. Создан только этот отчёт.

## Проверки

- `npm run typecheck` — PASS.
- `npm test` — PASS, 106/106 тестов.
- `npm run build` в ограниченном sandbox — блокируется окружением с `spawn EPERM` при запуске esbuild.
- `npm run build` вне ограничения sandbox — PASS; Vite production bundle собран.
- `git diff --check` — PASS; Git вывел только предупреждения о нормализации LF/CRLF.

## Итоговый статус

`demo-ready` для проверенного пользовательского потока: блокирующих P0/P1-проблем нет, typecheck/tests/build проходят, assets и fallback работают. Ограничение по точным viewport зафиксировано выше и требует отдельного ручного прогона в DevTools при необходимости пиксельной приёмки.
