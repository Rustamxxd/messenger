'use client';

import { useState, useEffect } from 'react';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import styles from '@/styles/ChatPage.module.css';
import GroupSidebar from '@/components/GroupSidebar';
import ProfileSidebar from '@/components/ProfileSidebar';
import { useSelector } from 'react-redux';

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allMessages, setAllMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const currentUserId = useSelector(state => state.user.user?.uid);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [sidebarOpen]);

  const handleHeaderClick = () => {
    setSidebarOpen(true);
  };

  return (
    <div className={styles.chatPage}>
      <div className={styles.sidebar}>
        <ChatList onSelectChat={(chat) => { setSelectedChat(chat); setSidebarOpen(false); }} selectedChat={selectedChat} />
      </div>
      <div className={styles.chatWindow}>
        {selectedChat && (
          <>
            <ChatWindow
              chatId={selectedChat.id}
              onHeaderClick={handleHeaderClick}
              onMessages={setAllMessages}
              onTypingUsers={setTypingUsers}
            />
            {selectedChat.isGroup ? (
              <GroupSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                group={selectedChat}
                currentUserId={currentUserId}
                allMessages={allMessages}
                typingUsers={typingUsers}
              />
            ) : (
              <ProfileSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={selectedChat}
                allMessages={allMessages}
                currentUserId={currentUserId}
                typingUsers={typingUsers}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}