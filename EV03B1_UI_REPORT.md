# EV-03B.1 UI Report

## Результат

Вкладка «Основное» получила новую v3-структуру поверх существующего draft/save runtime.
Интерфейс продолжает работать через `useCharacterSheet` и `CharacterSheetAdapter`; компоненты не обращаются к storage и API напрямую.

Добавлены и подключены:

- header с именем, расой, классом, уровнем, опытом, бонусом владения и статусом сохранения;
- identity block с именем, расой, классом, подклассом, предысторией и мировоззрением;
- блок шести характеристик с raw score, вычисляемым modifier и подсказкой формулы;
- блок спасбросков с владением, дополнительной добавкой и итоговым bonus;
- skills block с источником характеристики, proficiency, режимом manual/computed и итоговым bonus;
- адаптированная v3-проекция, сохраняющая identity и saving throws при сохранении.

Существующие блоки КД и атак оставлены доступными и не перерабатывались в рамках EV-03B.1. Магия, инвентарь, БИО, CRUD и текущие modal-confirm сценарии не менялись.

## Изменённые файлы в рамках этапа

- `src/modules/character-sheet/types/characterView.ts` — типы UI-проекции v3, identity/saving throw/skill patches и deep clone.
- `src/modules/character-sheet/adapters/characterSheetAdapter.ts` — выдача v3 identity/saving throws в UI и обратная запись этих данных; legacy fallback также возвращает полную проекцию.
- `src/modules/character-sheet/composables/useCharacterSheet.ts` — хранение `CharacterSheetView`, обновление identity, saving throws и расширенных skill settings при сохранении draft.
- `src/modules/character-sheet/CharacterSheetPage.vue` — передача новых props/events в header и основную вкладку.
- `src/modules/character-sheet/components/CharacterSheetHeader.vue` — новый summary header и расчёт proficiency bonus по уровню.
- `src/modules/character-sheet/components/IdentityFields.vue` — новый identity block.
- `src/modules/character-sheet/components/SavingThrowFields.vue` — новый блок спасбросков.
- `src/modules/character-sheet/components/CharacterMainTab.vue` — компоновка новых блоков и typed event wiring.
- `src/modules/character-sheet/components/AbilityFields.vue` — подсказка формулы modifier.
- `src/modules/character-sheet/components/SkillFields.vue` — ability source, proficiency, manual/computed controls и итоговый bonus.
- `src/modules/character-sheet/styles/character-sheet.css` — сетки, summary, controls и responsive правила для новых блоков.
- `tests/character-sheet/characterSheetAdapter.test.ts` — round-trip проверки identity, saving throws и skill settings через v3 adapter.

## Ограничения этапа

- Backend, HTTP API, storage adapter, миграторы и domain helpers не изменялись.
- Combat и атаки остаются текущими компонентами; новые правила для них не добавлялись.
- Proficiency и derived bonuses отображаются через уже существующие domain helpers.
- Поля race/background редактируют только название профиля; каталог D&D и rules engine не входят в этот этап.
- Проверка сохранения выполнялась на уровне adapter/unit tests; отдельный backend и multiplayer отсутствуют.

## Проверки

- `npm run typecheck` — успешно.
- `npm test` — успешно, 24/24 теста.
- `npm run build` — успешно.
- `git diff --check` — без ошибок содержимого; Git сообщил только стандартные предупреждения о преобразовании LF/CRLF.

Production build оставил ранее известные предупреждения Rollup о комментариях `__PURE__` внутри `@vueuse/core`; они не относятся к изменениям EV-03B.1.
