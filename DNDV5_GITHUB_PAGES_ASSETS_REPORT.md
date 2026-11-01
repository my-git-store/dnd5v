# DNDV5 GitHub Pages и assets — отчёт

## Ветка и публикация

- Ветка: `feature/nastolka-demo-modules`.
- Workflow: `.github/workflows/deploy-pages.yml`.
- Ожидаемый URL: `https://my-git-store.github.io/dnd5v/`.
- Workflow запускает typecheck, тесты, build и публикацию Pages после push в ветку.
- Workflow опубликован в commit `aa83e6d` и запускается на push в эту ветку.
- Первый запуск `41290600743` прошёл typecheck, тесты и build, но остановился на `Configure Pages`: сайт Pages ещё не был включён.
- Второй запуск `41290971956` повторил проверки и получил точный отказ GitHub `Resource not accessible by integration` при попытке включить Pages через API. У текущего подключения нет доступа к настройкам репозитория, поэтому публикация URL ожидает ручного включения Pages владельцем репозитория.

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
- `npm run build` — PASS при запуске вне ограничения среды `spawn EPERM`; локально Vite/esbuild в обычном режиме требует повышенного запуска.
- `git diff --check` — PASS.
- GitHub Actions build — PASS (typecheck, 150/150 tests, build); Pages deploy — BLOCKED BY GITHUB PERMISSIONS.
- Локальный browser smoke с выключенными экспериментальными вкладками выполнен через in-app browser; точные viewport и чтение console/network этим инструментом не доступны.
- Опубликованная Pages версия не проверена: сайт не включён, deployment job пропущен.

## Ограничения

- Для завершения публикации владелец `my-git-store/dnd5v` должен включить `Settings → Pages → Source: GitHub Actions` (или выдать подключению право управления Pages), после чего workflow повторится автоматически.
- Точные viewport, console и network smoke опубликованной версии остаются pending до появления Pages URL.
- Миграция внешних assets и удаление локальных файлов остаются заблокированы отсутствием стабильного публичного host.
