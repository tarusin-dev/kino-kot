import Image from 'next/image';
import type { Metadata } from 'next';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'КиноКот скоро вернётся',
  description: 'На сайте КиноКот временно ведутся технические работы.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MaintenancePage() {
  return (
    <main className={styles['maintenance']}>
      <section className={styles['maintenance__content']} aria-labelledby="maintenance-title">
        <div className={styles['maintenance__brand']}>
          <Image src="/images/logo.svg" alt="КиноКот" width={162} height={44} priority />
        </div>

        <div className={styles['maintenance__hero']}>
          <div className={styles['maintenance__copy']}>
            <p className={styles['maintenance__eyebrow']}>Технические работы</p>
            <h1 id="maintenance-title" className={styles['maintenance__title']}>
              КиноКот скоро заработает
            </h1>
            <p className={styles['maintenance__text']}>
              Сейчас обновляем сервер и базу данных, поэтому часть сайта временно недоступна.
              Вернём доступ, как только проверим стабильность работы.
            </p>
          </div>

          <div className={styles['maintenance__image-wrap']} aria-hidden="true">
            <Image
              src="/images/cat-2.png"
              alt=""
              width={360}
              height={360}
              className={styles['maintenance__image']}
              priority
            />
          </div>
        </div>

        <div className={styles['maintenance__status']}>
          <span className={styles['maintenance__status-dot']} />
          <span>Ведутся работы. Пожалуйста, зайдите чуть позже.</span>
        </div>
      </section>
    </main>
  );
}
