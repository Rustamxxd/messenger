import React, { useState, useEffect, useRef } from 'react';
import styles from '@/styles/GroupSidebar.module.css';
import { useRouter } from 'next/navigation';
import { MdNotificationsNone, MdOutlineModeEdit, MdLink } from 'react-icons/md';
import { Switch } from 'antd';
import MediaViewer from './MediaViewer';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import { LuInfo } from "react-icons/lu";
import LoadingDots from './LoadingDots';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import EditGroupSidebar from './EditGroupSidebar';

function extractLinks(text) {
  if (!text) return [];
  const urlRegex = /(@?https?:\/\/[^\s]+|@?https?:\/[^\s]+|@?www\.[^\s]+|@?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}[^\s]*)/g;
  return text.match(urlRegex) || [];
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

const GroupSidebar = ({ open, onClose, group, currentUserId, allMessages = [], typingUsers = [] }) => {
  const [tab, setTab] = useState('members');
  const [tabTransition, setTabTransition] = useState(false);
  const [swapDirection, setSwapDirection] = useState('right');
  const [contentVisible, setContentVisible] = useState(true);
  const prevTab = useRef(tab);
  const [modalMedia, setModalMedia] = useState(null);
  const sidebarContentRef = useRef(null);
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [videoDurations, setVideoDurations] = useState({});
  const [membersWithLastSeen, setMembersWithLastSeen] = useState([]);
  const [editSidebarOpen, setEditSidebarOpen] = useState(false);
  const [liveGroup, setLiveGroup] = useState(group);
  const defaultGroupAvatar = "/assets/default-group.png";

  const handleLoadedMetadata = (i, e) => {
    setVideoDurations(prev => ({ ...prev, [i]: e.target.duration }));
  };

  function formatDuration(seconds) {
    if (!seconds) return null;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function formatDate(date) {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'вчера';
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  }

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    setTab('members');
  }, [group?.id]);

  useEffect(() => {
    if (prevTab.current !== tab) {
      const tabOrder = ['members', 'media', 'links', 'voice'];
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

  useEffect(() => {
    if (sidebarContentRef.current) {
      sidebarContentRef.current.scrollTop = 0;
    }
  }, [tab, group?.id]);

  useEffect(() => {
    if (!group?.id) return;
    const groupRef = doc(db, 'chats', group.id);
    const unsubscribe = onSnapshot(groupRef, (docSnap) => {
      if (docSnap.exists()) {
        setLiveGroup({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return () => unsubscribe();
  }, [group?.id]);

  useEffect(() => {
    async function fetchMembersWithLastSeen() {
      if (!liveGroup?.members || liveGroup.members.length === 0) {
        setMembersWithLastSeen([]);
        return;
      }
      const members = await Promise.all(
        liveGroup.members.map(async (m) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', m.id));
            const userData = userDoc.exists() ? userDoc.data() : {};
            return {
              ...m,
              displayName: userData.displayName || m.displayName,
              photoURL: userData.photoURL || m.photoURL || null,
              lastSeen: userData.lastSeen || null,
            };
          } catch {
            return { ...m, lastSeen: null };
          }
        })
      );
      setMembersWithLastSeen(members);
    }
    fetchMembersWithLastSeen();
  }, [liveGroup?.members]);

  if (!liveGroup) return null;
  const isOwner = liveGroup.ownerId === currentUserId;

  const allMedia = allMessages.filter(m => 
    (m.fileType === 'image' || m.fileType === 'video') && 
    !m.deleted && 
    m.text && 
    !(m.hiddenFor && m.hiddenFor.includes(currentUserId))
  );
  
  const allLinks = allMessages.filter(m => {
    const hasLinks = m.text && extractLinks(m.text).length > 0;
    const isTextMessage = !m.fileType || m.fileType === 'text';
    const notDeleted = !m.deleted;
    const notHidden = !(m.hiddenFor && m.hiddenFor.includes(currentUserId));
    
    return hasLinks && isTextMessage && notDeleted && notHidden;
  });
  
  const voices = allMessages.filter(m => 
    m.fileType === 'audio' && 
    !m.deleted && 
    m.text && 
    !(m.hiddenFor && m.hiddenFor.includes(currentUserId))
  );

  return (
    <>
      <div className={styles.overlay + (open ? ' ' + styles.open : '')} onClick={onClose} />
      <aside className={styles.sidebar + (open ? ' ' + styles.open : '')}>
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
          <span className={styles.headerTitle}>Информация</span>
          {isOwner && (
            <button className={styles.editGroup} onClick={() => setEditSidebarOpen(true)}>
              <MdOutlineModeEdit />
            </button>
          )}
          
        </div>
        
        <div 
          className={styles.sidebarContent}
          ref={sidebarContentRef}
        >
          <div className={styles.avatarWrapper}>
            <img src={liveGroup.photoURL || defaultGroupAvatar} alt="avatar" className={styles.avatar} />
            <div className={styles.profileInfo}>
              <div
                className={styles.displayName}
                onClick={() => {
                  if (liveGroup.name) {
                    navigator.clipboard.writeText(liveGroup.name);
                    setShowSnackbar(true);
                    setTimeout(() => setShowSnackbar(false), 3000);
                  }
                }}
                
              >
                {liveGroup.name || 'Группа'}
              </div>
              <div className={styles.memberCount}>
                {liveGroup.members?.length || 0} участник{liveGroup.members?.length === 1 ? '' : liveGroup.members?.length < 5 && liveGroup.members?.length > 1 ? 'а' : 'ов'}
              </div>
            </div>
          </div>
          
          <div className={styles.section}>
            <div
              className={styles.menuItem}
              style={{ position: 'relative', cursor: 'pointer' }}
              title="Скопировать описание группы"
              onClick={e => {
                if (liveGroup?.description) {
                  navigator.clipboard.writeText(liveGroup.description);
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
              <span className={styles.menuIcon}><LuInfo /></span>
              <div className={styles.menuTextBlock}>
                <span className={styles.menuMainText}>{liveGroup.description || '—'}</span>
                <span className={styles.menuSubText}>Информация</span>
              </div>
            </div>
            {liveGroup.link && (
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
                <span className={styles.menuIcon}><MdLink /></span>
                <div className={styles.menuTextBlock}>
                  <a href={liveGroup.link} target="_blank" rel="noopener noreferrer" className={styles.menuMainText}>{liveGroup.link}</a>
                  <span className={styles.menuSubText}>Ссылка</span>
                </div>
              </div>
            )}
            <div className={styles.menuItem}>
              <span className={styles.menuIcon}><MdNotificationsNone /></span>
              <span className={styles.menuMainText} style={{color:'#222'}}>Уведомления</span>
              <Switch checked={notifications} onChange={setNotifications} style={{marginLeft:'auto'}} size="large"/>
            </div>
            
            <div className={styles.tabs}>
              <button className={tab === 'members' ? styles.activeTab : ''} onClick={() => setTab('members')}>Участники</button>
              <button className={tab === 'media' ? styles.activeTab : ''} onClick={() => setTab('media')}>Медиа</button>
              <button className={tab === 'links' ? styles.activeTab : ''} onClick={() => setTab('links')}>Ссылки</button>
              <button className={tab === 'voice' ? styles.activeTab : ''} onClick={() => setTab('voice')}>Голос</button>
            </div>
          </div>

          <div className={styles.tabContentWrapper + (tabTransition ? ' ' + styles.tabContentTransition + ' ' + styles['swap' + swapDirection.charAt(0).toUpperCase() + swapDirection.slice(1)] : '')} key={tab}>
            {contentVisible && (
              <>
                {tab === 'members' && (
                  <>
                    {membersWithLastSeen.length > 0 && (
                      <div className={styles.membersSection}>
                        {membersWithLastSeen
                          .sort((a, b) => {
                            // Текущий пользователь всегда первый
                            if (a.id === currentUserId) return -1;
                            if (b.id === currentUserId) return 1;
                            
                            // Проверяем, кто в сети
                            const aLastSeen = a.lastSeen?.toDate ? a.lastSeen.toDate() : new Date(a.lastSeen);
                            const bLastSeen = b.lastSeen?.toDate ? b.lastSeen.toDate() : new Date(b.lastSeen);
                            const now = new Date();
                            const aIsOnline = Math.floor((now - aLastSeen) / (1000 * 60)) < 1;
                            const bIsOnline = Math.floor((now - bLastSeen) / (1000 * 60)) < 1;
                            
                            // Если один онлайн, а другой нет - онлайн идет первым
                            if (aIsOnline && !bIsOnline) return -1;
                            if (!aIsOnline && bIsOnline) return 1;
                            
                            // Если оба онлайн или оба оффлайн - сортируем по алфавиту
                            return a.displayName.localeCompare(b.displayName);
                          })
                          .map((member) => {
                          let status = '';
                          let statusClass = styles.memberStatus;
                          const isTyping = typingUsers.includes(member.displayName);
                          if (isTyping) {
                            status = 'печатает';
                            statusClass += ' ' + styles.typingStatus;
                          } else if (member?.lastSeen) {
                            const lastSeen = member.lastSeen?.toDate?.() || member.lastSeen;
                            const now = new Date();
                            const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));
                            if (diffMinutes < 1) {
                              status = 'в сети';
                              statusClass += ' ' + styles.online;
                            } else {
                              status = 'был(а) недавно';
                            }
                          }
                          return (
                            <div key={member.id} className={styles.memberItem}>
                              <img src={member.photoURL || defaultGroupAvatar} alt="avatar" className={styles.memberAvatar} />
                              <div className={styles.memberTextBlock}>
                                <span className={styles.memberName}>{member.displayName}</span>
                                {status && (
                                  <span className={statusClass}>
                                    {status}
                                    {isTyping && <LoadingDots />}
                                  </span>
                                )}
                              </div>
                              <div style={{ marginLeft: 'auto' }}>
                                <span className={styles.memberRole}>
                                  {member.role === 'owner' ? 'Владелец' : 
                                   member.role === 'admin' ? 'Админ' : 'Участник'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {(!membersWithLastSeen || membersWithLastSeen.length === 0) && (
                      <div className={styles.emptyTab}>Нет участников</div>
                    )}
                  </>
                )}
                
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
                    {[...allLinks].reverse().map((m, i) => {
                      const links = extractLinks(m.text);
                      return links.map((url, j) => {
                        const domain = getDomain(url);
                        const firstLetter = domain.charAt(0).toUpperCase();
                        return (
                          <div key={`${i}-${j}`} className={styles.linkMenuItem}>
                            <div className={styles.linkAvatarLarge}>
                              <span>{firstLetter}</span>
                            </div>
                            <div className={styles.menuTextBlock}>
                              <span className={styles.menuMainText}>{domain}</span>
                              <a href={url} target="_blank" rel="noopener noreferrer" className={styles.linkUrl}>
                                {url}
                              </a>
                            </div>
                          </div>
                        );
                      });
                    })}
                  </div>
                )}
                {tab === 'links' && allLinks.length === 0 && (
                  <div className={styles.emptyTab}>Нет ссылок</div>
                )}
                
                {tab === 'voice' && voices.length > 0 && (
                  <div className={styles.voiceSection}>
                    {[...voices].reverse().map((m, i) => {
                      const isMe = m.sender === currentUserId;
                      const senderName = isMe ? 'Вы' : (liveGroup.members?.find(u => u.id === m.sender)?.displayName || 'Участник');
                      const messageDate = m.timestamp?.toDate ? m.timestamp.toDate() : new Date();

                      return (
                        <div key={m.id || i} className={styles.voiceMenuItem}>
                          <div className={styles.voiceTextBlock}>
                            <div className={styles.voiceSender}>{senderName}</div>
                            <VoiceMessagePlayer src={m.text} isOwn={isMe} />
                          </div>
                          <div className={styles.voiceDate}>{formatDate(messageDate)}</div>
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
          Скопировано в буфер обмена!
        </div>
      )}
      {editSidebarOpen && (
        <EditGroupSidebar
          group={liveGroup}
          onClose={() => setEditSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default GroupSidebar; 