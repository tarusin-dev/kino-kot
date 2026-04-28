'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import AuthForm from '../../components/AuthForm/AuthForm';
import FormInput from '../../components/FormInput/FormInput';
import { useAuth } from '../../context/AuthContext';
import styles from './page.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function LoginPage() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={null}>
          <LoginPageContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const redirectParam = searchParams.get('redirect');
  const authError = searchParams.get('authError');
  const redirectPath =
    redirectParam && redirectParam.startsWith('/') ? redirectParam : '/';
  const registerHref =
    redirectPath === '/'
      ? '/register'
      : `/register?redirect=${encodeURIComponent(redirectPath)}`;
  const googleHref = `${API_URL}/auth/google?${new URLSearchParams({
    redirect: redirectPath,
    source: '/login',
  }).toString()}`;

  useEffect(() => {
    if (authError === 'google') {
      setServerError('Не удалось выполнить вход через Google. Попробуйте ещё раз.');
    }
  }, [authError]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Некорректный email';
    if (!form.password) newErrors.password = 'Введите пароль';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setServerError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(form.email, form.password);
      router.push(redirectPath);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Неверный email или пароль',
      );
    }
  };

  return (
    <AuthForm
      title="Вход"
      submitText="Войти"
      footerText="Нет аккаунта?"
      footerLinkText="Зарегистрироваться"
      footerLinkHref={registerHref}
      googleHref={googleHref}
      error={serverError}
      onSubmit={handleSubmit}
    >
      <FormInput
        name="email"
        placeholder="Email"
        icon="/icons/mail.svg"
        value={form.email}
        onChange={handleChange}
        error={errors.email}
      />
      <FormInput
        type="password"
        name="password"
        placeholder="Пароль"
        icon="/icons/eye-show.svg"
        value={form.password}
        onChange={handleChange}
        error={errors.password}
      />
      <Link href="/forgot-password" className={styles['login__forgot-link']}>
        Забыли пароль?
      </Link>
    </AuthForm>
  );
}
