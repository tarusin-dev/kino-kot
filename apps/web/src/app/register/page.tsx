'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import AuthForm from '../../components/AuthForm/AuthForm';
import FormInput from '../../components/FormInput/FormInput';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (form.name.length < 2) newErrors.name = 'Минимум 2 символа';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Некорректный email';
    if (form.password.length < 6)
      newErrors.password = 'Минимум 6 символов';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setServerError('');
  };

  const redirectParam = searchParams.get('redirect');
  const redirectPath =
    redirectParam && redirectParam.startsWith('/') ? redirectParam : '/';
  const loginHref =
    redirectPath === '/'
      ? '/login'
      : `/login?redirect=${encodeURIComponent(redirectPath)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register(form.name, form.email, form.password);
      router.push(redirectPath);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Ошибка регистрации',
      );
    }
  };

  return (
    <>
      <Header />
      <main>
        <AuthForm
          title="Регистрация"
          submitText="Зарегистрироваться"
          footerText="Уже есть аккаунт?"
          footerLinkText="Войти"
          footerLinkHref={loginHref}
          error={serverError}
          onSubmit={handleSubmit}
        >
          <FormInput
            name="name"
            placeholder="Имя"
            icon="/icons/user.svg"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />
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
        </AuthForm>
      </main>
      <Footer />
    </>
  );
}
