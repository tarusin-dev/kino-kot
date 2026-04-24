# KinoKot

Платформа для поиска фильмов/сериалов/мультфильмов и написания отзывов. Главный персонаж — кот.

## Документация

- `CLAUDE.md` — подробная справка по продукту, архитектуре, backend/frontend-модулям, страницам и компонентам
- `AGENTS.md` — короткая operational-документация для Codex: запуск, env, роли URL-переменных, типовые проблемы и рабочие соглашения

Если информация дублируется:

- архитектуру и доменную логику считать source of truth в `CLAUDE.md`
- operational-детали и runbook держать в `AGENTS.md`

## Структура монорепо

```
kino-kot/
├── apps/
│   ├── web/          # Next.js 15 (App Router)
│   └── api/          # NestJS (REST API)
├── docker-compose.yml # MongoDB
├── package.json      # npm workspaces
├── CLAUDE.md
└── AGENTS.md
```

## Стек

- **Frontend**: React 19 + Next.js 15 (App Router), TypeScript
- **Стили**: SCSS Modules с BEM-именованием
- **Backend**: Node.js + NestJS, TypeScript
- **БД**: MongoDB 7 (через Docker Compose)
- **API фильмов**: TMDB API (гибридный прокси — TMDB как основной источник, MongoDB для отзывов)
- **Монорепо**: npm workspaces

## Запуск и env

Команды запуска, обязательные env-переменные, роли `API_URL` / `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SITE_URL` и типовые dev-проблемы вынесены в `AGENTS.md`, чтобы не дублировать runbook в двух файлах.

## Backend (apps/api/)

