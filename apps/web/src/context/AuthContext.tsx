'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: { name?: string }) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function AuthProvider({
  children,
  disableInitialFetch = false,
}: {
  children: React.ReactNode;
  disableInitialFetch?: boolean;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!disableInitialFetch);

  useEffect(() => {
    if (disableInitialFetch) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [disableInitialFetch]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Ошибка входа');
    }

    const data = await res.json();
    setUser(data.user);
    toast.success('Вы вошли в аккаунт');
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Ошибка регистрации');
    }

    const data = await res.json();
    if (data.user) {
      setUser(data.user);
    }
    toast.success('Аккаунт создан. Ссылку для подтверждения email уже отправили.');
  };

  const logout = async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    toast.success('Вы вышли из аккаунта');
  };

  const updateUser = async (data: { name?: string }) => {
    const res = await fetch(`${API_URL}/users/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Ошибка обновления профиля');
    }

    const result = await res.json();
    setUser(result.user);
    toast.success('Профиль обновлён');
  };

  const deleteAccount = async () => {
    const res = await fetch(`${API_URL}/users/account`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Ошибка удаления аккаунта');
    }

    setUser(null);
    toast.success('Аккаунт удалён');
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const res = await fetch(`${API_URL}/users/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Ошибка смены пароля');
    }

    toast.success('Пароль успешно изменён');
  };

  const resendVerification = async (email: string) => {
    const res = await fetch(`${API_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Ошибка отправки письма');
    }

    toast.success('Письмо отправлено повторно');
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser, resendVerification, deleteAccount, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
