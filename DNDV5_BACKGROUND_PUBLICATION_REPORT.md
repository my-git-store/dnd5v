# DNDV5 — публикация нового фона листа

## Изменения

- `src/main.ts` переключён на `assetUrl('/character-sheet-parchment.png')`.
- Добавлен `public/character-sheet-parchment.png`, размер `2400×3200`.
- Существующий CSS сохраняет `background-size: cover`, `background-position: center top` и светлую центральную область.
- Верхний разделитель остаётся ромбом с горизонтальными линиями без прямоугольной подложки.
- Старый runtime mapping удалён; старые фоновые файлы могут оставаться как неиспользуемые legacy assets.

## Проверки

- `npm run typecheck` — PASS.
- `npm test` — PASS, 150/150.
- `npm run build` — PASS.
- Production build с `VITE_BASE=/dnd5v/` — PASS.
- `git diff --check` — PASS.
- В production HTML JS и CSS используют `/dnd5v/`.
- Pages HTTP: root, `character-sheet-parchment.png`, JS, CSS и favicon отвечают `200`.
- Локальный браузер показывает новый фон, без горизонтального overflow и console errors/warnings.
- Pages-браузер показывает новый фон, кнопку опроса и только пользовательские разделы листа; console errors/warnings отсутствуют.

## Коммиты и публикация

- feature commit: `170bf7c` — `feat(dndv5): replace character sheet parchment background`.
- main merge commit: `6848255`.
- gh-pages commit: `313c2ac`.
- Pages URL: https://my-git-store.github.io/dnd5v/

`gh-pages` сначала завис на shallow clone из-за stale cache. После остановки зависшего процесса публикация выполнена из временного worktree тем же production `dist`; удалённая ветка обновлена без force push.

## Ограничения

Точные viewport override `1440×900`, `1024×768`, `800×800`, `430×932`, `375×812` недоступны в текущем browser automation. Проверены фактические доступные размеры браузера; результаты не выдаются за проверки точных пресетов.
