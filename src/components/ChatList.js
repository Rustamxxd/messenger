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
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { IoCheckmark, IoCheckmarkDone, IoExitOutline } from "react-icons/io5";
import { useAuth } from '@/hooks/useAuth';
import { LuInfo } from "react-icons/lu";
import CreateGroupSidebar from './CreateGroupSidebar';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingChat, setPendingChat] = useState(null);
  const [deleteModalClosing, setDeleteModalClosing] = useState(false);
  const [leaveModalClosing, setLeaveModalClosing] = useState(false);
  const [afterDeleteAction, setAfterDeleteAction] = useState(null);
  const [afterLeaveAction, setAfterLeaveAction] = useState(null);
  const [deleteModalOpening, setDeleteModalOpening] = useState(false);
  const [leaveModalOpening, setLeaveModalOpening] = useState(false);
  const [contextMenuOpening, setContextMenuOpening] = useState(false);
  const [contextMenuClosing, setContextMenuClosing] = useState(false);
  const chatListRef = useRef(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showCreateGroupSidebar, setShowCreateGroupSidebar] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [groupAvatarPreview, setGroupAvatarPreview] = useState(null);
  const [groupDescription, setGroupDescription] = useState('');

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
    handleDeleteChat,
    handleDeleteChatForAll,
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
    const chatListRect = chatListRef.current.getBoundingClientRect();
    const menuWidth = 200; // ширина меню (px), если изменится — поменяйте тут
    let x = e.clientX;
    let y = e.clientY;
    // Если не помещается справа — показываем слева
    if (x + menuWidth > chatListRect.right) {
      x = x - menuWidth;
      if (x < chatListRect.left) x = chatListRect.left;
    }
    setContextMenu({ x, y, chatId: chat.id });
    setPendingChat(chat);
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

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (menuOpen) {
          setMenuOpen(false);
        } else if (mode === 'new' || mode === 'group') {
          setMode(null);
          setSelectedUsers([]);
        }
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [menuOpen, mode, setSelectedUsers]);

  // ESC для contextMenu
  useEffect(() => {
    if (!contextMenu) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        handleCloseContextMenu();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [contextMenu]);

  // ESC для модалок
  useEffect(() => {
    if (!showDeleteModal) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        handleCloseDeleteModal();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showDeleteModal]);

  useEffect(() => {
    if (!showLeaveModal) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        handleCloseLeaveModal();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showLeaveModal]);

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

  const handleDeleteForAll = async () => {
    if (!pendingChat) return;
    setAfterDeleteAction(() => async () => {
      await handleDeleteChatForAll(pendingChat.id);
      setContextMenu(null);
      setPendingChat(null);
      setActiveChatId(null);
      onSelectChat && onSelectChat(null);
    });
    setDeleteModalClosing(true);
  };

  // Удаляет undefined из объекта/массива рекурсивно
  function removeUndefined(obj) {
    if (Array.isArray(obj)) {
      return obj.map(removeUndefined);
    } else if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, removeUndefined(v)])
      );
    }
    return obj;
  }

  const handleLeaveGroup = async () => {
    console.log('handleLeaveGroup called');
    if (!pendingChat) {
      console.log('pendingChat is null');
      return;
    }
    // Определяем владельца
    const members = pendingChat.members || [];
    const owner = Array.isArray(members)
      ? members.find(m => (typeof m === 'object' ? m.role === 'owner' : false))
      : null;
    const isOwner = owner && (owner.id === user.uid);
    if (isOwner) {
      // Если владелец один в группе — удаляем чат
      if (members.length === 1) {
        setAfterLeaveAction(() => async () => {
          await handleDeleteChatForAll(pendingChat.id);
          setContextMenu(null);
          setPendingChat(null);
          setActiveChatId(null);
          onSelectChat && onSelectChat(null);
        });
        setLeaveModalClosing(true);
        return;
      } else {
        // Владелец не может покинуть группу, если есть другие участники
        setShowSnackbar(true);
        setSnackbarMessage('Сначала передайте права владельца');
        setTimeout(() => setShowSnackbar(false), 3000);
        return;
      }
    }
    // Обычный выход для не-владельца
    setAfterLeaveAction(() => async () => {
      const chatRef = doc(db, 'chats', pendingChat.id);
      const updatedMembers = pendingChat.members.filter(m => {
        if (typeof m === 'object') {
          return m.id !== user.uid;
        }
        return m !== user.uid;
      });
      const cleanedMembers = updatedMembers.map(removeUndefined);
      console.log('pendingChat:', pendingChat);
      console.log('updatedMembers:', updatedMembers);
      try {
        await updateDoc(chatRef, { members: cleanedMembers });
        console.log('updateDoc success');
      } catch (err) {
        console.error('updateDoc error:', err);
      }
      setContextMenu(null);
      setPendingChat(null);
      setActiveChatId(null);
      onSelectChat && onSelectChat(null);
    });
    setLeaveModalClosing(true);
  };

  // Функция для плавного закрытия модалки удаления
  const handleCloseDeleteModal = () => {
    setDeleteModalClosing(true);
  };
  // Функция для плавного закрытия модалки выхода
  const handleCloseLeaveModal = () => {
    setLeaveModalClosing(true);
  };

  // Обработчик завершения анимации overlay для удаления модалки
  const handleDeleteModalTransitionEnd = async (e) => {
    if (deleteModalClosing && e.propertyName === 'opacity') {
      setShowDeleteModal(false);
      setDeleteModalClosing(false);
      if (afterDeleteAction) {
        await afterDeleteAction();
        setAfterDeleteAction(null);
      }
    }
  };
  const handleLeaveModalTransitionEnd = async (e) => {
    console.log('handleLeaveModalTransitionEnd', leaveModalClosing, e.propertyName);
    if (leaveModalClosing && e.propertyName === 'opacity') {
      setShowLeaveModal(false);
      setLeaveModalClosing(false);
      if (afterLeaveAction) {
        await afterLeaveAction();
        setAfterLeaveAction(null);
      }
    }
  };

  useEffect(() => {
    if (showDeleteModal) {
      setDeleteModalOpening(false);
      setTimeout(() => setDeleteModalOpening(true), 0);
    } else {
      setDeleteModalOpening(false);
    }
  }, [showDeleteModal]);

  useEffect(() => {
    if (showLeaveModal) {
      setLeaveModalOpening(false);
      setTimeout(() => setLeaveModalOpening(true), 0);
    } else {
      setLeaveModalOpening(false);
    }
  }, [showLeaveModal]);

  // Плавное появление contextMenu
  useEffect(() => {
    if (contextMenu) {
      setContextMenuClosing(false);
      setContextMenuOpening(false);
      setTimeout(() => setContextMenuOpening(true), 0);
    } else {
      setContextMenuOpening(false);
      setContextMenuClosing(false);
    }
  }, [contextMenu]);

  // Плавное закрытие contextMenu
  const handleCloseContextMenu = () => {
    setContextMenuClosing(true);
  };
  const handleContextMenuTransitionEnd = (e) => {
    if (contextMenuClosing && e.propertyName === 'opacity') {
      setContextMenu(null);
      setContextMenuClosing(false);
    }
  };

  useEffect(() => {
    if (activeChatId && !chats.find(chat => chat.id === activeChatId)) {
      setActiveChatId(null);
      onSelectChat && onSelectChat(null);
    }
  }, [chats, activeChatId]);

  return (
    <div
      ref={chatListRef}
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
            id='search'
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

      {mode === 'group' && showCreateGroupSidebar && (
        <CreateGroupSidebar
          users={selectedUsers}
          groupName={groupName}
          setGroupName={setGroupName}
          groupAvatar={groupAvatar}
          setGroupAvatar={setGroupAvatar}
          groupAvatarPreview={groupAvatarPreview}
          setGroupAvatarPreview={setGroupAvatarPreview}
          groupDescription={groupDescription}
          setGroupDescription={setGroupDescription}
          onClose={() => setShowCreateGroupSidebar(false)}
          onCreate={async (desc) => {
            if (selectedUsers.length < 2) return;
            const result = await createGroupChat(selectedUsers, groupName, groupAvatar, desc);
            if (result) {
              setShowCreateGroupSidebar(false);
              setMode(null);
              setSelectedUsers([]);
              setGroupName('');
              setGroupAvatar(null);
              setGroupAvatarPreview(null);
              setGroupDescription('');
            }
          }}
        />
      )}

      {mode ? (
        <div className={styles.userList}>
          {users.map((u) => {
            const isSelected = selectedUsers.some((s) => s.uid === u.uid);
            return (
              <div
                key={u.uid}
                onClick={e => {
                  // Ripple effect
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
                  // Обычный клик
                  mode === 'new' ? startNewChat(u, () => setMode(null)) : toggleUser(u);
                }}
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
        </div>
      ) : loading ? (
        <Spin className={styles.loadingText} />
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
                  onClick={e => {
                    // Ripple effect
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
                    // Обычный клик
                    handleSelectChat(chat);
                  }}
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
                      <div>
                        {formatDate(lastMessage?.timestamp)}
                        {user && lastMessage?.sender === user.uid && (!lastMessage?.timestamp || lastMessage?.id?.startsWith('temp-')) && (
                          <span className={styles.sendingSpinner} title="Отправляется..." />
                        )}
                      </div>
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

      {mode === 'group' && !showCreateGroupSidebar && (
        <button
          className={styles.continueButton}
          onClick={() => {
            if (selectedUsers.length < 2) {
              setShowSnackbar(true);
              setSnackbarMessage('Выберите хотя бы 2 пользователей');
              setTimeout(() => setShowSnackbar(false), 3000);
              return;
            }
            setShowCreateGroupSidebar(true);
          }}
          disabled={selectedUsers.length < 1}
        >
          <IoIosArrowForward />
        </button>
      )}

      {contextMenu && (
        <div
          className={
            styles.contextMenu + ' ' +
            (contextMenuClosing
              ? styles.modalClosed
              : contextMenuOpening
                ? styles.modalOpen
                : styles.modalClosed)
          }
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          ref={contextMenuRef}
          onTransitionEnd={handleContextMenuTransitionEnd}
        >
          {(() => {
            const chat = chats.find(c => c.id === contextMenu.chatId);
            if (chat?.isGroup) {
              // Определяем владельца
              const owner = Array.isArray(chat.members)
                ? chat.members.find(m => (typeof m === 'object' ? m.role === 'owner' : false))
                : null;
              const isOwner = owner && (owner.id === user.uid);
              if (isOwner) {
                return (
                  <button
                    className={styles.contextMenuItem}
                    onClick={() => { setPendingChat(chat); setShowDeleteModal(true); handleCloseContextMenu(); }}
                  >
                    <MdDeleteOutline className={styles.deleteIcon} /> Удалить чат
                  </button>
                );
              } else {
                return (
                  <button
                    className={styles.contextMenuItem}
                    onClick={() => { setPendingChat(chat); setShowLeaveModal(true); handleCloseContextMenu(); }}
                  >
                    <MdDeleteOutline className={styles.deleteIcon} /> Покинуть группу
                  </button>
                );
              }
            } else {
              return (
                <button
                  className={styles.contextMenuItem}
                  onClick={() => {
                    handleDeleteChat(contextMenu.chatId);
                    handleCloseContextMenu();
                  }}
                >
                  <MdDeleteOutline className={styles.deleteIcon} /> Удалить чат
                </button>
              );
            }
          })()}
        </div>
      )}

      {showDeleteModal && (
        <div
          className={
            styles.customModalOverlay + ' ' +
            (deleteModalClosing
              ? styles.modalClosed
              : deleteModalOpening
                ? styles.modalOpen
                : styles.modalClosed)
          }
        >
          <div
            className={styles.customModal}
            onTransitionEnd={handleDeleteModalTransitionEnd}
          >
            <div className={styles.modalHeader}>
            <div className={styles.modalHeaderRow}>
              {pendingChat?.photoURL ? (
                <img src={pendingChat.photoURL} alt="avatar" className={styles.modalAvatarImg2} />
              ) : (
                <div className={styles.modalAvatarBig}>
                  {(pendingChat?.displayName || pendingChat?.name || 'G')[0].toUpperCase()}
                </div>
              )}
                <p className={styles.modalTitle2}>Покинуть группу</p>
              </div>
              <div className={styles.modalDesc2}>
                Вы точно хотите покинуть <b>{pendingChat?.displayName || pendingChat?.name || 'группу'}</b>?
              </div>
              </div>
              <div className={styles.modalBtnRow}>
                <button className={styles.modalBtn2 + ' ' + styles.modalBtnDanger2} onClick={handleDeleteForAll}>УДАЛИТЬ У ВСЕХ УЧАСТНИКОВ</button>
                <button className={styles.modalBtn2 + ' ' + styles.modalBtnDanger2} onClick={handleLeaveGroup}>ПОКИНУТЬ ГРУППУ</button>
                <button className={styles.modalBtn2 + ' ' + styles.modalBtnCancel2} onClick={handleCloseDeleteModal}>ОТМЕНА</button>
              </div>
            </div>
        </div>
      )}

      {showLeaveModal && (
        <div
          className={
            styles.customModalOverlay + ' ' +
            (leaveModalClosing
              ? styles.modalClosed
              : leaveModalOpening
                ? styles.modalOpen
                : styles.modalClosed)
          }
        >
          <div
            className={styles.customModal}
            onTransitionEnd={handleLeaveModalTransitionEnd}
          >
            <div className={styles.modalHeader}>
            <div className={styles.modalHeaderRow}>
              {pendingChat?.photoURL ? (
                <img src={pendingChat.photoURL} alt="avatar" className={styles.modalAvatarImg2} />
              ) : (
                <div className={styles.modalAvatarBig}>
                  {(pendingChat?.displayName || pendingChat?.name || 'G')[0].toUpperCase()}
                </div>
              )}
                <p className={styles.modalTitle2}>Покинуть группу</p>
              </div>
              <div className={styles.modalDesc2}>
                Вы точно хотите покинуть <b>{pendingChat?.displayName || pendingChat?.name || 'группу'}</b>?
              </div>
              </div>
              <div className={styles.modalBtnRow}>
                  <button className={styles.modalBtn2 + ' ' + styles.modalBtnDanger2} onClick={handleLeaveGroup}>ПОКИНУТЬ ГРУППУ</button>
                  <button className={styles.modalBtn2 + ' ' + styles.modalBtnCancel2} onClick={handleCloseLeaveModal}>ОТМЕНА</button>
                </div>
              </div>
            </div>
      )}

      {showSnackbar && (
        <div className={styles.snackbar}>
          <span className={styles.snackbarIcon}><LuInfo /></span>
          {snackbarMessage}
        </div>
      )}
    </div>
  );
}