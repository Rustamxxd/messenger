"use client";

import { useRouter } from "next/navigation";
import styles from "@/styles/ChatWindow.module.css";
import MultiAvatar from "./UserAvatar";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import LoadingDots from "./LoadingDots";
import UserAvatar from './UserAvatar';

const ChatHeader = ({ otherUser: initialOtherUser, typingUsers = [], onAvatarOrNameClick }) => {
  const router = useRouter();
  const [otherUser, setOtherUser] = useState(initialOtherUser);
  const defaultAvatar = "/assets/default-avatar.png";

  useEffect(() => {
    setOtherUser(initialOtherUser); // Сбрасываем состояние при смене пользователя
    
    if (!initialOtherUser?.uid) return;

    const userRef = doc(db, 'users', initialOtherUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setOtherUser(prevUser => ({
          ...prevUser,
          ...userData,
          lastSeen: userData.lastSeen
        }));
      }
    });

    return () => unsubscribe();
  }, [initialOtherUser?.uid]);

  let status = '';
  let statusClass = styles.userStatus;

  if (typingUsers.length > 0) {
    status = 'печатает';
    statusClass += ' ' + styles.typingStatus;
  } else if (otherUser?.lastSeen) {
    const lastSeen = otherUser.lastSeen?.toDate?.() || otherUser.lastSeen;
    const now = new Date();
    const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));

    if (diffMinutes < 5) {
      status = 'в сети';
      statusClass += ' ' + styles.onlineStatus;
    } else {
      status = 'был(а) недавно';
    }
  }

  const handleClick = () => {
    if (otherUser?.isGroup && otherUser?.id) {
      router.push(`/groups/${otherUser.id}/edit`);
    }
  };

  const displayUser = otherUser || initialOtherUser;

  return (
    <div
      className={styles.header}
      onClick={handleClick}
      style={{ cursor: displayUser?.isGroup ? "pointer" : "default" }}
    >
      {displayUser?.isGroup ? (
        <>
          <div className={styles.avatar} onClick={onAvatarOrNameClick} style={{ cursor: 'pointer' }}>
            <MultiAvatar users={displayUser.members?.slice(0, 4)} size={40} />
          </div>
          <div className={styles.userName} onClick={onAvatarOrNameClick} style={{ cursor: 'pointer' }}>
            {displayUser.displayName || "Группа"}
          </div>
        </>
      ) : (
        <>
          <img
            src={displayUser?.photoURL || defaultAvatar}
            alt="Avatar"
            className={styles.avatar}
            onClick={onAvatarOrNameClick}
            style={{ cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className={styles.userName} onClick={onAvatarOrNameClick} style={{ cursor: 'pointer' }}>
              {displayUser?.displayName || "Собеседник"}
            </span>
            {status && (
              <span className={statusClass}>
                {status}
                {typingUsers.length > 0 && <LoadingDots />}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatHeader;