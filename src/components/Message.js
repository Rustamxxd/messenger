import React, { useState, useEffect, useRef } from "react";
import styles from "@/styles/Message.module.css";
import VoiceMessagePlayer from "./VoiceMessagePlayer";

const Message = ({
  message,
  isOwn,
  onContextMenu,
  setModalMedia,
  allMedia = [],
  isEditing,
  onSaveEdit,
  onCancelEdit,
}) => {
  const [editedText, setEditedText] = useState(message.text);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      setEditedText(message.text);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [isEditing, message.text]);

  const handleSave = () => {
    const trimmed = editedText.trim();
    if (trimmed && trimmed !== message.text) {
      onSaveEdit(trimmed);
    } else {
      onCancelEdit();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancelEdit();
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
    <div
      className={`${styles.message} ${isOwn ? styles.own : ""}`}
      onContextMenu={(e) => onContextMenu(e, message)}
    >
      <div className={styles.messageColumn}>
        {message.replyTo && (
          <div className={styles.reply}>
            <div className={styles.replyText}>
              {message.replyTo.text?.length > 50
                ? message.replyTo.text.slice(0, 50) + "..."
                : message.replyTo.text}
            </div>
          </div>
        )}

        <div className={styles.content}>
          {message.deleted ? (
            <i className={styles.deleted}>[сообщение удалено]</i>
          ) : isEditing ? (
            <div className={styles.editContainer}>
              <textarea
                ref={textareaRef}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.editInput}
              />
              <div className={styles.editButtons}>
                <button onClick={handleSave} className={styles.saveButton}>
                  Сохранить
                </button>
                <button
                  onClick={() => onCancelEdit()}
                  className={styles.cancelButton}
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <>
              {["image", "video"].includes(message.fileType) && (
                <div
                  onClick={() =>
                    setModalMedia({
                      files: allMedia,
                      initialIndex: allMedia.findIndex(
                        (m) => m.url === message.text
                      ),
                    })
                  }
                >
                  {message.fileType === "image" && (
                    <img src={message.text} alt="image" className="thumb" />
                  )}
                  {message.fileType === "video" && (
                    <video
                      src={message.text}
                      className="thumb"
                      muted
                      playsInline
                    />
                  )}
                </div>
              )}

              {message.fileType === "audio" && (
                <VoiceMessagePlayer src={message.text} />
              )}

              {!message.fileType && (
                <p className={styles.text}>{message.text}</p>
              )}
            </>
          )}

          <div className={styles.meta}>
            <span className={styles.time}>
              {formatTime(message.timestamp)}{" "}
              {message.edited ? "(изменено)" : ""}
            </span>
            {isOwn && !message.deleted && (
              <span className={styles.readStatus}>
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