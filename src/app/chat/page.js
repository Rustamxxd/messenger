'use client';

import { useState } from 'react';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import styles from '@/styles/ChatPage.module.css';

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);

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