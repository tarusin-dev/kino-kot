'use client';

import { useRef, useEffect, useCallback } from 'react';
import ProfileReviewCard from '@/components/ProfileReviewCard/ProfileReviewCard';
import type { LatestReview } from '@/types/review';
import styles from './ReviewsMarquee.module.scss';

interface ReviewsMarqueeProps {
  reviews: LatestReview[];
  noContainer?: boolean;
}

export default function ReviewsMarquee({ reviews, noContainer }: ReviewsMarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);

  const getScrollAmount = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 340;
    const firstItem = track.querySelector<HTMLElement>(`.${styles['reviews-marquee__item']}`);
    const gap = 16;
    return firstItem ? firstItem.offsetWidth + gap : 340;
  }, []);

  const scrollNext = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const amount = getScrollAmount();
    const maxScroll = track.scrollWidth - track.clientWidth;

    if (track.scrollLeft >= maxScroll - 1) {
      track.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      track.scrollBy({ left: amount, behavior: 'smooth' });
    }
  }, [getScrollAmount]);

  const scroll = (direction: 'left' | 'right') => {
    const track = trackRef.current;
    if (!track) return;
    const amount = getScrollAmount();
    track.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (reviews.length <= 1) {
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      if (!isPausedRef.current) scrollNext();
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reviews.length, scrollNext]);

  const handleMouseEnter = () => { isPausedRef.current = true; };
  const handleMouseLeave = () => { isPausedRef.current = false; };

  if (reviews.length === 0) return null;

  const content = (
    <>
      <div className={styles['reviews-marquee__header']}>
        <h2 className={styles['reviews-marquee__title']}>Последние отзывы</h2>
        {reviews.length > 1 && (
          <div className={styles['reviews-marquee__controls']}>
            <button
              className={`${styles['reviews-marquee__arrow']} ${styles['reviews-marquee__arrow--left']}`}
              onClick={() => scroll('left')}
              aria-label="Назад"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className={`${styles['reviews-marquee__arrow']} ${styles['reviews-marquee__arrow--right']}`}
              onClick={() => scroll('right')}
              aria-label="Вперёд"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      <div
        className={styles['reviews-marquee__track']}
        ref={trackRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {reviews.map((review) => (
          <div key={review._id} className={styles['reviews-marquee__item']}>
            <ProfileReviewCard
              movieTitle={review.movie.title}
              moviePosterPath={review.movie.posterPath}
              movieId={review.movie._id}
              userName={review.userName}
              rating={review.rating}
              text={review.text}
              createdAt={review.createdAt}
            />
          </div>
        ))}
      </div>
    </>
  );

  if (noContainer) {
    return (
      <section className={styles['reviews-marquee']}>
        {content}
      </section>
    );
  }

  return (
    <section className={styles['reviews-marquee']}>
      <div className={styles['reviews-marquee__wrap']}>
        {content}
      </div>
    </section>
  );
}
