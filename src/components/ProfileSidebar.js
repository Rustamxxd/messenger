import React, { useState, useEffect, useRef } from 'react';
import styles from '@/styles/ProfileSidebar.module.css';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MdOutlineAlternateEmail, MdInfoOutline, MdNotificationsNone } from 'react-icons/md';
import { Switch } from 'antd';
import MediaViewer from './MediaViewer';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import { LuInfo } from "react-icons/lu";

function extractLinks(text) {
  if (!text) return [];
  const urlRegex = /(@?https?:\/\/[^\s]+|@?https?:\/[^\s]+|@?www\.[^\s]+|@?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}[^\s]*)/g;
  return text.match(urlRegex) || [];
}

function LoadingDots() {
  return <span className={styles.dots}>...</span>;
}

function getDomain(url) {
  try {
    url = url.replace(/^@/, '');
    url = url.replace(/^(https?:)\/([^/])/, '$1//$2');
    if (!/^https?:\/\//.test(url)) url = 'https://' + url;
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '');
  } catch {
    const match = url.match(/([a-zA-Z0-9-]{1,61}\.[a-zA-Z]{2,})/);
    return match ? match[1] : url;
  }
}

const ProfileSidebar = ({ open, onClose, user: initialUser, typingUsers = [], allMessages = [], currentUserId, onScrollToMessage }) => {
  const [user, setUser] = useState(initialUser);
  const [tab, setTab] = useState('media');
  const messages = user?.messages || [];

  // Ref для автоскролла всего сайдбара
  const sidebarContentRef = useRef(null);

  // Для длительности видео
  const [videoDurations, setVideoDurations] = useState({});

  // Для MediaViewer
  const [modalMedia, setModalMedia] = useState(null);

  const [tabTransition, setTabTransition] = useState(false);
  const [swapDirection, setSwapDirection] = useState('right');
  const [contentVisible, setContentVisible] = useState(true);
  const prevTab = useRef(tab);

  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleLoadedMetadata = (i, e) => {
    setVideoDurations(prev => ({ ...prev, [i]: e.target.duration }));
  };

  function formatDuration(seconds) {
    if (!seconds) return null;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  useEffect(() => {
    setUser(initialUser);
    if (!initialUser?.uid) return;
    const userRef = doc(db, 'users', initialUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setUser(prevUser => ({
          ...prevUser,
          ...userData,
          lastSeen: userData.lastSeen
        }));
      }
    });
    return () => unsubscribe();
  }, [initialUser?.uid]);

  useEffect(() => {
    if (prevTab.current !== tab) {
      const tabOrder = ['media', 'links', 'voice'];
      const prevIndex = tabOrder.indexOf(prevTab.current);
      const currentIndex = tabOrder.indexOf(tab);
      const direction = currentIndex > prevIndex ? 'right' : 'left';
      
      setSwapDirection(direction);
      setTabTransition(true);
      const timeout = setTimeout(() => setTabTransition(false), 300);
      prevTab.current = tab;
      return () => clearTimeout(timeout);
    }
  }, [tab]);

  // Escape для закрытия сайдбара
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  let status = '';
  let statusClass = styles.userStatus;
  if (typingUsers.length > 0) {
    status = 'печатает';
    statusClass += ' ' + styles.typingStatus;
  } else if (user?.lastSeen) {
    const lastSeen = user.lastSeen?.toDate?.() || user.lastSeen;
    const now = new Date();
    const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));
    if (diffMinutes < 5) {
      status = 'в сети';
      statusClass += ' ' + styles.onlineStatus;
    } else {
      status = 'был(а) недавно';
    }
  }

  const allMedia = (allMessages || []).filter(m => (m.fileType === 'image' || m.fileType === 'video') && !m.deleted);
  const allLinks = (allMessages || []).filter(
    m =>
      (!m.fileType || m.fileType === 'text') &&
      extractLinks(m.text).length > 0 &&
      !m.deleted &&
      !(m.hiddenFor && m.hiddenFor.includes(currentUserId))
  );
  const voices = (allMessages || []).filter(
    m => 
      m.fileType === 'audio' && 
      !m.deleted && 
      !(m.hiddenFor && m.hiddenFor.includes(currentUserId))
  );

  // Автоскролл вниз при изменении вкладки или содержимого
  useEffect(() => {
    if (sidebarContentRef.current) {
      sidebarContentRef.current.scrollTop = sidebarContentRef.current.scrollHeight;
    }
  }, [tab, allMedia.length, allLinks.length, voices.length]);

  const defaultAvatar = "/assets/default-avatar.png";

  return (
    <>
      <div className={styles.overlay + (open ? ' ' + styles.open : '')} onClick={onClose} />
      <aside className={styles.sidebar + (open ? ' ' + styles.open : '')}>
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
          <span className={styles.headerTitle}>Информация</span>
        </div>
        
        <div 
          className={styles.sidebarContent}
          ref={sidebarContentRef}
        >
          <div className={styles.avatarWrapper}>
            <img src={user?.photoURL || defaultAvatar} alt="avatar" className={styles.avatar} />
            <div className={styles.profileInfo}>
              <div className={styles.displayName}>{user?.displayName || 'Пользователь'}</div>
              {status && (
                <div className={statusClass}>
                  {status}
                  {typingUsers.length > 0 && <LoadingDots />}
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.section}>
            <div
              className={styles.menuItem}
              style={{ position: 'relative', cursor: 'pointer' }}
              title="Скопировать ник"
              onClick={e => {
                if (user?.displayName) {
                  navigator.clipboard.writeText(user.displayName);
                  setShowSnackbar(true);
                  setTimeout(() => setShowSnackbar(false), 3000);
                }
                const target = e.currentTarget;
                const circle = document.createElement('span');
                const diameter = Math.max(target.clientWidth, target.clientHeight);
                const radius = diameter / 2;
                circle.className = styles.ripple;
                circle.style.width = circle.style.height = `${diameter}px`;
                circle.style.left = `${e.clientX - target.getBoundingClientRect().left - radius}px`;
                circle.style.top = `${e.clientY - target.getBoundingClientRect().top - radius}px`;
                target.appendChild(circle);
                setTimeout(() => circle.remove(), 500);
              }}
            >
              <span className={styles.menuIcon}><MdOutlineAlternateEmail /></span>
              <div className={styles.menuTextBlock}>
                <span className={styles.menuMainText}>{user?.displayName || '—'}</span>
                <span className={styles.menuSubText}>Имя пользователя</span>
              </div>
            </div>
            <div className={styles.menuItem}
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={e => {
                const target = e.currentTarget;
                const circle = document.createElement('span');
                const diameter = Math.max(target.clientWidth, target.clientHeight);
                const radius = diameter / 2;
                circle.className = styles.ripple;
                circle.style.width = circle.style.height = `${diameter}px`;
                circle.style.left = `${e.clientX - target.getBoundingClientRect().left - radius}px`;
                circle.style.top = `${e.clientY - target.getBoundingClientRect().top - radius}px`;
                target.appendChild(circle);
                setTimeout(() => circle.remove(), 500);
              }}
            >
              <span className={styles.menuIcon}><MdInfoOutline /></span>
              <div className={styles.menuTextBlock}>
                <span className={styles.menuMainText}>{user?.about || '—'}</span>
                <span className={styles.menuSubText}>О себе</span>
              </div>
            </div>
            <div className={styles.menuItem}>
              <span className={styles.menuIcon}><MdNotificationsNone /></span>
              <span className={styles.menuMainText} style={{color:'#222'}}>Уведомления</span>
              <Switch defaultChecked style={{marginLeft:'auto'}} size="large"/>
            </div>
            
            <div className={styles.tabs}>
              <button className={tab === 'media' ? styles.activeTab : ''} onClick={() => setTab('media')}>Медиа</button>
              <button className={tab === 'links' ? styles.activeTab : ''} onClick={() => setTab('links')}>Ссылки</button>
              <button className={tab === 'voice' ? styles.activeTab : ''} onClick={() => setTab('voice')}>Голос</button>
            </div>
          </div>

          {/* Контент вкладок с анимацией */}
          <div className={styles.tabContentWrapper + (tabTransition ? ' ' + styles.tabContentTransition + ' ' + styles['swap' + swapDirection.charAt(0).toUpperCase() + swapDirection.slice(1)] : '')} key={tab}>
            {contentVisible && (
              <>
                {tab === 'media' && (
                  <>
                    {allMedia.length > 0 && (
                      <div className={styles.mediaGrid}>
                        {[...allMedia].reverse().map((m, i) => {
                          const mediaArr = allMedia.map(med => ({ url: med.text, type: med.fileType }));
                          const handleOpenMedia = () => setModalMedia({ files: mediaArr, initialIndex: allMedia.length - 1 - i });
                          return m.fileType === 'image' ? (
                            <img
                              key={i}
                              src={m.text}
                              alt="media"
                              className={styles.mediaThumb}
                              onClick={handleOpenMedia}
                            />
                          ) : (
                            <div key={i} className={styles.videoPreviewWrapper}>
                              <video
                                src={m.text}
                                className={styles.mediaThumb}
                                muted
                                preload="metadata"
                                onLoadedMetadata={e => handleLoadedMetadata(i, e)}
                                onClick={handleOpenMedia}
                                style={{ cursor: 'pointer' }}
                              />
                              {videoDurations[i] && (
                                <span className={styles.videoDuration}>{formatDuration(videoDurations[i])}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {allMedia.length === 0 && (
                      <div className={styles.emptyTab}>Нет медиа</div>
                    )}
                    {modalMedia && (
                      <MediaViewer
                        files={modalMedia.files}
                        initialIndex={modalMedia.initialIndex}
                        onClose={() => setModalMedia(null)}
                      />
                    )}
                  </>
                )}
                
                {tab === 'links' && allLinks.length > 0 && (
                  <div className={styles.linksSection}>
                    {[...allLinks].reverse().map((m, i) => (
                      extractLinks(m.text).map((url, j) => {
                        const domain = getDomain(url);
                        const firstLetter = domain[0]?.toUpperCase() || '';
                        return (
                          <div key={j} className={styles.linkMenuItem}>
                            <span className={styles.linkAvatarLarge}>{firstLetter}</span>
                            <div className={styles.menuTextBlock}>
                              <span
                                className={styles.menuMainText}
                                onClick={() => onScrollToMessage && onScrollToMessage(m.id)}
                                style={{ cursor: 'pointer' }}
                              >
                                {domain}
                              </span>
                              <a
                                href={url.replace(/^@/, '').replace(/^https?:\/\//, 'https://')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.linkUrl}
                              >
                                {url.replace(/^@/, '')}
                              </a>
                            </div>
                          </div>
                        );
                      })
                    ))}
                  </div>
                )}
                {tab === 'links' && allLinks.length === 0 && (
                  <div className={styles.emptyTab}>Нет ссылок</div>
                )}
                
                {tab === 'voice' && voices.length > 0 && (
                  <div className={styles.voiceSection}>
                    {voices.map((m, i) => {
                      const isMe = m.sender === currentUserId;
                      const senderName = isMe ? 'Вы' : (initialUser?.displayName || m.senderName || m.sender || '—');
                      return (
                        <div key={i} className={styles.voiceMenuItem} style={{alignItems: 'center'}}>
                          <div className={styles.voiceTextBlock}>
                            <div className={styles.voiceSender}>
                              {senderName}
                            </div>
                            <VoiceMessagePlayer src={m.text} isOwn={isMe} />
                          </div>
                          <span className={styles.voiceDate}>
                            {(() => {
                              if (!m.timestamp) return '';
                              const date = m.timestamp.toDate ? m.timestamp.toDate() : m.timestamp;
                              const now = new Date();
                              const isToday = date.toDateString() === now.toDateString();
                              const yesterday = new Date(now);
                              yesterday.setDate(now.getDate() - 1);
                              const isYesterday = date.toDateString() === yesterday.toDateString();
                              if (isToday) {
                                return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                              } else if (isYesterday) {
                                return 'вчера';
                              } else {
                                return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
                              }
                            })()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {tab === 'voice' && voices.length === 0 && (
                  <div className={styles.emptyTab}>Нет голосовых</div>
                )}
              </>
            )}
          </div>
        </div>
      </aside>
      {showSnackbar && (
        <div className={styles.snackbar}>
          <LuInfo className={styles.snackbarIcon} />
          Имя пользователя скопирован
        </div>
      )}
    </>
  );
};

export default ProfileSidebar;