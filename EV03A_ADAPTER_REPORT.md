# EV-03A Adapter Report

## Результат

EV-03A завершён. Character v3 подключён к существующему runtime через отдельный adapter layer.

Текущий Vue UI продолжает работать с привычной v2-проекцией Character. Каноническим источником хранения после успешного чтения становится v3.

Порядок чтения:

1. v3 key;
2. v2 key с миграцией v2 → v3;
3. v1 key через существующую v1 → v2 → v3 цепочку;
4. legacy/mock loader, если сохранённой записи нет.

Старые v1/v2 keys не удаляются и не перезаписываются.

## Изменённые файлы

Добавлены:

- src/modules/character-sheet/adapters/characterSheetAdapter.ts
  - v3 → текущая UI projection;
  - UI projection → v3;
  - сохранение канонического v3 snapshot;
  - promotion v1/v2 записи в v3 key;
  - сохранение не отображаемых текущим UI полей.
- tests/character-sheet/characterSheetAdapter.test.ts
  - загрузка v3;
  - миграция и promotion v2;
  - сохранение v3;
  - сохранение полей, отсутствующих в текущем UI.

Изменены:

- src/modules/character-sheet/api/characterV3Storage.ts
  - добавлен результат чтения с указанием источника v1/v2/v3.
- src/modules/character-sheet/composables/useCharacterSheet.ts
  - загрузка и сохранение выполняются через adapter;
  - создан отдельный adapter на экземпляр composable.

Vue-компоненты, Character API, mock API и backend не изменялись.

## Adapter behavior

### v3 → UI

Adapter преобразует:

- identity.name/class/level/experience в текущие root-поля;
- combat.armorClass.value в armorClass;
- v3 skills в текущие CharacterSkill;
- v3 attacks в текущие CharacterAttack и bonusSource;
- knownSpells/cantrips в текущие spells/cantrips;
- inventory.items и money в текущую структуру;
- personality в текущий bio.

UI получает schemaVersion 2 projection, поэтому существующие компоненты не требуют переписывания.

### UI → v3

При сохранении adapter накладывает изменения UI на последний v3 snapshot:

- name, class, level, experience;
- armorClass;
- abilities;
- skills;
- attacks;
- spells;
- cantrips;
- inventory;
- money;
- bio/personality.

Поля v3, которых нет в текущем UI, остаются из исходного snapshot. В частности сохраняются:

- race и background;
- saving throws;
- hit points, hit dice и death saves;
- spellcasting ability и spell slots;
- spell metadata;
- inventory weight/equipped/properties;
- personality ideals/bonds/flaws;
- extensions и неизвестные поля записей.

### Promotion

Если найден v2 или v1 key:

- запись мигрируется в v3 в памяти;
- v3 копия записывается в v3 key;
- старый key сохраняется;
- текущий UI получает v2-проекцию.

Если сохранённой записи нет, используется существующий legacy/mock loader. В этом случае v3 создаётся в памяти и записывается при первом сохранении.

## State и ошибки

useCharacterSheet сохранил прежнее поведение:

- dirty state сравнивает текущую и сохранённую UI projection;
- loading/error/retry остаются без изменений;
- save state блокирует повторное сохранение;
- ошибка сохранения не удаляет draft;
- saved notice появляется только после успешного adapter save;
- beforeunload предупреждает при несохранённых изменениях.

## Проверки

- npm run typecheck — успешно.
- npm test — 23/23 успешно.
- npm run build — успешно.
- git diff --check — без ошибок по содержимому.
- Build содержит только существующие предупреждения Rollup о комментариях __PURE__ в @vueuse/core.

## Ограничения

- UI пока отображает только v2-проекцию и не показывает новые поля v3.
- v3 adapter не добавляет новый UI и не подключает backend/API.
- Отдельный v3 storage-adapter используется runtime через CharacterSheetAdapter; существующий mock API оставлен для fallback при отсутствии сохранённых данных.
- Полное переключение UI на v3-типы потребует отдельного этапа.

