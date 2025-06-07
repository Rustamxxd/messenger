"use client";

import { useRouter } from "next/navigation";
import styles from "@/styles/ChatWindow.module.css";
import MultiAvatar from "./UserAvatar";

const ChatHeader = ({ otherUser }) => {
  console.log("ChatHeader otherUser:", otherUser);
  const router = useRouter();

  const handleClick = () => {
    if (otherUser?.isGroup && otherUser?.id) {
      router.push(`/groups/${otherUser.id}/edit`);
    }
  };

  return (
    <div
      className={styles.header}
      onClick={handleClick}
      style={{ cursor: otherUser?.isGroup ? "pointer" : "default" }}
    >
      {otherUser?.isGroup ? (
        <>
          <div className={styles.avatar}>
            <MultiAvatar users={otherUser.members.slice(0, 4)} size={40} />
          </div>
          <div className={styles.userName}>
            {otherUser.displayName || "Группа"}
          </div>
        </>
      ) : (
        <>
          <img
            src={otherUser?.photoURL || "/default-avatar.png"}
            alt="Avatar"
            className={styles.avatar}
          />
          <span className={styles.userName}>
            {otherUser?.displayName || "Собеседник"}
          </span>
        </>
      )}
    </div>
  );
};

export default ChatHeader;