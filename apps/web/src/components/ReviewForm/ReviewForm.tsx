'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getInitials } from '@/utils/getInitials';
import { getAvatarColor } from '@/utils/getAvatarColor';
import { getMoviePath } from '@/utils/getMoviePath';
import styles from './ReviewForm.module.scss';

interface ReviewFormProps {
  movieId: string;
  user?: { id: string; name: string; email: string } | null;
  onReviewSubmitted: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const GUEST_TOKEN_STORAGE_KEY = 'kino_kot_guest_review_token';

function getGuestToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  const existing = window.localStorage.getItem(GUEST_TOKEN_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, generated);
  return generated;
}

export default function ReviewForm({ movieId, user, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [guestSubmitted, setGuestSubmitted] = useState(false);

  const displayRating = hoverRating || rating;
  const displayName = user?.name || guestName.trim() || 'Гость';
  const initials = getInitials(displayName);
  const redirectPath = `${getMoviePath(movieId)}#reviews`;
  const registerHref = `/register?redirect=${encodeURIComponent(redirectPath)}`;
  const loginHref = `/login?redirect=${encodeURIComponent(redirectPath)}`;
  const canSubmitGuest = guestName.trim().length >= 2;

  const handleSubmit = async () => {
    if (!rating || text.trim().length < 5 || !agreed) return;
    if (!user && !canSubmitGuest) return;

    setSubmitting(true);
    try {
      const payload = user
        ? { movieId, rating, text: text.trim() }
        : {
            movieId,
            rating,
            text: text.trim(),
            guestName: guestName.trim(),
            guestToken: getGuestToken(),
          };
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Ошибка при отправке');
      }

      const result = await res.json();
      if (result.status === 'pending') {
        toast.success('Отзыв отправлен на модерацию');
      } else {
        toast.success('Отзыв отправлен!');
      }
      if (!user) {
        setGuestSubmitted(true);
      }
      setRating(0);
      setText('');
      setAgreed(false);
      onReviewSubmitted();
    } catch (err: any) {
      toast.error(err.message || 'Ошибка при отправке');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles['review-form']}>
      {!user && (
        <div className={styles['review-form__guest-note']}>
          <p className={styles['review-form__guest-title']}>
            Можно оставить отзыв без регистрации
          </p>
          <p className={styles['review-form__guest-text']}>
            Гостевые отзывы проходят ручную модерацию. Аккаунт понадобится только
            для лайков, комментариев и управления профилем.
          </p>
        </div>
      )}

      {!user && (
        <input
          className={styles['review-form__input']}
          placeholder="Ваше имя"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          maxLength={40}
        />
      )}

      <div className={styles['review-form__rating-row']}>
        <div
          className={styles['review-form__avatar']}
          style={{ backgroundColor: getAvatarColor(displayName) }}
        >
          {initials}
        </div>

        <div className={styles['review-form__paws']}>
          {Array.from({ length: 10 }, (_, i) => (
            <button
              key={i}
              type="button"
              className={styles['review-form__paw']}
              onClick={() => setRating(i + 1)}
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
            >
              <Image
                src={
                  i < displayRating
                    ? '/icons/rating-paw-full.svg'
                    : '/icons/rating-paw-empty.svg'
                }
                alt={`${i + 1}`}
                width={28}
                height={28}
              />
            </button>
          ))}
        </div>

        {displayRating > 0 && (
          <span className={styles['review-form__rating-label']}>
            <strong>{displayRating}</strong>/10 кинолапок
          </span>
        )}
      </div>

      <textarea
        className={styles['review-form__textarea']}
        placeholder="Твой отзыв (минимум 5 символов)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        minLength={5}
        maxLength={2000}
        rows={3}
      />
      <div className={styles['review-form__char-count']}>
        <span className={text.trim().length > 0 && text.trim().length < 5 ? styles['review-form__char-count--error'] : ''}>
          {text.trim().length}
        </span>
        /2000
      </div>

      <label className={styles['review-form__agreement']}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <span>
          Я принимаю{' '}
          <a href="/terms" className={styles['review-form__agreement-link']}>
            пользовательское соглашение
          </a>
        </span>
      </label>

      <button
        className={styles['review-form__submit']}
        onClick={handleSubmit}
        disabled={
          submitting ||
          !rating ||
          text.trim().length < 5 ||
          !agreed ||
          (!user && !canSubmitGuest)
        }
      >
        {submitting ? 'Отправка...' : 'Отправить'}
      </button>

      {!user && guestSubmitted && (
        <div className={styles['review-form__success-box']}>
          <p className={styles['review-form__success-text']}>
            Отзыв принят и ждёт модерации. Если захотите комментировать и
            оценивать чужие отзывы, можно позже{' '}
            <Link href={registerHref}>создать аккаунт</Link> или{' '}
            <Link href={loginHref}>войти</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
