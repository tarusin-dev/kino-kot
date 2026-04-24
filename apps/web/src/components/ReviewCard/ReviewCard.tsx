'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/utils/getInitials';
import { getAvatarColor } from '@/utils/getAvatarColor';
import CommentCard from '@/components/CommentCard/CommentCard';
import CommentForm from '@/components/CommentForm/CommentForm';
import ReportModal from '@/components/ReportModal/ReportModal';
import styles from './ReviewCard.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface CommentData {
  _id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

interface ReviewCardProps {
  reviewId: string;
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

export default function ReviewCard({
                                     reviewId,
                                     userId,
                                     userName,
                                     rating,
                                     text,
                                     createdAt,
                                     likesCount: initialLikes,
                                     dislikesCount: initialDislikes,
                                     userReaction: initialReaction,
                                     commentsCount: initialCommentsCount,
                                     status,
                                   }: ReviewCardProps) {
  const { user } = useAuth();
  const isOwnReview = user?.id === userId;
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [dislikesCount, setDislikesCount] = useState(initialDislikes);
  const [userReaction, setUserReaction] = useState(initialReaction);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [reportOpen, setReportOpen] = useState(false);

  const initials = getInitials(userName);
  const d = new Date(createdAt);
  const date = `${ String(d.getDate()).padStart(2, '0') }.${ String(d.getMonth() + 1).padStart(2, '0') }.${ d.getFullYear() }`;

  const fetchComments = async () => {
    try {
      const res = await fetch(`${ API_URL }/reviews/comments/${ reviewId }`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
        setCommentsCount(data.length);
        setCommentsLoaded(true);
      }
    } catch {
      // ignore
    }
  };

  const handleToggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && !commentsLoaded) {
      fetchComments();
    }
  };

  const handleCommentSubmitted = () => {
    fetchComments();
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c._id !== commentId));
    setCommentsCount((c) => c - 1);
  };

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!user) {
      toast.error('Войдите, чтобы оценить отзыв');
      return;
    }
    if (isOwnReview || isSubmitting) {
      return;
    }

    const prevLikes = likesCount;
    const prevDislikes = dislikesCount;
    const prevReaction = userReaction;

    if (userReaction === type) {
      setUserReaction(null);
      if (type === 'like') {
        setLikesCount((c) => c - 1);
      } else {
        setDislikesCount((c) => c - 1);
      }
    } else {
      if (userReaction) {
        if (userReaction === 'like') {
          setLikesCount((c) => c - 1);
        } else {
          setDislikesCount((c) => c - 1);
        }
      }
      setUserReaction(type);
      if (type === 'like') {
        setLikesCount((c) => c + 1);
      } else {
        setDislikesCount((c) => c + 1);
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${ API_URL }/reviews/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reviewId, type }),
      });

      if (res.ok) {
        const data = await res.json();
        setLikesCount(data.likesCount);
        setDislikesCount(data.dislikesCount);
        setUserReaction(data.userReaction);
      } else {
        setLikesCount(prevLikes);
        setDislikesCount(prevDislikes);
        setUserReaction(prevReaction);
        toast.error('Не удалось отправить реакцию');
      }
    } catch {
      setLikesCount(prevLikes);
      setDislikesCount(prevDislikes);
      setUserReaction(prevReaction);
      toast.error('Не удалось отправить реакцию');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={ `${ styles['review-card'] }${ status === 'pending' ? ` ${ styles['review-card--pending'] }` : '' }${ status === 'rejected' ? ` ${ styles['review-card--rejected'] }` : '' }` }>
      { status === 'pending' && (
        <div className={ styles['review-card__status-badge'] }>На модерации</div>
      ) }
      { status === 'rejected' && (
        <div className={ `${ styles['review-card__status-badge'] } ${ styles['review-card__status-badge--rejected'] }` }>Отклонено</div>
      ) }
      <div className={ styles['review-card__left'] }>
        <div
          className={ styles['review-card__avatar'] }
          style={ { backgroundColor: getAvatarColor(userName) } }
        >{ initials }</div>
        <div className={ styles['review-card__rating-badge'] }>
          <Image
            src="/icons/rating-paw-full.svg"
            alt=""
            width={ 16 }
            height={ 16 }
          />
          <span>{ rating.toFixed(1) }<span>/10</span></span>
        </div>
      </div>

      <div className={ styles['review-card__right'] }>
        <div className={ styles['review-card__right-header'] }>
          <span className={ styles['review-card__name'] }>{ userName }</span>
          <span className={ styles['review-card__date'] }>{ date }</span>
        </div>
        <p className={ styles['review-card__text'] }>{ text }</p>
        <div className={ styles['review-card__actions'] }>
          <div className={ styles['review-card__reactions'] }>
            <button
              className={ `${ styles['review-card__reaction-btn'] } ${ styles['review-card__reaction-btn--like'] } ${
                userReaction === 'like'
                  ? styles['review-card__reaction-btn--active']
                  : ''
              }` }
              onClick={ () => handleReaction('like') }
              disabled={ isSubmitting || isOwnReview }
              type="button"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 10v12"/>
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>
              </svg>
              <span>{ likesCount.toLocaleString('ru-RU') }</span>
            </button>

            <button
              className={ `${ styles['review-card__reaction-btn'] } ${ styles['review-card__reaction-btn--dislike'] } ${
                userReaction === 'dislike'
                  ? styles['review-card__reaction-btn--active']
                  : ''
              }` }
              onClick={ () => handleReaction('dislike') }
              disabled={ isSubmitting || isOwnReview }
              type="button"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 14V2"/>
                <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>
              </svg>
              <span>{ dislikesCount.toLocaleString('ru-RU') }</span>
            </button>
          </div>

          <div className={ styles['review-card__right-actions'] }>
            { user && !isOwnReview && (
              <button
                className={ styles['review-card__report-btn'] }
                onClick={ () => setReportOpen(true) }
                type="button"
                title="Пожаловаться"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                  <line
                    x1="4"
                    y1="22"
                    x2="4"
                    y2="15"
                  />
                </svg>
              </button>
            ) }

            <button
              className={ styles['review-card__comments-toggle'] }
              onClick={ handleToggleComments }
              type="button"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>
                <span className={ styles['review-card__comments-toggle-desktop'] }>
                  { commentsCount > 0
                    ? `Комментарии (${ commentsCount })`
                    : 'Комментировать' }
                </span>
                <span className={ styles['review-card__comments-toggle-mobile'] }>
                  { commentsCount > 0 ? `(${ commentsCount })` : '' }
                </span>
              </span>
            </button>
          </div>
        </div>

        { showComments && (
          <div className={ styles['review-card__comments-section'] }>
            { comments.length > 0 && (
              <div className={ styles['review-card__comments-list'] }>
                { comments.map((comment) => (
                  <CommentCard
                    key={ comment._id }
                    commentId={ comment._id }
                    userId={ comment.userId }
                    userName={ comment.userName }
                    text={ comment.text }
                    createdAt={ comment.createdAt }
                    isOwn={ user?.id === comment.userId }
                    onDeleted={ handleCommentDeleted }
                  />
                )) }
              </div>
            ) }

            { user ? (
              user.isEmailVerified ? (
                <CommentForm
                  reviewId={ reviewId }
                  onCommentSubmitted={ handleCommentSubmitted }
                />
              ) : (
                <p className={ styles['review-card__comments-auth'] }>
                  Подтвердите email, чтобы комментировать
                </p>
              )
            ) : (
              <p className={ styles['review-card__comments-auth'] }>
                <Link href="/login">Войдите</Link>, чтобы комментировать
              </p>
            ) }
          </div>
        ) }
      </div>

      <ReportModal
        isOpen={ reportOpen }
        onClose={ () => setReportOpen(false) }
        targetId={ reviewId }
        targetType="review"
      />
    </div>
  );
}
