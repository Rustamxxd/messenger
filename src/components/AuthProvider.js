'use client';

import { createContext, useContext } from 'react';
import { useAuthState } from '@/hooks/useAuth';
import { messaging, getToken } from '@/lib/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';
import { onMessage } from 'firebase/messaging';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { user, loading } = useAuthState();

  React.useEffect(() => {
    if (!user || !messaging) return;
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY }).then((currentToken) => {
          if (currentToken) {
            updateDoc(doc(db, 'users', user.uid), { fcmToken: currentToken });
          }
        });
      }
    });
  }, [user]);

  React.useEffect(() => {
    if (!messaging || !user) return;
    const unsubscribe = onMessage(messaging, async (payload) => {
      // Ожидаем, что payload содержит chatId или groupId
      const groupId = payload?.data?.chatId || payload?.data?.groupId;
      if (!groupId) {
        // Если нет id группы — проигрываем всегда (старые уведомления)
        return;
      }
      // Проверяем настройку уведомлений
      const notifRef = doc(db, `users/${user.uid}/groupSettings/${groupId}`);
      const notifSnap = await getDoc(notifRef);
      if (!notifSnap.exists() || notifSnap.data().notifications !== false) {
        // Если нет документа или notifications=true — проигрываем звук
        return;
      }
      // Если notifications=false — не проигрываем звук
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [messaging, user]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}