- **Глобальный префикс**: `/api`
- **CORS**: разрешён `http://localhost:3000` + `FRONTEND_URL` env с `credentials: true`
- **Middleware**: `cookie-parser`, `ValidationPipe` (whitelist)
- **MoviesModule**: гибридный подход — TMDB API как основной источник для списков/поиска/фильтров, MongoDB только для фильмов с отзывами. Схема Movie (Mongoose, поля `compositeId` unique, `tmdbId`, `title`, `genres`, `originCountries`, `releaseYear`, `runtime`, `mediaType`). TmdbService проксирует discover/list/search эндпоинты TMDB. Составные ID: `movie-{tmdbId}`, `series-{tmdbId}`, `cartoon-{tmdbId}`. `ensureMovieInDb(compositeId)` сохраняет фильм в MongoDB при создании отзыва
- **UsersModule**: схема User (name, email unique, password bcrypt-хеш, role enum user/admin default user, isEmailVerified bool default false, emailVerificationToken string optional, passwordResetToken string optional, passwordResetExpires Date optional), UsersService, UsersController
- **Эндпоинт профиля**: `PATCH /api/users/profile` (JwtAuthGuard) — обновление name/email с проверкой уникальности email
- **Удаление аккаунта**: `DELETE /api/users/account` (JwtAuthGuard) — каскадное удаление: отзывы пользователя, реакции (свои + на свои отзывы), комментарии (свои + на свои отзывы), учётная запись; очистка cookies
- **AuthModule**: JWT-авторизация (access 15min + refresh 7d в httpOnly cookies), Passport JWT strategy
- **EmailModule** (`apps/api/src/email/`): глобальный модуль, отправка email через Resend API (домен kino-kot.com, отправитель info@kino-kot.com). Fallback на console.log в dev (если RESEND_API_KEY не задан). Методы: `sendVerificationEmail(to, token)`, `sendPasswordResetEmail(to, token)`
- **Email Verification**: при регистрации отправляется письмо с ссылкой подтверждения. Регистрация сразу создаёт авторизованную сессию (JWT в httpOnly cookies), поэтому пользователь остаётся залогинен после создания аккаунта. Подтверждение email требуется для `POST /api/reviews/reactions`, `POST /api/reviews/comments` и `POST /api/reports`, но не требуется для `POST /api/reviews`
- **Эндпоинты фильмов**: `GET /api/movies` (query: genre, year, country, page, limit, list, mediaType), `GET /api/movies/popular`, `GET /api/movies/top-rated`, `GET /api/movies/search?query=&page=&limit=` (поиск по названию через TMDB), `GET /api/movies/random` (случайный фильм для «Мне повезёт»), `GET /api/movies/film-of-the-week?mediaType=`, `GET /api/movies/genres?mediaType=`, `GET /api/movies/countries?mediaType=` (возвращает `{ code, name }[]` — топ-10 популярных стран вверху, затем остальные по алфавиту; названия из TMDB на русском, SU → «СССР»), `GET /api/movies/years?mediaType=`
- **mediaType**: `movie` | `series` | `cartoon` — фильтрация контента по типу медиа во всех эндпоинтах
- **Фильм недели** (`GET /api/movies/film-of-the-week?mediaType=movie|series|cartoon`): алгоритм — AVG(rating) по reviews за 7 дней (порог >= 3 отзывов), fallback на лучший top_rated по voteAverage; возвращает данные + backdropPath + runtime + kinoKotRating
- **Эндпоинты авторизации**: `POST /api/auth/register` (создаёт аккаунт, сразу выдаёт JWT через cookies и возвращает `{ user, message }`), `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/auth/verify-email?token=`, `POST /api/auth/resend-verification` (body: email), `POST /api/auth/forgot-password` (body: email, rate-limit 2/min, безопасный ответ независимо от существования email), `POST /api/auth/reset-password` (body: token + password, rate-limit 3/min, токен действует 1 час)
- **ReviewsModule**: схема Review поддерживает два сценария: авторизованный отзыв (`userId`) и гостевой отзыв (`guestToken`, `isGuest`). Поля: `movieId` (compositeId), `rating` 1-10, `text`, `userName`, `status` enum approved/pending/rejected default approved, `moderationReason`, `createdAt`. Индексы: partial unique `userId+movieId` для аккаунтов и partial unique `guestToken+movieId` для гостей. Гостевые отзывы всегда отправляются на ручную модерацию
- **ModerationModule** (`apps/api/src/moderation/`): гибридная модерация контента — автомодерация через словарный фильтр (regex-паттерны: мат, оскорбления, разжигание ненависти, спам/реклама) + ручная модерация через админ-панель. ModerationService: `moderateText(text)` → `{status, reason?}` (синхронный, без внешних API). Паттерны расширяемы: `PROFANITY_PATTERNS`, `SPAM_PATTERNS`. ModerationController: эндпоинты под AdminGuard
- **ReportsModule** (`apps/api/src/reports/`): система жалоб пользователей на отзывы/комментарии. Схема Report (userId, targetId ObjectId, targetType enum review/comment, reason enum spam/offensive/spoilers/other, description optional max 500, status enum pending/resolved default pending, createdAt; уникальный индекс userId+targetId). ReportsService: create (с проверкой существования контента, ConflictException при повторной жалобе), findPending (агрегация с lookup в reviews/comments/users), resolve (dismiss — закрывает жалобу, delete-content — удаляет контент + закрывает все жалобы на него), getPendingCount
- **Эндпоинты жалоб**: `POST /api/reports` (JwtAuthGuard + VerifiedEmailGuard — создание жалобы)
- **Эндпоинты модерации** (все под JwtAuthGuard + AdminGuard): `GET /api/moderation/stats` (включая pendingReports), `GET /api/moderation/pending/reviews?page&limit`, `GET /api/moderation/pending/comments?page&limit`, `GET /api/moderation/reports?page&limit`, `PATCH /api/moderation/reviews/:id` (body: `{action, reason?}`), `PATCH /api/moderation/comments/:id`, `PATCH /api/moderation/reports/:id` (body: `{action}` — dismiss/delete-content)
- **AdminGuard** (`apps/api/src/auth/admin.guard.ts`): проверяет `req.user.role === 'admin'`, используется в связке с JwtAuthGuard
- **Флоу модерации**: при создании отзыва/комментария текст проверяется словарным фильтром → чистый контент авторизованных пользователей получает `status: approved` (сразу виден), подозрительный → `status: pending` (ждёт ручной модерации). Гостевые отзывы независимо от текста создаются со `status: pending` и идут на ручную проверку. Публичные запросы фильтруют по `status: approved`, авторы видят свои `pending` отзывы с бейджем. При отклонении отзыва модератором — отзыв удаляется, пользователь может написать новый
- **Назначение админа**: вручную в MongoDB: `db.users.updateOne({email: '...'}, {$set: {role: 'admin'}})`
- **Эндпоинты отзывов**: `POST /api/reviews` (OptionalJwtAuthGuard: авторизованный пользователь публикует от своего аккаунта, гость — с `guestName` + `guestToken`), `GET /api/reviews/latest` (публичный, последние отзывы с $lookup в movies), `GET /api/reviews/movie/:movieId` (OptionalJwtAuthGuard, возвращает likesCount/dislikesCount/userReaction/commentsCount), `GET /api/reviews/ratings?movieIds=id1,id2` (публичный, средние рейтинги КиноКот только по approved отзывам), `POST /api/reviews/reactions` (JwtAuthGuard + VerifiedEmailGuard, toggle like/dislike)
- **Эндпоинты комментариев**: `POST /api/reviews/comments` (JwtAuthGuard + VerifiedEmailGuard, создание комментария к отзыву), `GET /api/reviews/comments/:reviewId` (публичный, комментарии к отзыву отсортированные хронологически), `DELETE /api/reviews/comments/:commentId` (JwtAuthGuard, удаление своего комментария)
- **OptionalJwtAuthGuard**: расширяет JwtAuthGuard, не бросает ошибку при отсутствии токена (req.user = null)
- **Составные ID**: формат `{mediaType}-{tmdbId}` (например `movie-550`, `series-1396`, `cartoon-508947`). Используются в URL, API ответах, отзывах. Обратная совместимость: `findById` поддерживает и legacy MongoDB ObjectId
- **Утилита getMoviePath** (`apps/web/src/utils/getMoviePath.ts`): маппинг compositeId → правильный URL (/films/, /series/, /cartoons/)

