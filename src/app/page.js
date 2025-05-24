'use client';

import { useSelector } from 'react-redux';
import LoginPage from '@/app/(auth)/login/page';
import Chat from '@/components/Chat';

export default function Home() {
  const user = useSelector((state) => state.user.user);
  return user ? <Chat /> : <LoginPage />;
}
