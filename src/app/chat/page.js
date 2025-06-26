'use client';

import { useState, useEffect } from 'react';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import styles from '@/styles/ChatPage.module.css';
import GroupSidebar from '@/components/GroupSidebar';
import ProfileSidebar from '@/components/ProfileSidebar';
import { useSelector } from 'react-redux';
import MediaViewer from '@/components/MediaViewer';

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allMessages, setAllMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [mediaViewer, setMediaViewer] = useState(null);
  const [profileSidebarUser, setProfileSidebarUser] = useState(null);
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

  const handleScrollToMessage = (messageId) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlighted');
      setTimeout(() => el.classList.remove('highlighted'), 2000);
    }
  };

  const handleOpenProfile = (user) => {
    setSidebarOpen(false);
    setTimeout(() => setProfileSidebarUser(user), 300);
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
                onScrollToMessage={handleScrollToMessage}
                onOpenMedia={(files, initialIndex) => setMediaViewer({ files, initialIndex })}
                onOpenProfile={handleOpenProfile}
              />
            ) : (
              <ProfileSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={selectedChat}
                allMessages={allMessages}
                currentUserId={currentUserId}
                typingUsers={typingUsers}
                onScrollToMessage={handleScrollToMessage}
                onOpenMedia={(files, initialIndex) => setMediaViewer({ files, initialIndex })}
              />
            )}
            {mediaViewer && (
              <MediaViewer
                files={mediaViewer.files}
                initialIndex={mediaViewer.initialIndex}
                onClose={() => setMediaViewer(null)}
              />
            )}
            {profileSidebarUser && (
              <ProfileSidebar
                open={!!profileSidebarUser}
                onClose={() => setProfileSidebarUser(null)}
                user={profileSidebarUser}
                allMessages={allMessages}
                currentUserId={currentUserId}
                typingUsers={typingUsers}
                onScrollToMessage={handleScrollToMessage}
                onOpenMedia={(files, initialIndex) => setMediaViewer({ files, initialIndex })}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}