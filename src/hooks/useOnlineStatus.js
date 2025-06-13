import { useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useOnlineStatus = (userId) => {
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);

    const setOnline = async () => {
      await updateDoc(userRef, {
        lastSeen: serverTimestamp(),
        online: true,
      });
    };

    const setOffline = async () => {
      await updateDoc(userRef, {
        lastSeen: serverTimestamp(),
        online: false,
      });
    };

    // При любой активности — online
    const handleActivity = () => setOnline();

    // При закрытии вкладки — offline
    window.addEventListener('beforeunload', setOffline);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Сразу online при заходе
    setOnline();

    // Чистим слушатели
    return () => {
      setOffline();
      window.removeEventListener('beforeunload', setOffline);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [userId]);
}; 