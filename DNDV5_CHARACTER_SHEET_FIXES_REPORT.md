# DNDV5 Character Sheet Fixes Report

## Scope

This pass stayed within `dnd5v` and the `feature/nastolka-demo-modules` branch. It covered the agreed Character Sheet fixes only:

- spellcasting and saving-throw alignment;
- user-authored character feats CRUD;
- safe initialization of hit points, hit dice, and first-level spell slots for new characters;
- hiding the progression summary while keeping progression data intact.

No backend, API, storage architecture, migration strategy, or D&D rules were changed.

## Changes

### Spell and saving-throw UI

Aligned the spellcasting ability control, manual skill bonus field, and saving-throw rows. Saving throws now have one shared `Добавка` / `Итог` header, while the input keeps its accessible label. Responsive spacing and typography were adjusted locally in the character-sheet stylesheet.

### Character feats

Added an optional `CharacterFeatV3` record with `id`, `name`, and `description`. The sheet now supports adding, editing, cancelling, and deleting user-authored feats through the existing modal pattern. Feat records are adapter-backed, validated, and preserved through save/reload. They do not apply automatic game effects.

### New-character vitals

New characters receive level-one hit points and hit-die totals from the selected class and Constitution modifier. Empty spellcasting slots receive the existing level-one default for spellcasting classes; non-casters remain empty. Existing characters and manually entered values are preserved.

### Progression visibility

The progression summary is hidden behind the existing feature flag while progression history remains in the v3 model and round-trips through the adapter. This avoids showing an unfinished summary without deleting or rewriting progression data.

## Files changed

- `src/modules/character-sheet/CharacterSheetPage.vue`
- `src/modules/character-sheet/adapters/characterSheetAdapter.ts`
- `src/modules/character-sheet/components/CharacterFeatEditor.vue`
- `src/modules/character-sheet/components/CharacterFeatEditorModal.vue`
- `src/modules/character-sheet/components/CharacterFeatList.vue`
- `src/modules/character-sheet/components/CharacterMainTab.vue`
- `src/modules/character-sheet/components/SavingThrowFields.vue`
- `src/modules/character-sheet/components/SkillFields.vue`
- `src/modules/character-sheet/components/SpellcastingSummary.vue`
- `src/modules/character-sheet/composables/useCharacterSheet.ts`
- `src/modules/character-sheet/domain/characterCreation.ts`
- `src/modules/character-sheet/domain/characterCreation2024.ts`
- `src/modules/character-sheet/domain/characterVitals.ts`
- `src/modules/character-sheet/domain/progressionVisibility.ts`
- `src/modules/character-sheet/migration/characterMigrationV3.ts`
- `src/modules/character-sheet/styles/character-sheet.css`
- `src/modules/character-sheet/types/characterV3.ts`
- `src/modules/character-sheet/types/characterView.ts`
- `src/modules/character-sheet/validation/characterV3Validation.ts`
- `tests/character-sheet/characterSheetAdapter.test.ts`
- `tests/character-sheet/classFoundation.test.ts`
- `tests/character-sheet/creation.test.ts`
- `tests/character-sheet/progressionFoundation.test.ts`

## Verification

- `npm run typecheck` — PASS.
- `npm test` — PASS, 123 tests.
- `npm run build` — PASS when run outside the restricted sandbox. The normal sandbox run is blocked by `spawn EPERM` while Vite loads its config; the successful run produced only existing Rollup warnings about a pure comment and a large chunk.
- `git diff --check` — PASS.

## Browser smoke

The available local tab at `http://127.0.0.1:5173/` was checked for the existing 2024 character. The accessible UI showed the identity summary, origin summary, aligned saving throws, skills and sources, class/species features, the empty feats section, combat values and attack headers, magic settings and spell slots, and inventory. The feat editor opened with draft fields and was cancelled; no feat was persisted by the smoke check. The progression summary was absent while the rest of the main sheet remained available.

Exact 1440/1024/800/430/375 viewport overrides and browser console capture were unavailable in this environment, so those checks are not claimed as completed. No browser runtime failure was observed in the accessible tab.

## Git

The implementation is split into these commits:

- `401c3f7 fix(dndv5): align spell and saving throw ui`
- `9640ef0 feat(dnd5v): add character feats crud`
- `73ffb85 fix(dndv5): initialize hit points and spell slots`
- `559638e chore(dndv5): hide progression ui`

The branch was clean before this report. Initial push attempts from the restricted environment were blocked by its proxy connection to `github.com:443`; a final retry from the permitted network environment succeeded. `origin/feature/nastolka-demo-modules` now points to the report commit `ddaa5c9`. No force push or history rewrite was used.

## Remaining limitations

The exact viewport matrix and console-level browser audit still require a browser environment with viewport emulation and developer-log access. The existing build warnings are non-blocking.
