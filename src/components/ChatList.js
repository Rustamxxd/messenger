'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from '@/styles/ChatList.module.css';
import {
  FaMoon, FaSun, FaPen, FaUsers,
} from 'react-icons/fa';
import multiavatar from '@multiavatar/multiavatar';
import { HiOutlinePlus } from 'react-icons/hi';
import { IoIosSearch } from 'react-icons/io';
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

      const enrichedChats = userChats.map((chat) => {
        const isGroup = chat.members.length > 2;
        if (isGroup) {
          return {
            ...chat,
            displayName: chat.name,
            photoURL: null,
          };
        } else {
          const otherUid = chat.members.find((uid) => uid !== user.uid);
          const otherUser = userMap[otherUid];
          return {
            ...chat,
            displayName: otherUser?.displayName || otherUser?.email,
            photoURL: otherUser?.photoURL || null,
          };
        }
      });

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
    setUsers(snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() })));
  };

  const startNewChat = async (targetUser) => {
    if (!user) return;

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

    const doc = await addDoc(collection(db, 'chats'), {
      name: `${user.displayName || user.email} & ${targetUser.displayName || targetUser.email}`,
      members: [user.uid, targetUser.uid],
      createdAt: serverTimestamp(),
    });
    onSelectChat({ id: doc.id });
    setMode(null);
  };

  const createGroupChat = async () => {
    if (selectedUsers.length < 2) return alert('Выберите хотя бы двух пользователей');
    const groupName = prompt('Введите название группы:');
    if (!groupName) return;

    const memberIds = [user.uid, ...selectedUsers.map((u) => u.uid)];
    const doc = await addDoc(collection(db, 'chats'), {
      name: groupName,
      members: memberIds,
      createdAt: serverTimestamp(),
    });
    onSelectChat({ id: doc.id });
    setMode(null);
    setSelectedUsers([]);
  };

  const handleUserClick = (target) => {
    if (mode === 'new') {
      startNewChat(target);
    } else if (mode === 'group') {
      const already = selectedUsers.find((u) => u.uid === target.uid);
      if (already) {
        setSelectedUsers(selectedUsers.filter((u) => u.uid !== target.uid));
      } else {
        setSelectedUsers([...selectedUsers, target]);
      }
    }
  };

  useEffect(() => {
    if (mode) loadUsers();
  }, [mode]);

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
              <span className={styles.displayName}>{user?.displayName || user?.email || 'Гость'}</span>
            </div>
          </div>
          <div className={styles.menuItem} onClick={() => setMode('new')}>
            <FaPen /> Новое сообщение
          </div>
          <div className={styles.menuItem} onClick={() => setMode('group')}>
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

      {mode ? (
        <div className={styles.userList}>
          {users.map((u) => (
            <div
              key={u.uid}
              onClick={() => handleUserClick(u)}
              className={`${styles.userItem} ${selectedUsers.find((s) => s.uid === u.uid) ? styles.selected : ''}`}
            >
              <div className={styles.avatar}>
                <UserAvatar user={u} />
              </div>
              <span>{u.displayName || u.email}</span>
            </div>
          ))}
          {mode === 'group' && (
            <>
              <button className={styles.continueButton} onClick={createGroupChat}>
                Продолжить
              </button>
              {selectedUsers.length > 0 && (
                <div className={styles.selectedUsers}>
                  <p>
                    Выбрано: {selectedUsers.map((user) => user.displayName || user.email).join(', ')}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      ) : loading ? (
        <p className={styles.loadingText}>Загрузка чатов...</p>
      ) : (
        <div className={styles.chatList}>
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <div key={chat.id} className={styles.chatItem} onClick={() => onSelectChat(chat)}>
                <div className={styles.avatar}>
                  {chat.photoURL ? (
                    <img src={chat.photoURL} alt="avatar" className={styles.avatar} />
                  ) : (
                    <div
                      className={styles.avatar}
                      dangerouslySetInnerHTML={{
                        __html: multiavatar(chat.displayName || 'user'),
                      }}
                    />
                  )}
                </div>
                <div className={styles.chatInfo}>
                  <p className={styles.chatName}>{chat.displayName}</p>
                </div>
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
