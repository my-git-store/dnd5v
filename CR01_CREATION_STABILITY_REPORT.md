# CR-01 — Creation Stability Report

Дата: 2026-10-02  
Репозиторий: dnd5v

## Итог

Проведён аудит текущей вкладки «Создание» и стабилизирован переход раса/класс для Character v3. Новые варианты и игровые механики не добавлялись. Версия схемы осталась 3.

## Найденные проблемы

1. При повторном применении выбора уже увеличенные характеристики могли использоваться как новые базовые значения.
2. Источники владения навыком не были сохранены отдельно: после смены класса нельзя было отличить владение расы от владения класса.
3. При смене класса/расы списки языков, навыков и спасбросков могли сохранять старые автоматически добавленные значения.
4. Применение класса-заклинателя к обычному классу могло оставить старую способность заклинаний.
5. Старый v3 без creation metadata требовал безопасного режима по умолчанию.
6. Browser-check всё ещё ожидал четыре вкладки и v2 storage key после появления вкладки «Создание» и v3 adapter.

## Что исправлено

- Добавлены optional v3 metadata:
  - `extensions.characterCreation.baseAbilityScores`;
  - `raceSkillIds`;
  - `classSkillIds`;
  - `classSavingThrowKeys`;
  - `manualSavingThrowKeys`;
  - `raceLanguages`;
  - `classProficiencies`.
- Добавлено optional `skills[].proficiencySources[]` со значениями `race | class | background | manual`.
- Повторный выбор расы пересчитывает `abilities` от сохранённых базовых значений и текущего race profile; бонусы не складываются.
- При смене расы автоматически удаляются только старые race sources; ручные и background sources сохраняются.
- При смене класса удаляются только старые class sources; race/manual/background sources сохраняются.
- Классовые saving throws заменяются новым набором, ручные сохранения сохраняются отдельно.
- Классовые/расовые языки и class proficiencies пересобираются без накопления прежнего автоматического набора.
- `spellcastingAbility` заменяется значением нового класса, включая `null` для non-caster; spells/cantrips не удаляются.
- `speed.override` не затрагивается при смене расы.
- Невалидная или неполная creation metadata в старом v3 игнорируется, вместо падения загрузки.
- Обновлён browser-check под пять вкладок и v3 storage key.

## Источники proficiency

В текущем draft источник хранится в `proficiencySources`. При применении нового выбора формируется новый набор источников:

- `race` — текущая раса;
- `class` — текущий класс;
- `background` — текущая предыстория;
- `manual` — ручное владение пользователя.

Источник не представлен только display-строкой и восстанавливается после reload через v3 adapter. Для старых записей без массива источников adapter безопасно выводит источник из creation metadata; если его нет — использует `manual`.

## Ability bonuses

Базовые значения сохраняются в `creation.baseAbilityScores`. Race bonuses остаются источником в `race.abilityBonuses`. При каждом применении итоговые значения строятся заново от базы и текущей расы. Повторное применение той же расы даёт тот же результат; возврат к первой расе не удваивает бонусы.

## Совместимость v3

- schemaVersion не менялся.
- Старый v3 JSON без `creation` открывается с безопасными defaults.
- Старые атаки, заклинания, инвентарь, деньги, personality и combat проходят adapter round-trip.
- Legacy `attackBonus: string` сохраняется.
- Старые localStorage keys не удаляются.

## Проверки

- `npm run typecheck` — PASS.
- `npm test` — PASS, 33/33.
- `npm run build` — PASS. Сохранились только известные предупреждения Rollup о `@vueuse/core`.
- `git diff --check` — PASS; присутствуют только стандартные предупреждения Git о LF/CRLF.
- Domain/adapter tests покрывают повторный выбор расы, race A → B, class A → B, совместное race+class владение, снятие одного источника, caster ↔ non-caster, сохранение spell list, manual speed override, старый v3 и сохранение коллекций.

## Browser smoke

Вкладка «Создание» уже проверялась визуально ранее: выбор расы/класса, список навыков и применение отображаются. В этой проверочной сессии Windows browser automation остановилась на этапе определения текущего URL Edge, поэтому полный интерактивный smoke с Save/reload после CR-01 не был повторён. Сценарий обновлён в `tests/character-sheet/browser-check.mjs`; npm-скрипт браузерной проверки в проекте не запускается без установленного Playwright-модуля.

## Изменённые CR-01 файлы

- `src/modules/character-sheet/types/characterV3.ts` — optional creation/source metadata.
- `src/modules/character-sheet/types/characterView.ts` — источники владения в UI projection.
- `src/modules/character-sheet/adapters/characterSheetAdapter.ts` — безопасное чтение/сохранение metadata и legacy source inference.
- `src/modules/character-sheet/domain/characterCreation.ts` — детерминированная пересборка race/class effects.
- `src/modules/character-sheet/data/dnd5eOptions.ts` — текущие race skill sources/choices.
- `src/modules/character-sheet/components/CharacterCreationTab.vue` — безопасное восстановление базовых значений и выборов.
- `src/modules/character-sheet/composables/useCharacterSheet.ts` — сохранение ручных saving throw источников.
- `src/modules/character-sheet/validation/characterV3Validation.ts` — проверка optional proficiency sources.
- `tests/character-sheet/creation.test.ts` — CR-01 regression tests.
- `tests/character-sheet/browser-check.mjs` — актуализация браузерного smoke под пять вкладок и v3 storage.

## Ограничения

Подрасы, предыстории, feats, multiclass, progression, equipment/spell catalogs и полноценный rules engine не входят в CR-01. После отчёта работа остановлена.