## Правила стилей

- CSS Modules (`.module.scss`) с BEM-методологией
- Классы в DOM без хешей: `header__nav-link`, а не `Header_header__nav-link__xKz1`
- Это достигается кастомным `getLocalIdent` в `next.config.ts`
- Блок = имя компонента в kebab-case, элемент через `__`, модификатор через `--`
- SCSS-переменные и миксины в `src/styles/_variables.scss`
- **Mobile-first**: медиа-запросы только через `min-width` (база = мобильные стили, расширяем вверх)
- **rem-единицы**: использовать функцию `rem($px)` из `_variables.scss` для всех размеров (font-size, padding, gap, width и т.д.)
- **Исключения для rem**: `0`, `%`, `border-width` (оставлять в px), breakpoints (в px), `aspect-ratio`, `z-index`, `opacity`, transition duration

## Компоненты (apps/web/src/components/)

- **Header** — client-компонент, логотип, навигация, поиск, кнопка "Мне повезёт" (RandomMovieButton), кнопка "Войти"/"Выйти" (зависит от авторизации)
- **AuthForm** — переиспользуемая обёртка для форм авторизации (карточка, заголовок, submit, footer-ссылка)
- **FormInput** — поле ввода с иконкой слева, toggle видимости пароля, состояние ошибки
- **SearchBlock** — client-компонент на главной: поисковое поле с debounce (600ms), dropdown-саджесты (до 5 результатов с постерами/рейтингами + ссылка «Все результаты»), чипсы настроения — 6 кнопок-ссылок на `/films?genre=` (Посмеяться→Комедия, Поплакать→Драма, Пощекотать нервы→Ужасы, Подумать→Документальный, Приключение→Приключения, Для всей семьи→Семейный)
- **LuckyBanner** — client-компонент на главной, секция «Мне повезёт»: кнопка → `GET /api/movies/random`, fullscreen-оверлей с анимацией кота (5 сек), редирект на случайный фильм
- **RandomMovieButton** — client-компонент, кнопка-кубик в Header, тот же функционал что LuckyBanner (random + оверлей + редирект)
- **HeroBanner** — заголовок + CTA (Link на /quiz) + изображение кота
- **CategoryCards** — сетка карточек категорий (заглушки)
- **MovieSlider** — client-компонент, горизонтальный слайдер с навигацией стрелками (props: `title`, `movies?`)
- **MovieSection** — секция с заголовком (переиспользуемая, принимает опциональный `movies`)
- **MovieCard** — карточка фильма (скелетон без пропсов, реальные данные с пропсами, props: `basePath` для ссылки)
- **FilterDropdown** — generic дропдаун-фильтр (icon, label, options, selected, onSelect, displayMap), без навигации
- **FilmsTabs** — client-компонент, горизонтальные табы-кнопки для переключения списков (props: `activeTab`, `basePath`), pill-стиль с градиентом на активном. Наборы табов зависят от basePath: /films, /series, /cartoons
- **FilmOfTheWeek** — серверный компонент, баннер «X Недели» (props: `badge`, `categoryLabel`, `basePath`): backdrop-изображение, белые блоки контента с fake-border-radius, рейтинги КиноКот+TMDB, мета, кнопка → basePath/:id
- **FilmsFilters** — client-компонент, обёртка 3 FilterDropdown (жанр, год, страна) + кнопки "Применить"/"Очистить", batch-apply логика через URL params, props: `basePath`, `countryDisplayMap` (из API, не хардкод)
- **ReviewForm** — форма отзыва: работает и для авторизованного пользователя, и для гостя. Для гостя показывает пояснение, поле имени, локальный `guestToken` в `localStorage`, CTA на последующую регистрацию; общие элементы: аватар, кинолапки (10 шт.), textarea, кнопка "Отправить", чекбокс соглашения
- **ReviewCard** — client-компонент, карточка отзыва: аватар, имя, дата, бейдж рейтинга (лапка + "X.X/10"), текст, кнопки лайк/дизлайк с счётчиками (оптимистичное обновление), кнопка "Пожаловаться" (флажок, для авторизованных, не на свои), кнопка "Комментарии (N)" с раскрываемой секцией комментариев (lazy-загрузка)
- **CommentCard** — client-компонент, карточка комментария к отзыву: аватар с инициалом, имя, дата, текст, кнопка "Пожаловаться" (для авторизованных, не на свои), кнопка "Удалить" для своих комментариев
- **ReportModal** — client-компонент, модалка жалобы: 4 причины (спам, оскорбление, спойлеры, другое) + textarea описания, POST `/api/reports`
- **CommentForm** — client-компонент, форма комментария: textarea (max 500 символов) + кнопка "Отправить", POST `/api/reviews/comments`
- **Modal** — переиспользуемый модальный компонент (createPortal, overlay, ESC-закрытие, блокировка скролла)
- **EditProfileModal** — модалка редактирования профиля (имя, email, аватар-заглушка с инициалом, "Загрузить фото" — в разработке)
- **DeleteAccountModal** — модалка подтверждения удаления аккаунта с предупреждением о необратимости, редирект на главную после удаления
- **ReviewsMarquee** — client-компонент с последними отзывами, работает и при малом количестве карточек (не скрывается, если отзывов меньше 4), переиспользует ProfileReviewCard
- **QuizCard** — client-компонент, карточка вопроса теста с 5 вариантами ответа (кликабельные плашки, подсветка выбора, авто-переход 350ms)
- **QuizResults** — client-компонент, карточка результата теста: тип ("Вы эстет"), описание, список рекомендованных фильмов (ссылки на /films/:id), кнопка "Пройти ещё раз"
- **AdminReviewCard** — client-компонент, карточка отзыва на модерации: данные автора, рейтинг, текст, фильм, причина флага, кнопки "Одобрить"/"Отклонить" (с формой причины отклонения)
- **AdminCommentCard** — client-компонент, карточка комментария на модерации: аналогично AdminReviewCard
- **AdminReportCard** — client-компонент, карточка жалобы: бейдж типа (отзыв/комментарий), причина, описание, превью контента с автором, кнопки "Отклонить жалобу"/"Удалить контент"
- **Pagination** — компонент пагинации (currentPage, totalPages, onPageChange)
- **Footer** — логотип, копирайт, навигация

