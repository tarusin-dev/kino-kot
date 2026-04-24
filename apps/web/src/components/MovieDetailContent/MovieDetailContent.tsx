'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ReviewForm from '@/components/ReviewForm/ReviewForm';
import ReviewCard from '@/components/ReviewCard/ReviewCard';
import MovieSlider from '@/components/MovieSlider/MovieSlider';
import type { Movie, MovieDetail } from '@/types/movie';
import { getMoviePath } from '@/utils/getMoviePath';
import styles from './MovieDetailContent.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ReviewData {
  _id: string;
  userId: string | null;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
  likesCount: number;
  dislikesCount: number;
  userReaction: 'like' | 'dislike' | null;
  commentsCount: number;
  status?: 'approved' | 'pending' | 'rejected';
}

interface MovieDetailContentProps {
  movie: MovieDetail;
}

type TabKey = 'reviews' | 'description' | 'cast' | 'stills';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'reviews', label: 'Отзывы' },
  { key: 'description', label: 'Описание' },
  { key: 'cast', label: 'Актеры и команда' },
  { key: 'stills', label: 'Кадры' },
];

const MEDIA_TYPE_LABELS: Record<string, string> = {
  series: 'Сериал',
  cartoon: 'Мультфильм',
};

function getMediaTypeLabel(compositeId: string): string {
  const prefix = compositeId.split('-')[0];
  return MEDIA_TYPE_LABELS[prefix] || 'Фильм';
}

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h}ч`;
  return `${h}ч ${m}мин`;
}

export default function MovieDetailContent({ movie }: MovieDetailContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('reviews');
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [showMobileTrailer, setShowMobileTrailer] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useAuth();

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/reviews/movie/${movie._id}`, {
        credentials: 'include',
      });
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setReviewsLoading(false);
    }
  }, [movie._id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await fetch(`${API_URL}/movies/${movie._id}/recommendations`);
        if (res.ok) {
          const data = await res.json();
          setRecommendations(
            data.map((m: any) => ({
              _id: m._id,
              tmdbId: m.tmdbId,
              title: m.title,
              overview: m.overview || '',
              posterPath: m.posterPath,
              voteAverage: m.voteAverage,
              releaseDate: m.releaseDate || '',
              genres: m.genres || [],
            })),
          );
        }
      } catch {
        // ignore
      }
    }
    fetchRecommendations();
  }, [movie._id]);

  const userHasReview = user
    ? reviews.some((r: any) => r.userId === user.id)
    : false;

  const kinoKotRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
        ) / 10
      : null;

  const year = movie.releaseDate
    ? new Date(movie.releaseDate).getFullYear()
    : '';

  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w780${movie.posterPath}`
    : undefined;

  const handleReviewClick = () => {
    setActiveTab('reviews');
    tabsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className={styles['movie-detail']}>
      <div className={styles['movie-detail__container']}>
        {/* Заголовок + рейтинги + кнопка */}
        <div className={styles['movie-detail__info-row']}>
          <h1 className={styles['movie-detail__title']}>{movie.title}</h1>

          <div className={styles['movie-detail__ratings']}>
            {kinoKotRating !== null && (
              <div className={styles['movie-detail__rating']}>
                <Image
                  src="/icons/rating-kk.svg"
                  alt="КиноКот"
                  width={32}
                  height={32}
                />
                <span className={styles['movie-detail__rating-value']}>
                  {kinoKotRating.toFixed(1)}
                </span>
              </div>
            )}
            <div className={styles['movie-detail__rating']}>
              <Image
                src="/icons/rating-tmdb.svg"
                alt="TMDB"
                width={32}
                height={32}
                style={{ borderRadius: '50%' }}
              />
              <span className={styles['movie-detail__rating-value']}>
                {movie.voteAverage.toFixed(1)}
              </span>
            </div>
          </div>

          {!userHasReview && (
            <button
              className={styles['movie-detail__review-btn']}
              onClick={handleReviewClick}
            >
              Оставить отзыв
            </button>
          )}
        </div>

        {/* Мета-информация */}
        <div className={styles['movie-detail__meta']}>
          <span>{getMediaTypeLabel(movie._id)}</span>
          {year && <span>{year}</span>}
          {movie.runtime && <span>{formatRuntime(movie.runtime)}</span>}
        </div>

        {/* Медиа-блок: постер + трейлер */}
        <div className={styles['movie-detail__media']}>
          <div className={styles['movie-detail__poster']}>
            {posterUrl && (
              <Image
                src={posterUrl}
                alt={movie.title}
                fill
                sizes="(max-width: 768px) 40vw, 300px"
                priority
                unoptimized
              />
            )}
          </div>

          {movie.trailerKey ? (
            <>
              <div className={styles['movie-detail__trailer']}>
                <iframe
                  src={`https://www.youtube.com/embed/${movie.trailerKey}`}
                  title={`${movie.title} — трейлер`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {!showMobileTrailer ? (
                <button
                  className={styles['movie-detail__trailer-btn']}
                  onClick={() => setShowMobileTrailer(true)}
                  type="button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 3l14 9-14 9V3z" fill="currentColor"/>
                  </svg>
                  Смотреть трейлер
                </button>
              ) : (
                <div className={styles['movie-detail__trailer-mobile']}>
                  <iframe
                    src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1`}
                    title={`${movie.title} — трейлер`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </>
          ) : (
            movie.backdropPath && (
              <div className={styles['movie-detail__backdrop']}>
                <Image
                  src={`https://image.tmdb.org/t/p/w1280${movie.backdropPath}`}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  unoptimized
                />
              </div>
            )
          )}
        </div>

        {/* Жанры + рейтинги + кнопка */}
        <div className={styles['movie-detail__genres']}>
          {movie.genres.map((genre) => (
            <span key={genre.id} className={styles['movie-detail__genre']}>
                {genre.name}
              </span>
          ))}
        </div>

        {/* Где посмотреть */}
        <WatchProvidersSection movieTitle={movie.title} />

        {/* Вкладки */}
        <div className={styles['movie-detail__tabs']} ref={tabsRef}>
          <div className={styles['movie-detail__tab-bar']}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`${styles['movie-detail__tab']} ${
                  activeTab === tab.key
                    ? styles['movie-detail__tab--active']
                    : ''
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles['movie-detail__tab-content']}>
            {activeTab === 'reviews' && (
              <ReviewsTab
                user={user}
                loading={loading}
                movieId={movie._id}
                reviews={reviews}
                reviewsLoading={reviewsLoading}
                userHasReview={userHasReview}
                onReviewSubmitted={fetchReviews}
              />
            )}
            {activeTab === 'description' && (
              <DescriptionTab overview={movie.overview} />
            )}
            {activeTab === 'cast' && (
              <CastTab cast={movie.cast} crew={movie.crew} />
            )}
            {activeTab === 'stills' && <StillsTab stills={movie.stills} />}
          </div>
        </div>

        {/* Рекомендации */}
        {recommendations.length > 0 && (
          <MovieSlider title="Рекомендации" movies={recommendations} noContainer />
        )}
      </div>
    </section>
  );
}

/* ---------- Вкладка: Отзывы ---------- */

function ReviewsTab({
  user,
  loading,
  movieId,
  reviews,
  reviewsLoading,
  userHasReview,
  onReviewSubmitted,
}: {
  user: { id: string; name: string; email: string; isEmailVerified: boolean } | null;
  loading: boolean;
  movieId: string;
  reviews: ReviewData[];
  reviewsLoading: boolean;
  userHasReview: boolean;
  onReviewSubmitted: () => void;
}) {
  if (loading) return null;

  const redirectPath = `${getMoviePath(movieId)}#reviews`;
  const loginHref = `/login?redirect=${encodeURIComponent(redirectPath)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(redirectPath)}`;
  const emptyTitle = user
    ? 'Ваш отзыв может стать первым'
    : 'Отзывов пока нет';
  const emptyText = user
    ? 'Поделитесь впечатлением о фильме и помогите следующим зрителям определиться.'
    : 'Станьте первым автором на этой странице и помогите другим понять, стоит ли смотреть это кино.';

  return (
    <div className={styles['reviews-tab']}>
      {!user && (
        <p className={styles['reviews-tab__auth-message']}>
          Аккаунт не обязателен: отзыв можно отправить как гость. Если хотите
          позже ставить лайки и писать комментарии, можно{' '}
          <Link href={loginHref} className={styles['reviews-tab__link']}>
            войти
          </Link>{' '}
          или{' '}
          <Link href={registerHref} className={styles['reviews-tab__link']}>
            зарегистрироваться
          </Link>
          .
        </p>
      )}

      {!userHasReview && (
        <ReviewForm
          movieId={movieId}
          user={user}
          onReviewSubmitted={onReviewSubmitted}
        />
      )}

      {reviewsLoading ? (
        <p className={styles['reviews-tab__empty']}>Загрузка отзывов...</p>
      ) : reviews.length === 0 ? (
        <div className={styles['reviews-tab__empty-state']}>
          <p className={styles['reviews-tab__empty-title']}>{emptyTitle}</p>
          <p className={styles['reviews-tab__empty']}>{emptyText}</p>
        </div>
      ) : (
        <div className={styles['reviews-tab__list']}>
          {reviews.map((review) => (
            <ReviewCard
              key={review._id}
              reviewId={review._id}
              userId={review.userId}
              userName={review.userName}
              rating={review.rating}
              text={review.text}
              createdAt={review.createdAt}
              likesCount={review.likesCount}
              dislikesCount={review.dislikesCount}
              userReaction={review.userReaction}
              commentsCount={review.commentsCount}
              status={review.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Вкладка: Описание ---------- */

function DescriptionTab({ overview }: { overview: string }) {
  return (
    <div className={styles['description-tab']}>
      <p className={styles['description-tab__text']}>
        {overview || 'Описание недоступно'}
      </p>
    </div>
  );
}

/* ---------- Вкладка: Актеры и команда ---------- */

function CastMemberCard({
  name,
  role,
  profilePath,
}: {
  name: string;
  role: string;
  profilePath: string | null;
}) {
  return (
    <div className={styles['cast-tab__card']}>
      <div className={styles['cast-tab__photo']}>
        {profilePath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w185${profilePath}`}
            alt={name}
            fill
            sizes="60px"
            unoptimized
          />
        ) : (
          <div className={styles['cast-tab__placeholder']} />
        )}
      </div>
      <div className={styles['cast-tab__info']}>
        <p className={styles['cast-tab__name']}>{name}</p>
        <p className={styles['cast-tab__role']}>{role}</p>
      </div>
    </div>
  );
}

function CastTab({
  cast,
  crew,
}: {
  cast: MovieDetail['cast'];
  crew: MovieDetail['crew'];
}) {
  if (cast.length === 0 && crew.length === 0) {
    return <p className={styles['cast-tab__empty']}>Информация недоступна</p>;
  }

  return (
    <div className={styles['cast-tab']}>
      {cast.length > 0 && (
        <div className={styles['cast-tab__section']}>
          <h3 className={styles['cast-tab__title']}>Актерский состав</h3>
          <div className={styles['cast-tab__grid']}>
            {cast.map((member, i) => (
              <CastMemberCard
                key={`cast-${member.name}-${i}`}
                name={member.name}
                role={member.character}
                profilePath={member.profilePath}
              />
            ))}
          </div>
        </div>
      )}

      {crew.length > 0 && (
        <div className={styles['cast-tab__section']}>
          <h3 className={styles['cast-tab__title']}>Команда</h3>
          <div className={styles['cast-tab__grid']}>
            {crew.map((member, i) => (
              <CastMemberCard
                key={`crew-${member.name}-${i}`}
                name={member.name}
                role={member.job}
                profilePath={member.profilePath}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Секция: Где посмотреть ---------- */

const RUSSIAN_SERVICES = [
  {
    name: 'Кинопоиск',
    buildUrl: (q: string) => `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(q)}`,
    color: '#ff6600',
  },
  {
    name: 'Иви',
    buildUrl: (q: string) => `https://www.ivi.tv/search?ivi_search=${encodeURIComponent(q)}`,
    color: '#ea1845',
  },
  {
    name: 'Okko',
    buildUrl: (q: string) => `https://okko.tv/search/${encodeURIComponent(q)}`,
    color: '#7b2bfc',
  },
  {
    name: 'KION',
    buildUrl: (q: string) => `https://kion.ru/search?searchValue=${encodeURIComponent(q)}`,
    color: '#00b4ff',
  },
];

function WatchProvidersSection({ movieTitle }: { movieTitle: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles['watch-providers']}>
      <button
        className={styles['watch-providers__header']}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <h3 className={styles['watch-providers__title']}>Где посмотреть</h3>
        <svg
          className={`${styles['watch-providers__arrow']} ${open ? styles['watch-providers__arrow--open'] : ''}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 8 10 12 14 8" />
        </svg>
      </button>
      {open && (
        <div className={styles['watch-providers__body']}>
          <div className={styles['watch-providers__services']}>
            {RUSSIAN_SERVICES.map((service) => (
              <a
                key={service.name}
                href={service.buildUrl(movieTitle)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles['watch-providers__service']}
                style={{ '--service-color': service.color } as React.CSSProperties}
              >
                {service.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Вкладка: Кадры ---------- */

function StillsTab({ stills }: { stills: string[] }) {
  if (stills.length === 0) {
    return <p className={styles['stills-tab__empty']}>Кадры недоступны</p>;
  }

  return (
    <div className={styles['stills-tab']}>
      {stills.map((path) => (
        <div key={path} className={styles['stills-tab__item']}>
          <Image
            src={`https://image.tmdb.org/t/p/w780${path}`}
            alt="Кадр из фильма"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}
