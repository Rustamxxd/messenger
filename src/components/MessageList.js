import Message from "./Message";
import styles from "@/styles/ChatWindow.module.css";

const MessageList = ({ messages, userId, typingUsers, chatId, onContextMenu, onReply, onEdit, onDelete }) => {
  return (
    <div className={styles.messages}>
      <div className={styles.messageColumn}>
        {messages.length === 0 && <div className={styles.empty}>Нет сообщений</div>}

        {messages.map((msg) => (
          <Message
            key={msg.id}
            message={msg}
            isOwn={msg.sender === userId}
            onContextMenu={(e) => onContextMenu(e, msg)}
            onReply={() => onReply(msg)}
            onEdit={(newText) => onEdit(msg.id, newText)}
            onDelete={() => onDelete(msg.id)}
          />
        ))}

        {typingUsers.length > 0 && (
          <div className={styles.typingStatus}>
            {typingUsers[0]} печатает<span className={styles.dots}></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;