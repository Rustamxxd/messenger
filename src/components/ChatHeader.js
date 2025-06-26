"use client";

import { useRouter } from "next/navigation";
import styles from "@/styles/ChatWindow.module.css";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import LoadingDots from "./LoadingDots";

const ChatHeader = ({ otherUser: initialOtherUser, typingUsers = [], onAvatarOrNameClick }) => {
  const router = useRouter();
  const [otherUser, setOtherUser] = useState(initialOtherUser);
  const defaultAvatar = "/assets/default-avatar.png";
  const defaultGroupAvatar = "/assets/default-group.png";

  useEffect(() => {
    setOtherUser(initialOtherUser);
    let unsubscribe;
    if (initialOtherUser?.id) {
      const groupRef = doc(db, 'chats', initialOtherUser.id);
      unsubscribe = onSnapshot(groupRef, (docSnap) => {
        if (docSnap.exists()) {
          setOtherUser(prevUser => ({
            ...prevUser,
            ...docSnap.data(),
            id: docSnap.id,
            displayName: docSnap.data().name || prevUser.displayName
          }));
        }
      });
    } else if (initialOtherUser?.uid) {
      const userRef = doc(db, 'users', initialOtherUser.uid);
      unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setOtherUser(prevUser => ({
            ...prevUser,
            ...userData,
            lastSeen: userData.lastSeen
          }));
        }
      });
    }
    return () => unsubscribe && unsubscribe();
  }, [initialOtherUser?.id]);

  let status = '';
  let statusClass = styles.userStatus;

  if (typingUsers.length > 0) {
    status = 'печатает';
    statusClass += ' ' + styles.typingStatus;
  } else if (otherUser?.lastSeen) {
    const lastSeen = otherUser.lastSeen?.toDate?.() || otherUser.lastSeen;
    const now = new Date();
    const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));

    if (diffMinutes < 1) {
      status = 'в сети';
      statusClass += ' ' + styles.onlineStatus;
    } else {
      status = 'был(а) недавно';
    }
  }

  const displayUser = otherUser || initialOtherUser;

  return (
    <div
      className={styles.header}
      style={{ cursor: displayUser?.isGroup ? "pointer" : "default" }}
    >
      {displayUser?.isGroup ? (
        <>
          <img
            src={displayUser?.photoURL || defaultGroupAvatar}
            alt="Avatar"
            className={styles.avatar}
            onClick={onAvatarOrNameClick}
            style={{ cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className={styles.userName} onClick={onAvatarOrNameClick} style={{ cursor: 'pointer' }}>
              {displayUser.displayName || "Группа"}
            </span>
            <span className={styles.memberCount}>
              {displayUser.members?.length || 0} участник
              {displayUser.members?.length === 1
                ? ''
                : displayUser.members?.length < 5 && displayUser.members?.length > 1
                ? 'а'
                : 'ов'}
            </span>
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