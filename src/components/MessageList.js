import React, { useEffect, useRef, useState } from "react";
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
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevMessagesCount = useRef(messages.length);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setIsAtBottom(atBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const newMessageAdded = messages.length > prevMessagesCount.current;
    if (isAtBottom && newMessageAdded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesCount.current = messages.length;
  }, [messages, isAtBottom]);

  const allMedia = messages
    .filter((m) => ["image", "video"].includes(m.fileType))
    .map((m) => ({
      url: m.text,
      type: m.fileType,
    }));

  return (
    <div className={styles.messages} ref={messagesContainerRef}>
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
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;