# DNDV5 GitHub Pages и assets — отчёт

## Репозиторий

- Репозиторий: `https://github.com/my-git-store/dnd5v`.
- Статус репозитория: публичный.
- Рабочая ветка исходников: `feature/nastolka-demo-modules`.
- Ожидаемый URL: `https://my-git-store.github.io/dnd5v/`.

## Способ публикации

- Используется пакет `gh-pages` из devDependencies.
- `npm run predeploy` собирает production-версию с `VITE_BASE=/dnd5v/`.
- Production flags в predeploy принудительно выключены:
  - `VITE_ENABLE_BESTIARY=false`;
  - `VITE_ENABLE_ENCOUNTER_PLANNER=false`;
  - `VITE_ENABLE_COMPONENTS=false`.
- `npm run deploy` публикует `dist` в ветку `gh-pages` в корень `/`.
- Публикация выполнена успешно: remote `gh-pages` указывает на commit `877af9b77ed9d55ca0b9ac73ee80b971553eba77`.
- Конфликтующий Actions workflow `deploy-pages.yml` удалён, чтобы не смешивать два способа deployment.
- Для GitHub Pages нужно выбрать `Deploy from a branch` → `gh-pages` → `/ (root)`.

## SPA и asset paths

- Локальный Vite base: `/`.
- Pages base: `/dnd5v/`, передаётся через `VITE_BASE`.
- После сборки `dist/index.html` копируется в `dist/404.html`, поэтому прямой переход к неизвестному пути открывает SPA.
- Favicon, CSS, JS и public assets используют base-aware пути.
- `VITE_ASSET_BASE_URL` поддерживается для проверенного внешнего asset host; пока переменная пустая, используются локальные assets относительно base path.
- Production build не содержит ссылок на `localhost` или `127.0.0.1`.

## Feature flags

- В production-публикации все экспериментальные модули отключены.
- Локально их можно включить через `.env` значением `true`.
- Исходный код и данные Бестиария, Планировщика столкновений и Компонентов сохранены.

## Assets

- Инвентаризировано 64 изображения: PNG, SVG и локальные файлы из `public`/`src/assets`.
- Mapping видов, классов и предысторий проходит через `src/config/assets.ts`.
- Стабильный внешний asset host не задан, поэтому локальные изображения не удалялись.
- Перенос локальных assets во внешний host будет отдельным шагом после предоставления host и проверки каждого URL.

## Проверки

- Публичность репозитория проверена через GitHub: `Public`.
- `npm run typecheck` — PASS.
- `npm test` — PASS, 150/150.
- `npm run build` — PASS.
- `npm run predeploy` — PASS; Pages base paths присутствуют в `dist/index.html`.
- `git diff --check` — PASS.
- В production `dist` нет localhost-ссылок.
- Raw-содержимое ветки `gh-pages` доступно с HTTP 200.

## Ограничения

- Pages URL `https://my-git-store.github.io/dnd5v/` сейчас возвращает HTTP 404; GitHub API `GET /repos/my-git-store/dnd5v/pages` также возвращает 404, то есть Pages site ещё не включён.
- Владелец должен открыть `Settings` → `Pages` → `Deploy from a branch` → `gh-pages` → `/ (root)` и сохранить настройку. После этого повторно проверить URL, JS, CSS, изображения и favicon.
