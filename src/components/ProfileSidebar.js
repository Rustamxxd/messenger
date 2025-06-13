import React, { useState } from 'react';
import styles from '@/styles/ProfileSidebar.module.css';

function extractLinks(text) {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

const ProfileSidebar = ({ open, onClose, user }) => {
  const [tab, setTab] = useState('media');
  // Ожидаем, что user.messages — это массив сообщений пользователя
  const messages = user?.messages || [];

  const media = messages.filter(m => m.fileType === 'image' || m.fileType === 'video');
  const links = messages.filter(m => extractLinks(m.text).length > 0);
  const voices = messages.filter(m => m.fileType === 'audio');

  return (
    <>
      <div className={styles.overlay + (open ? ' ' + styles.open : '')} onClick={onClose} />
      <aside className={styles.sidebar + (open ? ' ' + styles.open : '')}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        <div className={styles.avatarWrapper}>
          <img src={user?.photoURL || '/default-avatar.png'} alt="avatar" className={styles.avatar} />
        </div>
        <div className={styles.infoBlock}>
          <div className={styles.displayName}>{user?.displayName || 'Пользователь'}</div>
          {user?.username && (
            <div className={styles.usernameBlock}>
              <span className={styles.icon}>@</span>
              <span className={styles.username}>{user.username}</span>
              <span className={styles.usernameLabel}>Имя пользователя</span>
            </div>
          )}
          {user?.about && <div className={styles.about}>{user.about}</div>}
          {user?.email && <div className={styles.email}>{user.email}</div>}
        </div>
        <div className={styles.section}>
          <div className={styles.sectionRow}>
            <span className={styles.sectionIcon}>ℹ️</span>
            <span className={styles.sectionLabel}>О себе</span>
            <span className={styles.sectionValue}>{user?.about || '—'}</span>
          </div>
          <div className={styles.sectionRow}>
            <span className={styles.sectionIcon}>🔔</span>
            <span className={styles.sectionLabel}>Уведомления</span>
            <label className={styles.switch}>
              <input type="checkbox" defaultChecked readOnly />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>
        <div className={styles.tabs}>
          <button className={tab === 'media' ? styles.activeTab : ''} onClick={() => setTab('media')}>Медиа</button>
          <button className={tab === 'links' ? styles.activeTab : ''} onClick={() => setTab('links')}>Ссылки</button>
          <button className={tab === 'voice' ? styles.activeTab : ''} onClick={() => setTab('voice')}>Голос</button>
        </div>
        <div className={styles.tabContent}>
          {tab === 'media' && (
            <div className={styles.mediaGrid}>
              {media.length === 0 && <div className={styles.emptyTab}>Нет медиа</div>}
              {media.map((m, i) => m.fileType === 'image' ? (
                <img key={i} src={m.text} alt="media" className={styles.mediaThumb} />
              ) : (
                <video key={i} src={m.text} className={styles.mediaThumb} controls />
              ))}
            </div>
          )}
          {tab === 'links' && (
            <div className={styles.linksList}>
              {links.length === 0 && <div className={styles.emptyTab}>Нет ссылок</div>}
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
          {tab === 'voice' && (
            <div className={styles.voiceList}>
              {voices.length === 0 && <div className={styles.emptyTab}>Нет голосовых</div>}
              {voices.map((m, i) => (
                <audio key={i} src={m.text} controls className={styles.voiceAudio} />
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default ProfileSidebar; 