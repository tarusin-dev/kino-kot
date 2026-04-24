import Header from '@/components/Header/Header';
import HomeSeoBlock from '@/components/HomeSeoBlock/HomeSeoBlock';
import HeroBanner from '@/components/HeroBanner/HeroBanner';
import SearchBlock from '@/components/SearchBlock/SearchBlock';
import WhyKinoKot from '@/components/WhyKinoKot/WhyKinoKot';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import ReviewsMarquee from '@/components/ReviewsMarquee/ReviewsMarquee';
import MovieSlider from '@/components/MovieSlider/MovieSlider';
import QuizBanner from '@/components/QuizBanner/QuizBanner';
import LuckyBanner from '@/components/LuckyBanner/LuckyBanner';
import Footer from '@/components/Footer/Footer';
import { buildItemListJsonLd, createMetadata } from '@/lib/seo';
import styles from './page.module.scss';
import type { Movie } from '@/types/movie';
import type { LatestReview } from '@/types/review';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

interface ReviewStats {
  totalReviews: number;
  totalAuthors: number;
}

async function fetchHomeData<T>(url: string, label: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`[home] ${label} fetch failed: ${res.status} ${res.statusText}`);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error(`[home] ${label} fetch threw`, error);
    return null;
  }
}

export const metadata = createMetadata({
  title: 'Отзывы на фильмы, сериалы и мультфильмы',
  description:
    'КиноКот помогает выбирать, что посмотреть: читайте отзывы на фильмы, сериалы и мультфильмы, сравнивайте рейтинги и находите лучшие подборки.',
  path: '/',
  keywords: [
    'отзывы на фильмы',
    'отзывы на сериалы',
    'отзывы на мультфильмы',
    'рейтинг фильмов',
    'что посмотреть',
    'КиноКот',
  ],
});

async function getPopularMovies(): Promise<Movie[]> {
  return (await fetchHomeData<Movie[]>(`${API_URL}/movies/popular`, 'popular movies')) ?? [];
}

async function getTopRatedMovies(): Promise<Movie[]> {
  return (await fetchHomeData<Movie[]>(`${API_URL}/movies/top-rated`, 'top rated movies')) ?? [];
}

async function getPopularSeries(): Promise<Movie[]> {
  return (
    (await fetchHomeData<Movie[]>(
      `${API_URL}/movies/popular?mediaType=series`,
      'popular series',
    )) ?? []
  );
}

async function getUpcomingMovies(): Promise<Movie[]> {
  return (
    (await fetchHomeData<Movie[]>(
      `${API_URL}/movies/upcoming?mediaType=movie`,
      'upcoming movies',
    )) ?? []
  );
}

async function getLatestReviews(): Promise<LatestReview[]> {
  return (
    (await fetchHomeData<LatestReview[]>(
      `${API_URL}/reviews/latest?limit=20`,
      'latest reviews',
    )) ?? []
  );
}

async function getRatings(movieIds: string[]): Promise<Record<string, number>> {
  if (movieIds.length === 0) return {};
  try {
    const res = await fetch(`${API_URL}/reviews/ratings?movieIds=${movieIds.join(',')}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

async function getReviewStats(): Promise<ReviewStats | null> {
  return fetchHomeData<ReviewStats>(`${API_URL}/reviews/stats`, 'review stats');
}

function mergeRatings(movies: Movie[], ratings: Record<string, number>): Movie[] {
  return movies.map((m) => ({ ...m, kinoKotRating: ratings[m._id] }));
}

function formatStat(value: number) {
  return value.toLocaleString('ru-RU');
}

export default async function Home() {
  const [popular, topRated, popularSeries, upcoming, latestReviews, reviewStats] = await Promise.all([
    getPopularMovies(),
    getTopRatedMovies(),
    getPopularSeries(),
    getUpcomingMovies(),
    getLatestReviews(),
    getReviewStats(),
  ]);

  const allIds = [...popular, ...topRated, ...popularSeries, ...upcoming].map((m) => m._id);
  const ratings = await getRatings(allIds);
  const topRatedJsonLd = topRated.length
    ? buildItemListJsonLd(
        topRated.slice(0, 10).map((movie) => ({ id: movie._id, name: movie.title })),
        '/films',
      )
    : null;
  const popularSeriesJsonLd = popularSeries.length
    ? buildItemListJsonLd(
        popularSeries.slice(0, 10).map((movie) => ({ id: movie._id, name: movie.title })),
        '/series',
      )
    : null;

  return (
    <>
      <Header />
      <main>
        <section className={styles['home']}>
          <div className={styles['home__wrap']}>
            {topRatedJsonLd && (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(topRatedJsonLd) }}
              />
            )}
            {popularSeriesJsonLd && (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(popularSeriesJsonLd) }}
              />
            )}
            <SearchBlock />
            <HeroBanner />
            {reviewStats && (
              <section className={styles['home__trust']}>
                <article className={styles['home__trust-card']}>
                  <strong className={styles['home__trust-value']}>
                    {formatStat(reviewStats.totalReviews)}
                  </strong>
                  <span className={styles['home__trust-label']}>
                    опубликованных отзывов
                  </span>
                </article>
                <article className={styles['home__trust-card']}>
                  <strong className={styles['home__trust-value']}>
                    {formatStat(reviewStats.totalAuthors)}
                  </strong>
                  <span className={styles['home__trust-label']}>
                    авторов уже пишут на КиноКоте
                  </span>
                </article>
                <article className={styles['home__trust-card']}>
                  <strong className={styles['home__trust-value']}>24/7</strong>
                  <span className={styles['home__trust-label']}>
                    автомодерация и ручная проверка жалоб
                  </span>
                </article>
              </section>
            )}
            {latestReviews.length > 0 && <ReviewsMarquee reviews={latestReviews} noContainer />}
            <HowItWorks />
            <WhyKinoKot />
            <MovieSlider
              title="Топ фильмов"
              movies={topRated.length > 0 ? mergeRatings(topRated, ratings) : undefined}
              noContainer
              moreHref="/films?list=top_rated"
            />
            <MovieSlider
              title="Популярные"
              movies={popular.length > 0 ? mergeRatings(popular, ratings) : undefined}
              noContainer
              moreHref="/films"
            />
            <QuizBanner />
            <MovieSlider
              title="Популярные сериалы"
              movies={popularSeries.length > 0 ? mergeRatings(popularSeries, ratings) : undefined}
              noContainer
              moreHref="/series"
            />
            <MovieSlider
              title="Скоро выходят"
              movies={upcoming.length > 0 ? mergeRatings(upcoming, ratings) : undefined}
              noContainer
              moreHref="/films?list=upcoming"
            />
            <LuckyBanner />
            <HomeSeoBlock />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
