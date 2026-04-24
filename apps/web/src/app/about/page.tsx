import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import PageBreadcrumbs from '@/components/PageBreadcrumbs/PageBreadcrumbs';
import RelatedLinksBlock from '@/components/RelatedLinksBlock/RelatedLinksBlock';
import { buildBreadcrumbJsonLd, createMetadata } from '@/lib/seo';
import styles from './about.module.scss';

export const metadata = createMetadata({
  title: 'О проекте',
  description:
    'Узнайте, как работает КиноКот: отзывы на фильмы, сериалы и мультфильмы, рейтинги зрителей и рекомендации по вкусу.',
  path: '/about',
  keywords: ['о проекте КиноКот', 'отзывы на фильмы', 'отзывы на сериалы'],
});

export default function AboutPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Главная', path: '/' },
    { name: 'О проекте', path: '/about' },
  ]);

  return (
    <>
      <Header />
      <main className={styles['about']}>
        <div className={styles['about__container']}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
          />
          <PageBreadcrumbs items={[{ name: 'Главная', href: '/' }, { name: 'О проекте' }]} />
          <h1 className={styles['about__title']}>О проекте</h1>
          <p className={styles['about__subtitle']}>
            КиноКот — это уютная платформа для настоящих любителей кино
          </p>

          <section className={styles['about__section']}>
            <h2>Что такое КиноКот?</h2>
            <p>
              КиноКот — платформа, где можно найти фильмы, сериалы и мультфильмы на любой вкус,
              оставить отзыв и узнать мнение других зрителей. Отзыв можно отправить
              даже без регистрации: гостевые публикации проходят ручную модерацию,
              а аккаунт нужен для комментариев, лайков и управления профилем.
              Мы верим, что каждый фильм заслуживает честной оценки, а каждый зритель —
              хорошей рекомендации.
            </p>
          </section>

          <section className={styles['about__section']}>
            <h2>Что можно делать на КиноКот?</h2>
            <ul>
              <li>Искать фильмы, сериалы и мультфильмы по жанрам, годам и странам</li>
              <li>Читать отзывы других пользователей и оставлять свои — как гость или из аккаунта</li>
              <li>Оценивать фильмы по 10-балльной шкале</li>
              <li>Комментировать отзывы и ставить лайки/дизлайки после входа в аккаунт</li>
              <li>Пожаловаться на неуместный контент — модерация работает автоматически и вручную</li>
              <li>Выбрать фильм по настроению — чипсы «Посмеяться», «Поплакать», «Пощекотать нервы» и другие</li>
              <li>Нажать «Мне повезёт» — и КиноКот подберёт случайный фильм за вас</li>
              <li>Пройти тест кинематографического вкуса и получить персональные рекомендации</li>
              <li>Следить за популярными и лучшими фильмами</li>
            </ul>
          </section>

          <section className={styles['about__section']}>
            <h2>Почему кот?</h2>
            <p>
              Потому что коты — лучшие компаньоны для вечернего просмотра фильмов.
              Они разбираются в хорошем кино не хуже профессиональных критиков,
              а их мурчание — лучший саундтрек к любому сеансу.
            </p>
          </section>

          <section className={styles['about__section']}>
            <h2>Откуда данные о фильмах?</h2>
            <p>
              Информация о фильмах, сериалах и мультфильмах предоставляется
              сервисом <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">The Movie Database (TMDB)</a>.
              Рейтинг КиноКот формируется на основе отзывов наших пользователей
              и не зависит от внешних источников.
            </p>
          </section>

          <section className={styles['about__section']}>
            <h2>Связаться с нами</h2>
            <p>
              Нашли ошибку, есть идея или просто хотите сказать «мяу»?
              Напишите нам через страницу <a href="/support">Поддержки</a>.
            </p>
          </section>

          <RelatedLinksBlock
            links={[
              {
                href: '/films',
                name: 'Фильмы',
                description: 'Каталог фильмов с отзывами, рейтингами и подборками по популярности.',
              },
              {
                href: '/series',
                name: 'Сериалы',
                description: 'Лучшие сериалы, онгоинги и отзывы зрителей в одном разделе.',
              },
              {
                href: '/quiz',
                name: 'Квиз по настроению',
                description: 'Быстрый способ подобрать фильм или сериал под текущее настроение.',
              },
              {
                href: '/support',
                name: 'Поддержка',
                description: 'Частые вопросы, помощь по аккаунту и способы связаться с командой.',
              },
            ]}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
