'use client';

import { useState, useEffect } from 'react';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import styles from '@/styles/ChatPage.module.css';

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && selectedChat) {
        setSelectedChat(null);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [selectedChat]);

  return (
    <div className={styles.chatPage}>
      <div className={styles.sidebar}>
        <ChatList onSelectChat={setSelectedChat} selectedChat={selectedChat} />
      </div>
      <div className={styles.chatWindow}>
        {selectedChat && <ChatWindow chatId={selectedChat.id} />}
      </div>
    </div>
  );
}