import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import PageBreadcrumbs from '@/components/PageBreadcrumbs/PageBreadcrumbs';
import RelatedLinksBlock from '@/components/RelatedLinksBlock/RelatedLinksBlock';
import { buildBreadcrumbJsonLd, createMetadata } from '@/lib/seo';
import styles from './privacy.module.scss';

export const metadata = createMetadata({
  title: 'Политика конфиденциальности',
  description: 'Политика конфиденциальности сервиса КиноКот и порядок обработки персональных данных.',
  path: '/privacy',
  keywords: ['политика конфиденциальности КиноКот', 'обработка персональных данных', 'privacy policy'],
});

export default function PrivacyPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Главная', path: '/' },
    { name: 'Политика конфиденциальности', path: '/privacy' },
  ]);

  return (
    <>
      <Header />
      <main className={styles['privacy']}>
        <div className={styles['privacy__container']}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
          />
          <PageBreadcrumbs
            items={[{ name: 'Главная', href: '/' }, { name: 'Политика конфиденциальности' }]}
          />
          <h1 className={styles['privacy__title']}>Политика конфиденциальности</h1>
          <p className={styles['privacy__updated']}>Последнее обновление: 28 апреля 2026 г.</p>

          <section className={styles['privacy__section']}>
            <h2>1. Общие положения</h2>
            <p>
              Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных
              данных пользователей сервиса КиноКот (далее — «Сервис»).
            </p>
            <p>
              Используя Сервис, вы соглашаетесь с условиями данной Политики. Если вы не согласны
              с какими-либо положениями, пожалуйста, прекратите использование Сервиса.
            </p>
          </section>

          <section className={styles['privacy__section']}>
            <h2>2. Какие данные мы собираем</h2>
            <p>При использовании Сервиса мы можем собирать следующие данные:</p>
            <ul>
              <li><strong>Регистрационные данные:</strong> имя, адрес электронной почты, пароль (хранится в зашифрованном виде)</li>
              <li><strong>Пользовательский контент:</strong> отзывы, оценки, комментарии к отзывам, реакции (лайки/дизлайки), жалобы на контент</li>
              <li><strong>Технические данные:</strong> httpOnly cookie для поддержания авторизованной сессии, а также локальный guest token в браузере для ограничения повторной отправки гостевых отзывов на один и тот же фильм</li>
              <li><strong>Аналитические данные:</strong> данные о посещениях и действиях на сайте через Google Analytics, если вы дали согласие на аналитику</li>
            </ul>
          </section>

          <section className={styles['privacy__section']}>
            <h2>3. Цели обработки данных</h2>
            <p>Мы используем ваши данные для:</p>
            <ul>
              <li>Создания и управления вашей учётной записью</li>
              <li>Обеспечения работы функций Сервиса (публикация отзывов, оценки, модерация гостевых отзывов)</li>
              <li>Поддержания авторизованной сессии через cookie-файлы</li>
              <li>Ограничения повторной отправки гостевых отзывов на один и тот же фильм с одного браузера</li>
              <li>Анализа использования Сервиса и улучшения пользовательского опыта</li>
              <li>Улучшения качества Сервиса</li>
            </ul>
          </section>

          <section className={styles['privacy__section']}>
            <h2>4. Cookie-файлы</h2>
            <p>
              Сервис использует httpOnly cookie-файлы для поддержания сессии
              авторизации (access token и refresh token). Для сценария гостевых
              отзывов браузер может хранить локальный guest token в localStorage,
              который не используется для рекламы и нужен только для предотвращения
              повторной отправки отзыва на один и тот же фильм.
            </p>
            <p>
              Google Analytics используется только после вашего согласия на
              аналитические cookie. Если вы отклоняете аналитику, сайт продолжает
              работать, но мы не загружаем Google Analytics для вашего браузера.
              Выбор по cookie сохраняется в localStorage, чтобы не показывать
              баннер при каждом посещении.
            </p>
          </section>

          <section className={styles['privacy__section']}>
            <h2>5. Хранение и защита данных</h2>
            <p>
              Пароли хранятся в виде bcrypt-хешей. Мы принимаем разумные меры для защиты
              ваших персональных данных от несанкционированного доступа, изменения
              или уничтожения.
            </p>
            <p>
              Данные хранятся на протяжении всего периода существования вашей учётной записи.
            </p>
          </section>

          <section className={styles['privacy__section']}>
            <h2>6. Передача данных третьим лицам</h2>
            <p>
              Мы не продаём и не передаём ваши персональные данные третьим лицам.
              Сервис использует API The Movie Database (TMDB) для получения информации
              о фильмах — при этом ваши персональные данные в TMDB не передаются.
              Для аналитики сайт использует Google Analytics только при наличии
              вашего согласия на аналитические cookie.
            </p>
          </section>

          <section className={styles['privacy__section']}>
            <h2>7. Ваши права</h2>
            <p>Вы имеете право:</p>
            <ul>
              <li>Получить доступ к своим персональным данным</li>
              <li>Изменить свои данные (имя, email) в настройках профиля</li>
              <li>Самостоятельно удалить свою учётную запись через настройки профиля — при этом каскадно удаляются все ваши отзывы, комментарии и реакции</li>
            </ul>
          </section>

          <section className={styles['privacy__section']}>
            <h2>8. Изменения в Политике</h2>
            <p>
              Мы оставляем за собой право обновлять данную Политику. При внесении существенных
              изменений дата обновления в начале документа будет изменена.
            </p>
          </section>

          <section className={styles['privacy__section']}>
            <h2>9. Контакты</h2>
            <p>
              Если у вас есть вопросы относительно данной Политики конфиденциальности,
              вы можете связаться с нами через страницу <a href="/support">Поддержки</a>.
            </p>
          </section>
          <RelatedLinksBlock
            title="Связанные страницы"
            links={[
              {
                href: '/terms',
                name: 'Пользовательское соглашение',
                description: 'Условия использования сервиса, публикации отзывов и правил поведения.',
              },
              {
                href: '/support',
                name: 'Поддержка',
                description: 'Куда писать по вопросам аккаунта, отзывов и работы сервиса.',
              },
              {
                href: '/about',
                name: 'О проекте',
                description: 'Как устроен КиноКот, откуда берутся данные и как формируется рейтинг.',
              },
              {
                href: '/films',
                name: 'Фильмы',
                description: 'Основной каталог фильмов с отзывами, оценками и подборками.',
              },
            ]}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
