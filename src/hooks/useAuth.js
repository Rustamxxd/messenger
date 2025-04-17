import { useState, useEffect } from 'react';
import { auth, loginUser, registerUser, logoutUser } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      await loginUser(email, password);
    } catch (error) {
      console.error('Ошибка при входе:', error);
    }
  };

  const register = async (email, password) => {
    try {
      await registerUser(email, password);
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
  };
}