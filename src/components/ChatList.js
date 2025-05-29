'use client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, addDoc, serverTimestamp, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from '@/styles/ChatList.module.css';
import { IoIosSearch, IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { FaMoon, FaSun, FaPen, FaUsers } from 'react-icons/fa';
import { HiOutlinePlus } from 'react-icons/hi';
import { Checkbox } from 'antd';
import multiavatar from '@multiavatar/multiavatar';
import UserAvatar from './UserAvatar';

export default function ChatList({ onSelectChat, onToggleTheme, isDarkMode }) {
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const user = useSelector((state) => state.user.user);
  const router = useRouter();

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const messageDate = new Date(timestamp.seconds * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isToday = messageDate.toDateString() === today.toDateString();
    const isYesterday = messageDate.toDateString() === yesterday.toDateString();
    if (isToday) {
      return `${messageDate.getHours().toString().padStart(2, '0')}:${messageDate.getMinutes().toString().padStart(2, '0')}`;
    } else if (isYesterday) {
      return 'вчера';
    } else {
      return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(messageDate);
    }
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
    const unsubscribe = onSnapshot(collection(db, 'chats'), async (snapshot) => {
      const allChats = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const userChats = allChats.filter((chat) => chat.members?.includes(user.uid));

      const userDocs = await getDocs(collection(db, 'users'));
      const userMap = {};
      userDocs.forEach((doc) => {
        userMap[doc.id] = { uid: doc.id, ...doc.data() };
      });

      const enrichedChats = await Promise.all(
        getUniqueChats(userChats).map(async (chat) => {
          const isGroup = chat.members.length > 2;
          let displayName, photoURL;

          if (isGroup) {
            displayName = chat.name;
            photoURL = null;
          } else {
            const otherUid = chat.members.find((uid) => uid !== user.uid);
            const otherUser = userMap[otherUid];
            displayName = otherUser?.displayName || otherUser?.email;
            photoURL = otherUser?.photoURL || null;
          }

          let lastMessage = null;
          let unreadCount = 0;

          const messagesRef = collection(db, 'chats', chat.id, 'messages');
          const messagesSnapshot = await getDocs(messagesRef);

          const messages = messagesSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => a.createdAt - b.createdAt);

          if (messages.length > 0) {
            lastMessage = messages[messages.length - 1];
            unreadCount = messages.filter(
              (msg) =>
                msg.read === false &&
                msg.senderId !== user.uid
            ).length;
          }

          return {
            ...chat,
            displayName,
            photoURL,
            lastMessage,
            unreadCount,
          };
        })
      );

      setChats(enrichedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredChats = chats.filter((chat) =>
    chat.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const loadUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const currentUserUid = user.uid;

    const filteredUsers = snapshot.docs
      .map((doc) => ({ uid: doc.id, ...doc.data() }))
      .filter((u) => u.uid !== currentUserUid);

    setUsers(filteredUsers);
  };

  const startNewChat = async (targetUser) => {
    if (!user || !targetUser) return;

    const existingChat = chats.find(
      (chat) =>
        chat.members?.length === 2 &&
        chat.members.includes(user.uid) &&
        chat.members.includes(targetUser.uid)
    );
    if (existingChat) {
      onSelectChat(existingChat);
      setMode(null);
      return;
    }

    const docRef = await addDoc(collection(db, 'chats'), {
      name: `${user.displayName || user.email} & ${targetUser.displayName || targetUser.email}`,
      members: [user.uid, targetUser.uid],
      createdAt: serverTimestamp(),
    });

    onSelectChat({ id: docRef.id });
    setMode(null);
  };

  const createGroupChat = async () => {
    if (selectedUsers.length < 2) return alert('Выберите хотя бы двух пользователей');
    const groupName = prompt('Введите название группы:');
    if (!groupName) return;

    const memberIds = [user.uid, ...selectedUsers.map((u) => u.uid)];
    const docRef = await addDoc(collection(db, 'chats'), {
      name: groupName,
      members: memberIds,
      createdAt: serverTimestamp(),
    });

    onSelectChat({ id: docRef.id });
    setMode(null);
    setSelectedUsers([]);
  };

  const toggleUser = (userToAdd) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.uid === userToAdd.uid)
        ? prev.filter((u) => u.uid !== userToAdd.uid)
        : [...prev, userToAdd]
    );
  };

  useEffect(() => {
    if (mode) loadUsers();
  }, [mode]);

  const resetUnreadCount = async (chatId) => {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`unreadCount_${user.uid}`]: 0,
    });
  };

  const handleSelectChat = (chat) => {
    resetUnreadCount(chat.id);
    onSelectChat(chat);
  };

  const getUniqueChats = (chats) => {
    const uniqueChats = [];
    const seenMembers = new Set();

    chats.forEach((chat) => {
      const membersKey = chat.members.sort().join(',');

      if (!seenMembers.has(membersKey)) {
        seenMembers.add(membersKey);
        uniqueChats.push(chat);
      }
    });

    return uniqueChats;
  };

  return (
    <div className={`${styles.chatListContainer} ${menuOpen ? styles.menuOpen : ''}`} style={{ width: sidebarWidth }}>
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
        <div className={styles.backButton} onClick={() => {
          setMode(null);
          setUsers([]);
          setSelectedUsers([]);
        }}>
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
                onClick={() => mode === 'new' ? startNewChat(u) : toggleUser(u)}
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
            <button className={styles.continueButton} onClick={createGroupChat}>
              <IoIosArrowForward />
            </button>
          )}
        </div>
      ) : loading ? (
        <p className={styles.loadingText}>Загрузка чатов...</p>
      ) : (
        <div className={styles.chatList}>
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`${styles.chatItem} ${chat.unreadCount > 0 ? styles.chatUnread : ''}`}
                onClick={() => handleSelectChat(chat)}
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
                  <p className={styles.lastMessage}>{chat.lastMessage?.text}</p>
                </div>
                <div className={styles.chatTime}>
                  {formatDate(chat.lastMessage?.createdAt)}
                </div>
                {chat.unreadCount > 0 && (
                  <div className={styles.unreadBadge}>{chat.unreadCount}</div>
                )}
              </div>
            ))
          ) : (
            <p className={styles.loadingText}>Чаты не найдены</p>
          )}
        </div>
      )}
    </div>
  );
}