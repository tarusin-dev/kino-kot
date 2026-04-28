'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import {
  getCookieConsent,
  saveCookieConsent,
  type CookieConsentValue,
} from '@/lib/cookie-consent';
import styles from './CookieConsent.module.scss';

export default function CookieConsent() {
  const settingsId = useId();
  const [isVisible, setIsVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState(false);

  useEffect(() => {
    setIsVisible(getCookieConsent() === null);
  }, []);

  const handleChoice = (value: CookieConsentValue) => {
    saveCookieConsent(value);
    setIsVisible(false);
  };

  const handleSaveSettings = () => {
    handleChoice(isAnalyticsEnabled ? 'accepted' : 'rejected');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <section
      className={styles['cookie-consent']}
      aria-label="Настройки cookie"
      aria-live="polite"
    >
      <div className={styles['cookie-consent__content']}>
        <div className={styles['cookie-consent__text']}>
          <p className={styles['cookie-consent__eyebrow']}>Конфиденциальность</p>
          <h2 className={styles['cookie-consent__title']}>Cookie на КиноКот</h2>
          <p className={styles['cookie-consent__description']}>
            Мы используем необходимые cookie для входа и работы сайта. Аналитику
            Google Analytics включаем только с вашего согласия.{' '}
            <Link href="/privacy">Подробнее</Link>
          </p>
        </div>

        {isSettingsOpen && (
          <div className={styles['cookie-consent__settings']} id={settingsId}>
            <div className={styles['cookie-consent__option']}>
              <div>
                <h3 className={styles['cookie-consent__option-title']}>
                  Необходимые cookie
                </h3>
                <p className={styles['cookie-consent__option-description']}>
                  Нужны для авторизации, сессии и защиты гостевых отзывов от
                  повторной отправки.
                </p>
              </div>
              <span className={styles['cookie-consent__badge']}>Всегда включены</span>
            </div>

            <label className={styles['cookie-consent__option']}>
              <div>
                <span className={styles['cookie-consent__option-title']}>
                  Аналитика
                </span>
                <span className={styles['cookie-consent__option-description']}>
                  Помогает понимать, какие разделы работают лучше. На доступ к
                  сайту не влияет.
                </span>
              </div>
              <input
                className={styles['cookie-consent__switch-input']}
                type="checkbox"
                checked={isAnalyticsEnabled}
                onChange={(event) => setIsAnalyticsEnabled(event.target.checked)}
              />
              <span className={styles['cookie-consent__switch']} aria-hidden="true" />
            </label>
          </div>
        )}

        <div className={styles['cookie-consent__actions']}>
          <button
            className={styles['cookie-consent__button']}
            type="button"
            onClick={() => handleChoice('accepted')}
          >
            Принять все
          </button>
          <button
            className={`${styles['cookie-consent__button']} ${styles['cookie-consent__button--secondary']}`}
            type="button"
            onClick={() => handleChoice('rejected')}
          >
            Отклонить
          </button>
          <button
            className={`${styles['cookie-consent__button']} ${styles['cookie-consent__button--ghost']}`}
            type="button"
            aria-expanded={isSettingsOpen}
            aria-controls={settingsId}
            onClick={() => setIsSettingsOpen((value) => !value)}
          >
            {isSettingsOpen ? 'Скрыть' : 'Настроить'}
          </button>
          {isSettingsOpen && (
            <button
              className={`${styles['cookie-consent__button']} ${styles['cookie-consent__button--secondary']}`}
              type="button"
              onClick={handleSaveSettings}
            >
              Сохранить выбор
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