## Данные теста (apps/web/src/data/)

- **quiz-questions.ts** — пул из 28 вопросов с весами жанров (GenreWeights), рандомно выбираются 10 за сессию (Fisher-Yates shuffle)
- **quiz-results.ts** — 6 типов результатов (Эстет, Любитель адреналина, Мечтатель, Романтик, Детектив, Весельчак), каждый с доминирующими жанрами

## Страницы

- `/` — главная (async серверный компонент, trust-блок со статистикой отзывов/авторов и модерации, блок "Последние отзывы", далее слайдеры с данными из API)
- `/films` — фильмы (mediaType=movie) с табами списков (Популярные, Сейчас в кино, Лучшие, Скоро) + фильтры (жанр, год, страна) batch-apply по кнопке "Применить", пагинация сохраняет все параметры в URL
- `/series` — сериалы (mediaType=series) по образу /films, табы: Популярные, Лучшие, Сейчас на экранах, Сегодня в эфире
- `/cartoons` — мультфильмы (mediaType=cartoon) по образу /films, табы: Популярные, Лучшие, Сейчас в кино, Скоро
- `/search` — результаты поиска (client component, query из URL params, грид MovieCard с пагинацией, минимум 2 символа для запроса, подгрузка рейтингов КиноКот)
- `/login` — страница входа (client component, AuthForm + FormInput)
- `/register` — страница регистрации (client component, AuthForm + FormInput), после успешной регистрации сразу авторизует пользователя и возвращает на `redirect` из query params или на главную
- `/forgot-password` — запрос сброса пароля (client component, AuthForm + FormInput, email → POST /api/auth/forgot-password, экран подтверждения отправки)
- `/reset-password` — установка нового пароля (client component, token из query params, валидация пароля min 6 + подтверждение, POST /api/auth/reset-password)
- `/verify-email` — подтверждение email по ссылке из письма (читает token из query params, вызывает GET /api/auth/verify-email)
- `/profile` — страница профиля (client component, табы "Личная информация"/"Мои отзывы", модалка редактирования, модалка удаления аккаунта)
- `/quiz` — тест кинематографического вкуса (client component, 10 рандомных вопросов из 28, подсчёт жанровых весов, определение типа, рекомендации фильмов из API)
- `/about` — о проекте (серверный компонент, описание платформы, FAQ, ссылка на TMDB как источник данных)
- `/support` — поддержка (серверный компонент, карточки: вопросы/баги/идеи, email info@kino-kot.com, FAQ с details/summary)
- `/privacy` — политика конфиденциальности
- `/terms` — пользовательское соглашение
- `/admin` — панель модерации (client component, защищён role === 'admin', статистика pending отзывов/комментариев)
- `/admin/reviews` — очередь отзывов на модерации (пагинация, одобрение/отклонение)
- `/admin/comments` — очередь комментариев на модерации
- `/admin/reports` — очередь жалоб пользователей (dismiss/delete-content)

