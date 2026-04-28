'use client';

import Link from 'next/link';
import styles from './AuthForm.module.scss';

interface AuthFormProps {
  title: string;
  submitText: string;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
  googleHref?: string;
  error?: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

export default function AuthForm({
  title,
  submitText,
  footerText,
  footerLinkText,
  footerLinkHref,
  googleHref,
  error,
  onSubmit,
  children,
}: AuthFormProps) {
  return (
    <div className={styles['auth-form']}>
      <div className={styles['auth-form__card']}>
        <h1 className={styles['auth-form__title']}>{title}</h1>

        {error && <p className={styles['auth-form__error']}>{error}</p>}

        {googleHref && (
          <>
            <a href={googleHref} className={styles['auth-form__google']}>
              Продолжить с Google
            </a>
            <div className={styles['auth-form__divider']}>
              <span>или</span>
            </div>
          </>
        )}

        <form onSubmit={onSubmit} className={styles['auth-form__form']}>
          {children}
          <button type="submit" className={styles['auth-form__submit']}>
            {submitText}
          </button>
        </form>

        <p className={styles['auth-form__footer']}>
          {footerText}{' '}
          <Link href={footerLinkHref} className={styles['auth-form__link']}>
            {footerLinkText}
          </Link>
        </p>
      </div>
    </div>
  );
}
