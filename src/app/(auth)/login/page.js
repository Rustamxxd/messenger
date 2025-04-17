"use client";

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useStore } from '@/store/store';
import { loginUser } from '@/lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setUser = useStore((state) => state.setUser);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await loginUser(email, password);
      setUser({ name: userCredential.displayName || email, email: userCredential.email });
      router.push('/');
    } catch (err) {
      setError('Неверный email или пароль');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Вход</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700">Пароль</label>
            <input
              type="password"
              id="password"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-500 text-white py-2 px-4 rounded-lg ${loading ? 'opacity-50' : 'hover:bg-blue-600'} transition-colors`}
          >
            {loading ? 'Загрузка...' : 'Войти'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <p>Нет аккаунта? <a href="/register" className="text-blue-500">Зарегистрируйтесь</a></p>
        </div>
      </div>
    </div>
  );
}