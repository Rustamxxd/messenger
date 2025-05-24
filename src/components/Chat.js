"use client";

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../app/store/userSlice';
import { logoutUser } from '../lib/firebase';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import styles from '@/styles/Chat.module.css';

export default function Chat() {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [selectedChat, setSelectedChat] = useState(null);

  const handleLogout = async () => {
    await logoutUser();
    dispatch(logout());
    window.location.reload();
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.userInfo}>
        <p>{user?.displayName || user?.email}</p>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Выйти
        </button>
      </div>
      <div className={styles.chatSection}>
        <ChatList onSelectChat={setSelectedChat} />
        <div className={styles.chatWindow}>
          {selectedChat ? (
            <ChatWindow chatId={selectedChat.id} />
          ) : (
            <p>Выберите чат</p>
          )}
        </div>
      </div>
    </div>
  );
}