## Авторизация

- **AuthContext** (`apps/web/src/context/AuthContext.tsx`) — React Context с `AuthProvider`, хук `useAuth()`
- Состояние: `user` (включает `isEmailVerified`), `loading`, методы `login()`, `register()` (создаёт аккаунт и сразу обновляет `user`), `logout()`, `updateUser()`, `resendVerification()`, `deleteAccount()`
- Токены хранятся в httpOnly cookies (access_token + refresh_token), отправляются через `credentials: 'include'`
- При монтировании AuthProvider вызывает `GET /api/auth/me` для восстановления сессии
- Toast-уведомления (react-hot-toast) при login/register/logout, `<Toaster>` в layout.tsx

## Особенности конфигурации

- `next.config.ts`: webpack override для `getLocalIdent` + `images.remotePatterns` для `image.tmdb.org`
- Шрифт Montserrat Alternates (weights: 400, 500, 600, 700; latin + cyrillic) через `next/font/google`
- Ассеты: `public/images/logo.svg`, `public/images/main-banner.webp`
- npm install требует `--cache /tmp/npm-cache` из-за проблем с правами в дефолтном кеше
- **SEO**:
  - базовые helper'ы лежат в `apps/web/src/lib/seo.ts` и `apps/web/src/lib/movie-page.ts`
  - глобальные metadata, Open Graph, Twitter Card и JSON-LD сайта задаются в `apps/web/src/app/layout.tsx`
  - листинги `/films`, `/series`, `/cartoons` генерируют metadata динамически с учетом фильтров/пагинации
  - detail-страницы фильмов, сериалов и мультфильмов генерируют metadata и JSON-LD через общие helper'ы
  - служебные маршруты (`/login`, `/register`, `/profile`, `/search`, `/admin` и т.д.) закрыты от индексации через route-level metadata
  - `robots` и `sitemap` генерируются через `apps/web/src/app/robots.ts` и `apps/web/src/app/sitemap.ts`
