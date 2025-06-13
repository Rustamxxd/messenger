'use client';

import { Spin } from 'antd';
import styles from '@/styles/Loading.module.css';
import { useAuthContext } from '@/components/AuthProvider';
import LoginPage from '@/app/(auth)/login/page';
import { useRouter } from 'next/navigation';
import LoadingDots from '@/components/LoadingDots';

export default function Home() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <div className={styles.loadingText}>
          Загрузка<LoadingDots />
        </div>
      </div>
    );
  }

  if (user) {
    if (typeof window !== 'undefined') {
      router.replace('/chat');
    }
    return null;
  }

  return <LoginPage />;
}