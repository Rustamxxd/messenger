import React, { useState } from "react";
import styles from "@/styles/Message.module.css";

const Message = ({ message, isOwn, onEdit, onDelete, onReply, onContextMenu }) => {
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.text);

  const handleSave = () => {
    if (editedText.trim() && editedText !== message.text) {
      onEdit(editedText);
    }
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setEditing(false);
      setEditedText(message.text);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return "";
    return new Date(timestamp.toDate()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`${styles.message} ${isOwn ? styles.own : ""}`} onContextMenu={onContextMenu}>
      <div className={styles.messageColumn}>
        {message.replyTo && (
          <div className={styles.reply}>
            <div className={styles.replyText}>
              {message.replyTo.text.length > 50
                ? `${message.replyTo.text.substring(0, 50)}...`
                : message.replyTo.text}
            </div>
          </div>
        )}

        <div className={styles.content}>
          {editing ? (
            <div className={styles.editContainer}>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className={styles.editInput}
              />
              <div className={styles.editButtons}>
                <button onClick={handleSave} className={styles.saveButton}>Сохранить</button>
                <button onClick={() => { setEditing(false); setEditedText(message.text); }} className={styles.cancelButton}>Отмена</button>
              </div>
            </div>
          ) : (
            <p className={styles.text}>{message.text}</p>
          )}

          <div className={styles.meta}>
            <span className={styles.time}>{formatTime(message.timestamp)}</span>
            {isOwn && (
              <span className={`${styles.readStatus} ${styles.inline}`}>
                {message.read ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;