import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import PageBreadcrumbs from '@/components/PageBreadcrumbs/PageBreadcrumbs';
import RelatedLinksBlock from '@/components/RelatedLinksBlock/RelatedLinksBlock';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, createMetadata } from '@/lib/seo';
import styles from './support.module.scss';

export const metadata = createMetadata({
  title: 'Поддержка',
  description:
    'Свяжитесь с командой КиноКота, задайте вопрос, сообщите об ошибке или предложите идею для развития сервиса.',
  path: '/support',
  keywords: ['поддержка КиноКот', 'помощь КиноКот', 'обратная связь'],
});

const faqItems = [
  {
    question: 'Как оставить отзыв?',
    answer:
      'Отзыв можно оставить как гость или из аккаунта: откройте страницу фильма, выберите оценку и напишите текст. Гостевые отзывы проходят ручную модерацию.',
  },
  {
    question: 'Можно ли изменить или удалить свой отзыв?',
    answer:
      'Самостоятельное редактирование и удаление отзывов пока недоступно. Для удаления отзыва можно связаться с поддержкой по электронной почте.',
  },
  {
    question: 'Как удалить учётную запись?',
    answer:
      'Учётную запись можно удалить в настройках профиля. Вместе с аккаунтом будут удалены отзывы, комментарии и реакции.',
  },
  {
    question: 'Откуда берутся данные о фильмах?',
    answer:
      'Информация о фильмах, сериалах и мультфильмах загружается из The Movie Database (TMDB), а рейтинг КиноКот строится по отзывам пользователей.',
  },
];

export default function SupportPage() {
  const faqJsonLd = buildFaqJsonLd(faqItems);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Главная', path: '/' },
    { name: 'Поддержка', path: '/support' },
  ]);

  return (
    <>
      <Header />
      <main className={styles['support']}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <div className={styles['support__container']}>
          <PageBreadcrumbs items={[{ name: 'Главная', href: '/' }, { name: 'Поддержка' }]} />
          <h1 className={styles['support__title']}>Поддержка</h1>
          <p className={styles['support__subtitle']}>
            Мы всегда рады помочь и услышать ваше мнение
          </p>

          <div className={styles['support__cards']}>
            <div className={styles['support__card']}>
              <div className={styles['support__card-icon']}>?</div>
              <h2>Вопросы</h2>
              <p>
                Если у вас есть вопросы по работе сервиса, регистрации или функциям —
                напишите нам, и мы постараемся ответить как можно быстрее.
              </p>
            </div>

            <div className={styles['support__card']}>
              <div className={styles['support__card-icon']}>!</div>
              <h2>Сообщить об ошибке</h2>
              <p>
                Нашли баг или что-то работает не так? Опишите проблему — что произошло,
                на какой странице и какие действия к этому привели.
              </p>
            </div>

            <div className={styles['support__card']}>
              <div className={styles['support__card-icon']}>★</div>
              <h2>Идеи и предложения</h2>
              <p>
                У вас есть идея, как сделать КиноКот лучше?
                Мы открыты к предложениям и будем рады их услышать.
              </p>
            </div>
          </div>

          <section className={styles['support__contact']}>
            <h2>Как с нами связаться</h2>
            <p>
              Напишите нам на электронную почту — мы стараемся отвечать в течение 24 часов.
            </p>
            <a href="mailto:info@kino-kot.com" className={styles['support__email']}>
              Написать
            </a>
          </section>

          <section className={styles['support__faq']}>
            <h2>Частые вопросы</h2>

            <details className={styles['support__faq-item']}>
              <summary>{faqItems[0].question}</summary>
              <p>
                Для публикации отзыва не обязательно создавать аккаунт. На странице фильма
                можно выбрать оценку, указать имя и отправить гостевой отзыв. Если вы войдёте
                в аккаунт, то сможете дополнительно ставить лайки, писать комментарии и
                управлять своим профилем. Гостевые отзывы перед публикацией проходят
                ручную модерацию.
              </p>
            </details>

            <details className={styles['support__faq-item']}>
              <summary>{faqItems[1].question}</summary>
              <p>
                На данный момент редактирование и удаление опубликованных отзывов недоступно
                самостоятельно. Если вам нужно удалить отзыв, свяжитесь с нами по электронной
                почте. При этом вы можете свободно оставлять и удалять свои комментарии
                к отзывам других пользователей.
              </p>
            </details>

            <details className={styles['support__faq-item']}>
              <summary>{faqItems[2].question}</summary>
              <p>
                Вы можете самостоятельно удалить свою учётную запись в настройках профиля.
                При удалении будут каскадно удалены все ваши отзывы, комментарии и реакции.
                Это действие необратимо.
              </p>
            </details>

            <details className={styles['support__faq-item']}>
              <summary>{faqItems[3].question}</summary>
              <p>
                Информация о фильмах, сериалах и мультфильмах предоставляется
                сервисом The Movie Database (TMDB). Рейтинг КиноКот формируется
                на основе отзывов наших пользователей.
              </p>
            </details>
          </section>

          <RelatedLinksBlock
            links={[
              {
                href: '/about',
                name: 'О проекте',
                description: 'Как работает КиноКот, чем полезен сервис и откуда берутся данные.',
              },
              {
                href: '/privacy',
                name: 'Политика конфиденциальности',
                description: 'Как сервис обрабатывает и защищает персональные данные пользователей.',
              },
              {
                href: '/terms',
                name: 'Пользовательское соглашение',
                description: 'Правила использования сервиса, отзывов, комментариев и модерации.',
              },
              {
                href: '/quiz',
                name: 'Квиз по настроению',
                description: 'Подберите фильм, сериал или мультфильм, если не знаете, что посмотреть.',
              },
            ]}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
