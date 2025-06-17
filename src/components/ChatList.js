"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useChatList } from '@/hooks/useChatList';
import { useChatActions } from '@/hooks/useChatActions';
import { useUsers } from '@/hooks/useUsers';
import { formatDate } from '../../utils/dateUtils';
import styles from '@/styles/ChatList.module.css';
import { IoIosSearch, IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { FaPen, FaUsers } from 'react-icons/fa';
import { FiLink } from 'react-icons/fi';
import { RiFileMusicLine } from "react-icons/ri";
import { MdDeleteOutline } from "react-icons/md";
import { HiOutlinePlus } from 'react-icons/hi';
import { Checkbox, Spin, Switch } from 'antd';
import multiavatar from '@multiavatar/multiavatar';
import UserAvatar from './UserAvatar';
import { useTheme } from '@/hooks/useTheme';
import { BsMoonStarsFill } from "react-icons/bs";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { IoCheckmark, IoCheckmarkDone, IoExitOutline } from "react-icons/io5";
import { useAuth } from '@/hooks/useAuth';

export default function ChatList({ onSelectChat }) {
  const [search, setSearch] = useState('');
  const [activeChatId, setActiveChatId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(450);
  const [contextMenu, setContextMenu] = useState(null);
  const contextMenuRef = useRef(null);
  const [chatData, setChatData] = useState({});
  const { isDark, toggleTheme } = useTheme();
  const menuRef = useRef(null);

  const user = useSelector((state) => state.user.user);
  const router = useRouter();

  const { chats, loading } = useChatList(user);
  const { users, loadUsers } = useUsers(user);
  const {
    selectedUsers,
    setSelectedUsers,
    startNewChat,
    createGroupChat,
    resetUnreadCount,
    toggleUser,
    handleDeleteChat
  } = useChatActions(user, onSelectChat);

  const { logout } = useAuth();

  useEffect(() => {
    if (!user || !chats.length) return;

    const unsubscribers = chats.map((chat) => {
      const messagesRef = collection(db, 'chats', chat.id, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'));

      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lastMessage = messages.find(
          msg => !msg.deletedFor || !msg.deletedFor.includes(user.uid)
        );

        let unreadCount = 0;
        messages.forEach((msg) => {
          const isUnread = msg.sender !== user.uid && !msg.read;
          if (isUnread) unreadCount += 1;
        });

        setChatData(prev => ({
          ...prev,
          [chat.id]: {
            lastMessage,
            unreadCount
          }
        }));
      });
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user, chats]);

  const filteredChats = chats.filter((chat) =>
    chat.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectChat = (chat) => {
    resetUnreadCount(chat.id);
    setActiveChatId(chat.id);
    onSelectChat(chat);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      const newWidth = e.clientX;
      if (newWidth >= 250 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    const handleMouseDown = () => {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
    const resizer = document.getElementById('resizer');
    if (resizer) resizer.addEventListener('mousedown', handleMouseDown);
    return () => {
      if (resizer) resizer.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    if (mode) loadUsers();
  }, [mode]);

  const handleContextMenu = (e, chat) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chatId: chat.id });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest(`.${styles.hamburger}`)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  function getMessagePreview(msg, isSelected) {
    if (!msg) return { text: '', thumb: null };
    if (msg.fileType === 'image' && msg.text) return {
      text: 'Фото',
      thumb: <img src={msg.text} alt="img" className={styles.miniThumb} />
    };
    if (msg.fileType === 'video' && msg.text) return {
      text: 'Видео',
      thumb: <video src={msg.text} className={styles.miniThumb} muted playsInline preload="metadata" />
    };
    if (msg.fileType === 'audio') return { text: 'Голос', thumb: <RiFileMusicLine className={isSelected ? styles.miniIconSelected : styles.miniIcon} /> };
    if (msg.text && /(@?https?:\/\/[^\s]+|@?https?:\/[^\n\s]+|@?www\.[^\s]+|@?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}[^\s]*)/.test(msg.text)) {
      const linkRegex = /(@?https?:\/\/[^\s]+|@?https?:\/[^\n\s]+|@?www\.[^\s]+|@?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}[^\s]*)/g;
      const parts = msg.text.split(linkRegex);
      return {
        text: parts.map((part, idx) => {
          if (linkRegex.test(part)) {
            linkRegex.lastIndex = 0;
            return (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                <FiLink style={{ marginRight: 2 }} />
                {part}
              </span>
            );
          }
          return part;
        }),
        thumb: null
      };
    }
    return { text: msg.text || '', thumb: null };
  }

  return (
    <div
      className={`${styles.chatListContainer} ${menuOpen ? styles.menuOpen : ''}`}
      style={{ width: sidebarWidth }}
    >
      <div id="resizer" className={styles.resizer} />

      <div className={`${styles.header} ${mode ? styles.modeActive : ''}`}>
        <div className={styles.headerLeft}>
          <div
            className={styles.hamburger}
            onClick={!mode ? () => setMenuOpen(prevState => !prevState) : undefined}
            style={{ pointerEvents: !mode ? 'auto' : 'none' }}
          >
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
          </div>
          <div
            className={styles.backButton}
            onClick={mode ? () => { setMode(null); setSelectedUsers([]); } : undefined}
            style={{ pointerEvents: mode ? 'auto' : 'none' }}
          >
            <IoIosArrowBack />
          </div>
        </div>

        <div className={styles.searchWrapper}>
          <IoIosSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск"
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.menu} ref={menuRef}>
        <div className={styles.profileSection} onClick={() => router.push('/profile')}>
          <div className={styles.profileInfo}>
            <div className={styles.avatarMenu}>
              <UserAvatar user={user} />
            </div>
            <span className={styles.displayName}>{user?.displayName}</span>
          </div>
        </div>

        <div className={styles.borderBottom}/>

        <div className={styles.menuItem} onClick={() => { setMenuOpen(false); setMode('new'); }}>
          <FaPen /> Новое сообщение
        </div>

        <div className={styles.menuItem} onClick={() => { setMenuOpen(false); setMode('group'); }}>
          <FaUsers /> Создать группу
        </div>

        <div className={styles.menuItem} onClick={() => router.push('/login')}>
          <HiOutlinePlus className={styles.plusIcon} /> Добавить аккаунт
        </div>

        <div className={styles.menuItem}>
          <BsMoonStarsFill className={styles.icon} />
          <span className={styles.label}>Ночная тема</span>
        <Switch
          checked={isDark}
          onChange={toggleTheme}
          className={styles.themeSwitch}
          size="small"
          />
          </div>
        <div className={styles.menuItem} onClick={async () => { await logout(); router.push('/login'); }}>
        <IoExitOutline className={styles.exitIcon} style={{ color: '#e53935' }}/> <span style={{ color: '#e53935' }}>Выйти</span>
        </div>
      </div>

      {mode ? (
        <div className={styles.userList}>
          {users.map((u) => {
            const isSelected = selectedUsers.some((s) => s.uid === u.uid);
            return (
              <div
                key={u.uid}
                onClick={() =>
                  mode === 'new' ? startNewChat(u, () => setMode(null)) : toggleUser(u)
                }
                className={`${styles.chatItem} ${isSelected ? styles.selected : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div className={styles.avatar}>
                    {u.photoURL ? (
                      <img src={u.photoURL} alt="avatar" className={styles.avatar} />
                    ) : (
                      <div
                        className={styles.avatar}
                        dangerouslySetInnerHTML={{ __html: multiavatar(u.displayName) }}
                      />
                    )}
                  </div>
                  <p className={styles.chatName}>{u.displayName || u.email}</p>
                </div>
                {mode === 'group' && (
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleUser(u)}
                    onClick={(e) => e.stopPropagation()}
                    className={styles.checkbox}
                  />
                )}
              </div>
            );
          })}

          {mode === 'group' && (
            <button
              className={styles.continueButton}
              onClick={async () => {
                const groupName = prompt('Введите название группы:');
                if (!groupName) return;
                try {
                  const success = await createGroupChat(selectedUsers, groupName);
                  if (success) {
                    setMode(null);
                    setSelectedUsers([]);
                  }
                } catch (error) {
                  console.error('Ошибка:', error);
                  alert('Не удалось создать группу');
                }
              }}
              disabled={selectedUsers.length < 2}
            >
              <IoIosArrowForward />
            </button>
          )}
        </div>
      ) : loading ? (
        <Spin size='large' />
      ) : (
        <div className={styles.chatList}>
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const data = chatData[chat.id] || {};
              const lastMessage = data.lastMessage || chat.lastMessage;
              const unreadCount = data.unreadCount ?? chat.unreadCount;
              const isSelected = chat.id === activeChatId;
              const preview = getMessagePreview(lastMessage, isSelected);
              return (
                <div
                  key={chat.id}
                  className={`${styles.chatItem} ${chat.id === activeChatId ? styles.selected : ''}`}
                  onClick={() => handleSelectChat(chat)}
                  onContextMenu={(e) => handleContextMenu(e, chat)}
                >
                  <div>
                    {chat.photoURL ? (
                      <img src={chat.photoURL} alt="avatar" className={styles.avatar} />
                    ) : (
                      <div
                        className={styles.avatar}
                        dangerouslySetInnerHTML={{ __html: multiavatar(chat.displayName) }}
                      />
                    )}
                  </div>
                  <div className={styles.chatContent}>
                    <p className={styles.chatName}>{chat.displayName}</p>
                    <div className={styles.lastMessageContainer}>
                      <p className={styles.lastMessage}>
                        {preview.thumb && <span className={styles.lastMessageThumb}>{preview.thumb}</span>}
                        {chat.isGroup && lastMessage?.senderName ? `${lastMessage.senderName}: ` : ''}
                        <span>{preview.text}</span>
                      </p>
                    </div>
                  </div>
                  <div className={styles.chatTime}>
                    {user && lastMessage?.sender === user.uid && (
                      <span className={styles.readStatus}>
                        {lastMessage?.read ? <IoCheckmarkDone /> : <IoCheckmark />}
                      </span>
                    )}
                    <div className={styles.timeContainer}>
                      <div>{formatDate(lastMessage?.timestamp)}</div>
                      {unreadCount > 0 && (
                        <div className={styles.unreadBadge}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className={styles.loadingText}>Нет чатов</p>
          )}
        </div>
      )}

      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          ref={contextMenuRef}
        >
          <button
            className={styles.contextMenuItem}
            onClick={() => {
              handleDeleteChat(contextMenu.chatId);
              setContextMenu(null);
            }}
          >
            <MdDeleteOutline className={styles.deleteIcon} /> Удалить чат
          </button>
        </div>
      )}
    </div>
  );
}