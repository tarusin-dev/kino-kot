# KinoKot: Codex Guide

Короткая рабочая документация для Codex. Подробная продуктовая и техническая справка уже есть в `CLAUDE.md`; этот файл нужен как быстрый operational guide.

## Source of Truth

- Детальное описание проекта, модулей и страниц: `CLAUDE.md`
- Если `AGENTS.md` и `CLAUDE.md` расходятся:
  - для архитектуры и доменной логики ориентироваться на `CLAUDE.md`
  - для текущих рабочих соглашений Codex ориентироваться на `AGENTS.md`

## Repo Layout

```text
kino-kot/
├── apps/web/   # Next.js 15, App Router
├── apps/api/   # NestJS REST API
├── docker-compose.yml  # MongoDB
├── CLAUDE.md
└── AGENTS.md
```

## Startup

Запускать в таком порядке:

```bash
docker compose up -d
npm run dev:api
npm run dev:web
```

Адреса:

- web: `http://localhost:3000`
- api: `http://localhost:3001/api`
- mongo: `mongodb://localhost:27017/kinokot`

## Required Env

### `apps/web/.env.local`

```bash
API_URL=http://localhost:3001/api
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SITE_URL=https://kino-kot.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### `apps/api/.env`

```bash
MONGODB_URI=mongodb://localhost:27017/kinokot
PORT=3001
FRONTEND_URL=http://localhost:3000
TMDB_API_KEY=...
JWT_SECRET=...
RESEND_API_KEY=...
```

## URL Roles

Не путать переменные:

- `NEXT_PUBLIC_SITE_URL`: публичный URL сайта, используется для `canonical`, Open Graph, `robots`, `sitemap`
- `API_URL`: server-side запросы из Next.js к backend API
- `NEXT_PUBLIC_API_URL`: client-side запросы из браузера к backend API
- `NEXT_PUBLIC_GA_ID`: Google Analytics 4 Measurement ID для подключения `gtag`

Если страница рендерится на сервере Next.js и ей нужны данные, почти всегда нужен `API_URL`.
Если код выполняется в браузере, почти всегда нужен `NEXT_PUBLIC_API_URL`.

## Common Failure Modes

### `ECONNREFUSED` на `/api/auth/me`

Обычно это не проблема фронтенда.

Проверить:

1. Запущен ли Mongo через Docker
2. Поднялся ли `dev:api` без ошибок Mongoose
3. Отвечает ли `http://localhost:3001/api/health`
4. Совпадают ли `API_URL` и `NEXT_PUBLIC_API_URL` с реальным адресом API

Если Nest пишет `Unable to connect to the database`, проблема в Mongo, а не в `auth/me`.

### Next build с `fetch failed` в sandbox

В sandbox-среде внешние или локальные запросы могут быть недоступны. Для этого в проекте местами уже есть безопасные fallback-ветки. Сам по себе такой лог при сборке ещё не означает ошибку приложения.

## Backend Notes

- Глобальный префикс API: `/api`
- ID контента составные:
  - `movie-{tmdbId}`
  - `series-{tmdbId}`
  - `cartoon-{tmdbId}`
- Mongo хранит отзывы, пользователей, модерацию и фильмы с отзывами
- TMDB остаётся основным источником данных для списков и detail-страниц
- `POST /api/reviews` поддерживает два сценария:
  - авторизованный пользователь публикует отзыв от аккаунта
  - гость публикует отзыв с `guestName` + `guestToken`
- Гостевые отзывы всегда создаются со статусом `pending` и проходят ручную модерацию
- Реакции, комментарии и жалобы по-прежнему требуют авторизацию; для реакций/комментариев/жалоб также нужен подтверждённый email
- После `POST /api/auth/register` пользователь сразу получает auth cookies и считается залогиненным

## Frontend Notes

- Next.js 15, App Router
- Есть mix server/client components
- `AuthProvider` живёт в корневом `layout.tsx` и на клиенте делает `GET /auth/me`
- Для detail/listing-страниц многие данные приходят server-side через `API_URL`
- `ReviewForm` на detail-странице работает и для гостя, и для авторизованного пользователя
- Для guest-review фронтенд хранит локальный `guestToken` в браузере и использует его для ограничения повторной отправки отзыва на тот же фильм
- `CookieConsent` хранит выбор пользователя в `localStorage` (`kinokot_cookie_consent`): `accepted` включает Google Analytics, `rejected` оставляет только необходимые cookie/локальные технические данные
- `GoogleAnalytics` должен загружать `gtag` только после согласия на аналитику и при наличии `NEXT_PUBLIC_GA_ID`

## Deployment Notes

- При первом выкатывании guest-review на существующую production MongoDB нужна одноразовая миграция индекса `reviews`
- Старый unique-индекс `userId + movieId` нужно заменить на partial unique-индекс для аккаунтов и добавить partial unique-индекс `guestToken + movieId` для гостей
- Если этого не сделать, гостевые отзывы могут упираться в старую индексную схему даже при корректном коде

## Styling Rules

- Только SCSS Modules
- BEM-именование
- Mobile-first
- Для размеров использовать `rem(...)` из `apps/web/src/styles/_variables.scss`
- Не ломать существующую визуальную систему без явной причины

## SEO Notes

Текущая SEO-база уже вынесена в helper-файлы:

- `apps/web/src/lib/seo.ts`
- `apps/web/src/lib/movie-page.ts`

Там лежат:

- `canonical`
- `robots`
- Open Graph / Twitter
- JSON-LD
- metadata для листингов и detail-страниц

При новых SEO-правках предпочтительно расширять эти helper'ы, а не копировать логику по страницам.

## Working Conventions For Codex

- Перед правками сначала читать существующий код и конфиг
- Не трогать unrelated changes в git
- Для поиска использовать `rg`
- Для ручных правок использовать patch-based edits
- После существенных правок по возможности проверять:

```bash
npm run build --workspace=web
```

Если правки backend-специфичны, дополнительно проверять запуск `dev:api`.

## High-Value Files

- `apps/web/src/app/layout.tsx`
- `apps/web/src/lib/seo.ts`
- `apps/web/src/lib/movie-page.ts`
- `apps/web/src/context/AuthContext.tsx`
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/movies/movies.service.ts`
- `apps/api/src/reviews/reviews.service.ts`

## When Unsure

- Сначала читать `CLAUDE.md`
- Потом сверять реальные файлы в `apps/web` и `apps/api`
- Только после этого предлагать или делать изменения
