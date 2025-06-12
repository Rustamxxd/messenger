'use client';

import { createContext, useContext } from 'react';
import { useAuthState } from '@/hooks/useAuth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { user, loading } = useAuthState();

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}