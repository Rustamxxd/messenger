import React from "react";
import Message from "./Message";
import styles from "@/styles/ChatWindow.module.css";

const MessageList = ({
  messages,
  userId,
  typingUsers,
  onContextMenu,
  onReply,
  onReplyClick,
  onDelete,
  onHide,
  setModalMedia,
  onUpdateMessage,
  editingMessageId,
  setEditingMessageId,
}) => {
  const allMedia = messages
    .filter((m) => ["image", "video"].includes(m.fileType))
    .map((m) => ({
      url: m.text,
      type: m.fileType,
    }));

  return (
    <div className={styles.messages}>
      <div className={styles.messageColumn}>
        {messages.length === 0 && (
          <div className={styles.empty}>Нет сообщений</div>
        )}

        {messages.map((msg, idx) => {
          const currentDate = msg.timestamp?.toDate?.();
          const prevDate = idx > 0 ? messages[idx - 1].timestamp?.toDate?.() : null;

          const showDateDivider =
            currentDate &&
            (!prevDate || currentDate.toDateString() !== prevDate.toDateString());

          const formatDay = (date) => {
            if (!date) return "";
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(date);
            target.setHours(0, 0, 0, 0);

            const diffDays = (today - target) / (1000 * 60 * 60 * 24);
            if (diffDays === 0) return "Сегодня";
            if (diffDays === 1) return "Вчера";

            return date.toLocaleDateString("ru-RU", {
              weekday: "long",
              day: "numeric",
              month: "long",
            });
          };

          return (
            <React.Fragment key={msg.id}>
              {showDateDivider && (
                <div className={styles.dateDivider}>
                  {formatDay(currentDate)}
                </div>
              )}

              <Message
                message={msg}
                isOwn={msg.sender === userId}
                onContextMenu={(e) => onContextMenu(e, msg)}
                onReply={() => onReply(msg)}
                onReplyClick={() => onReplyClick(msg)}
                onDelete={() => onDelete(msg.id)}
                onHide={() => onHide(msg.id)}
                setModalMedia={setModalMedia}
                allMedia={allMedia}
                isEditing={editingMessageId === msg.id}
                onStartEdit={() => setEditingMessageId(msg.id)}
                onSaveEdit={(newText) => {
                  onUpdateMessage(msg.id, newText);
                  setEditingMessageId(null);
                }}
                onCancelEdit={() => setEditingMessageId(null)}
              />
            </React.Fragment>
          );
        })}

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