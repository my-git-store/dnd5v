# DNDV5 GitHub Pages и assets — отчёт

## Ветка и публикация

- Ветка: `feature/nastolka-demo-modules`.
- Workflow: `.github/workflows/deploy-pages.yml`.
- Ожидаемый URL: `https://my-git-store.github.io/dnd5v/`.
- Workflow запускает typecheck, тесты, build и публикацию Pages после push в ветку.
- Включение Pages через `Settings → Pages → Source: GitHub Actions` и первый remote Actions run ещё требуют проверки на GitHub.

## Feature flags

Production workflow использует:

- `VITE_ENABLE_BESTIARY=false`;
- `VITE_ENABLE_ENCOUNTER_PLANNER=false`;
- `VITE_ENABLE_COMPONENTS=false`.

Скрытые вкладки отфильтрованы и не восстанавливаются из session storage. Исходный код, модели и данные модулей сохранены. Локальный `.env` может включить флаги значением `true`.

## Assets

Проведена инвентаризация 64 изображений: виды, классы, предыстории, семь дайсов, карты/фоны, favicon/icons и прочие локальные изображения. Локальные файлы не удалялись.

Mapping видов, классов и предысторий теперь проходит через `src/config/assets.ts` и учитывает `VITE_ASSET_BASE_URL` и `BASE_URL`. Favicon и фон карты также base-aware для Pages. Dice assets остаются Vite-бандлом с существующим fallback.

Стабильный внешний asset host в проекте не настроен и не проверен. Поэтому перенос изображений из Git заблокирован явным правилом безопасности; `VITE_ASSET_BASE_URL` оставлен пустым, локальные assets сохранены. После предоставления host нужно проверить каждый URL и только затем удалять локальные копии.

## Проверки

- `npm run typecheck` — PASS.
- `npm test` — PASS, 150/150.
- `npm run build` — стандартный запуск блокируется `spawn EPERM` в Vite/esbuild; нужен повторный запуск вне этого ограничения.
- `git diff --check` — будет выполнен перед commit.
- Browser smoke опубликованной Pages версии не выполнен: Actions ещё не запускался и URL не проверен.

## Ограничения

- Не подтверждены завершение GitHub Actions и ответ Pages URL.
- Точные viewport, console и network smoke опубликованной версии остаются pending.
- Миграция внешних assets и удаление локальных файлов остаются заблокированы отсутствием стабильного публичного host.
