'use client';
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useChatList } from '@/hooks/useChatList';
import { useChatActions } from '@/hooks/useChatActions';
import { useUsers } from '@/hooks/useUsers';
import { formatDate } from '../../utils/dateUtils';
import styles from '@/styles/ChatList.module.css';
import { IoIosSearch, IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { FaMoon, FaSun, FaPen, FaUsers } from 'react-icons/fa';
import { MdDeleteOutline } from "react-icons/md";
import { HiOutlinePlus } from 'react-icons/hi';
import { Checkbox, Spin } from 'antd';
import multiavatar from '@multiavatar/multiavatar';
import UserAvatar from './UserAvatar';

export default function ChatList({ onSelectChat, onToggleTheme, isDarkMode }) {
  const [search, setSearch] = useState('');
  const [activeChatId, setActiveChatId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const contextMenuRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(450);
  const [contextMenu, setContextMenu] = useState(null);
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

  return (
    <div
      className={`${styles.chatListContainer} ${menuOpen ? styles.menuOpen : ''}`}
      style={{ width: sidebarWidth }}
    >
      <div id="resizer" className={styles.resizer} />
      <div className={styles.header}>
        <div className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
          <div className={styles.bar}></div>
          <div className={styles.bar}></div>
          <div className={styles.bar}></div>
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
      {menuOpen && (
        <div className={styles.menu}>
          <div className={styles.profileSection} onClick={() => router.push('/profile')}>
            <div className={styles.profileInfo}>
              <div className={styles.avatarMenu}>
                <UserAvatar user={user} />
              </div>
              <span className={styles.displayName}>{user?.displayName}</span>
            </div>
          </div>
          <div
            className={styles.menuItem}
            onClick={() => {
              setMenuOpen(false);
              setMode('new');
            }}
          >
            <FaPen /> Новое сообщение
          </div>
          <div
            className={styles.menuItem}
            onClick={() => {
              setMenuOpen(false);
              setMode('group');
            }}
          >
            <FaUsers /> Создать группу
          </div>
          <div className={styles.menuItem} onClick={onToggleTheme}>
            {isDarkMode ? <FaSun /> : <FaMoon />} {isDarkMode ? 'Светлый режим' : 'Темный режим'}
          </div>
          <div className={styles.menuItem} onClick={() => router.push('/login')}>
            <HiOutlinePlus className={styles.plusIcon} /> Добавить аккаунт
          </div>
        </div>
      )}
      {mode && (
        <div
          className={styles.backButton}
          onClick={() => {
            setMode(null);
            setSelectedUsers([]);
          }}
        >
          <IoIosArrowBack />
        </div>
      )}

      {mode ? (
        <div className={styles.userList}>
          {users.map((u) => {
            const isSelected = selectedUsers.some((s) => s.uid === u.uid);
            return (
              <div
                key={u.uid}
                onClick={() => (mode === 'new' ? startNewChat(u, () => setMode(null)) : toggleUser(u))}
                className={`${styles.chatItem} ${isSelected ? styles.selected : ''}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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
        <Spin size='large'/>
      ) : (
        <div className={styles.chatList}>
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
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
                      dangerouslySetInnerHTML={{
                        __html: multiavatar(chat.displayName),
                      }}
                    />
                  )}
                </div>
                <div className={styles.chatContent}>
                  <p className={styles.chatName}>{chat.displayName}</p>
                  <p className={styles.lastMessage}>
                  {chat.isGroup && chat.lastMessage?.senderName
                    ? `${chat.lastMessage.senderName}: `
                    : ''}
                  {chat.lastMessage?.text}
                </p>
                </div>
                <div className={styles.chatTime}>
                <div>{formatDate(chat.lastMessage?.timestamp)}</div>
                {chat.unreadCount > 0 && (
                  <div className={styles.unreadBadge}>{chat.unreadCount}</div>
                )}
                </div>
              </div>
            ))
          ) : (
            <p className={styles.loadingText}>Нет чатов</p>
          )}
        </div>
      )}
      {contextMenu && (
  <div
    className={`${styles.contextMenu} ${menuOpen ? styles.menuOpen : ''} ${contextMenu ? styles.open : ''}`}
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
    <MdDeleteOutline className={styles.deleteIcon}/>
     Удалить чат
    </button>
  </div>
)}
    </div>
  );
  
}