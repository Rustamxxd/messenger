import React, { useState, useEffect } from 'react';
import styles from '@/styles/ProfileSidebar.module.css';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MdOutlineAlternateEmail, MdInfoOutline, MdNotificationsNone } from 'react-icons/md';
import { Switch } from 'antd';

function extractLinks(text) {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

function LoadingDots() {
  return <span className={styles.dots}>...</span>;
}

const ProfileSidebar = ({ open, onClose, user: initialUser, typingUsers = [] }) => {
  const [user, setUser] = useState(initialUser);
  const [tab, setTab] = useState('media');
  const messages = user?.messages || [];

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
  const media = messages.filter(m => m.fileType === 'image' || m.fileType === 'video');
  const links = messages.filter(m => extractLinks(m.text).length > 0);
  const voices = messages.filter(m => m.fileType === 'audio');

  return (
    <>
      <div className={styles.overlay + (open ? ' ' + styles.open : '')} onClick={onClose} />
      <aside className={styles.sidebar + (open ? ' ' + styles.open : '')}>
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
          <span className={styles.headerTitle}>Информация</span>
        </div>
        <div className={styles.avatarWrapper}>
          <img src={user?.photoURL || '/default-avatar.png'} alt="avatar" className={styles.avatar} />
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
          <div className={styles.menuItem}>
            <span className={styles.menuIcon}><MdOutlineAlternateEmail /></span>
            <div className={styles.menuTextBlock}>
              <span className={styles.menuMainText}>{user?.displayName || '—'}</span>
              <span className={styles.menuSubText}>Имя пользователя</span>
            </div>
          </div>
          <div className={styles.menuItem}>
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
          <div className={styles.tabContent}>
            {tab === 'media' && media.length > 0 && (
              <div className={styles.mediaGrid}>
                {media.map((m, i) => m.fileType === 'image' ? (
                  <img key={i} src={m.text} alt="media" className={styles.mediaThumb} />
                ) : (
                  <video key={i} src={m.text} className={styles.mediaThumb} controls />
                ))}
              </div>
            )}
            {tab === 'links' && links.length > 0 && (
              <div className={styles.linksList}>
                {links.map((m, i) => (
                  <div key={i} className={styles.linkItem}>
                    {extractLinks(m.text).map((url, j) => (
                      <a key={j} href={url} target="_blank" rel="noopener noreferrer" className={styles.linkUrl}>{url}</a>
                    ))}
                    <div className={styles.linkText}>{m.text}</div>
                  </div>
                ))}
              </div>
            )}
            {tab === 'voice' && voices.length > 0 && (
              <div className={styles.voiceList}>
                {voices.map((m, i) => (
                  <audio key={i} src={m.text} controls className={styles.voiceAudio} />
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Сообщения о пустых вкладках вне блока section */}
        {tab === 'media' && media.length === 0 && (
          <div className={styles.emptyTab}>Нет медиа</div>
        )}
        {tab === 'links' && links.length === 0 && (
          <div className={styles.emptyTab}>Нет ссылок</div>
        )}
        {tab === 'voice' && voices.length === 0 && (
          <div className={styles.emptyTab}>Нет голосовых</div>
        )}
      </aside>
    </>
  );
};

export default ProfileSidebar;