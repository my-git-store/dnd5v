# EV-CLASS-ICONS — отчёт

## Что сделано

- Добавлены портреты классов D&D 2024 в `public/images/classes/`.
- В `ClassDefinition` добавлено необязательное поле `icon?: string`; старые данные без этого поля продолжают загружаться.
- Создан единый lookup `classIconFor` по стабильному идентификатору класса и локализованному названию для совместимости со старыми листами.
- Карточки выбора класса в `CharacterCreationTab.vue` показывают портрет, название, описание, Кость Хитов, основные характеристики, спасброски и навыки. Для отсутствующего портрета используется текстовый fallback.
- В заголовке листа рядом с выбранным классом отображается его портрет.
- Размеры контейнеров: 128×128 на desktop и 96×96 на узких экранах; изображения сохраняют пропорции через `object-fit: contain`.

## Mapping

| Class id | Asset |
| --- | --- |
| barbarian | `/images/classes/barbarian.png` |
| bard | `/images/classes/bard.png` |
| cleric | `/images/classes/cleric.png` |
| druid | `/images/classes/druid.png` |
| fighter | `/images/classes/fighter.png` |
| monk | `/images/classes/monk.png` |
| paladin | `/images/classes/paladin.png` |
| ranger | `/images/classes/ranger.png` |
| rogue | `/images/classes/rogue.png` |
| sorcerer | `/images/classes/sorcerer.png` |
| warlock | `/images/classes/warlock.png` |
| wizard | `/images/classes/wizard.png` |

Все 12 подключённых файлов визуально проверены по предоставленным изображениям. Исходные PNG имеют единый размер 1254×1254, RGBA-прозрачность и скопированы без изменения качества. Для каждого класса выбран первый последовательный набор портретов; альтернативные варианты не используются, чтобы mapping оставался однозначным.

## Изменённые файлы

- `public/images/classes/*.png` — новые assets.
- `src/modules/character-sheet/data/classIcons.ts` — явное соответствие классов и assets, fallback lookup.
- `src/modules/character-sheet/types/rules.ts` — optional `ClassDefinition.icon`.
- `src/modules/character-sheet/data/dnd5eOptions.ts` и `src/modules/character-sheet/data/rules2024/index.ts` — публикация icon в class definitions/options.
- `src/modules/character-sheet/components/CharacterCreationTab.vue` — портреты в выборе класса.
- `src/modules/character-sheet/components/CharacterSheetHeader.vue` и `CharacterSheetPage.vue` — портрет выбранного класса в заголовке.
- `src/modules/character-sheet/styles/character-sheet.css` — общие, selected/hover существующей карточки и responsive размеры portrait-контейнеров.
- `tests/character-sheet/classFoundation.test.ts` — проверки lookup и совместимости metadata.

## Проверки

- `npm run typecheck`
- `npm test`
- `npm run build`
- `git diff --check`

Результаты:

- `npm run typecheck` — успешно.
- `npm run build` — успешно.
- `git diff --check` — успешно.
- `node --test --experimental-test-isolation=none tests/character-sheet/classFoundation.test.ts` — успешно (8/8).
- `npm test` — 100/102 тестов успешно; два существующих несвязанных теста требуют отдельного исправления: legacy manual skill bonus ожидает 7 вместо фактических 3, а локализованное имя mastery `topple` (`Опрокидывание`) расходится с ожиданием `Topple`.
