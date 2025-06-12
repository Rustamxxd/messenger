import React, { useState, useEffect, useRef } from "react";
import styles from "@/styles/Message.module.css";
import VoiceMessagePlayer from "./VoiceMessagePlayer";
import { LuCheck, LuCheckCheck } from "react-icons/lu";
import { IoCheckmark, IoCheckmarkDone } from "react-icons/io5";

const Message = ({
  message,
  isOwn,
  onContextMenu,
  onReply,
  onReplyClick,
  onDelete,
  onHide,
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
      id={`message-${message.id}`}
      className={`${styles.message} ${isOwn ? styles.own : ""}`}
      onContextMenu={(e) => onContextMenu(e, message)}
    >
      <div className={styles.messageColumn}>
        {message.replyTo && (
          <div 
            className={styles.reply} 
            onClick={() => onReplyClick(message)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.replyText} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {message.replyTo.fileType === "image" && (
                <img src={message.replyTo.text} alt="preview" className={styles.replyMediaPreview} />
              )}
              {message.replyTo.fileType === "video" && (
                <video src={message.replyTo.text} className={styles.replyMediaPreview} />
              )}
              {message.replyTo.fileType === "audio" && (
                <div className={styles.replyAudioPreview}>
                  <span className={styles.replyAudioIcon}>🎵</span>
                </div>
              )}
              {message.replyTo.fileType ? (
                message.replyTo.fileType === "audio" ? "Голос" :
                message.replyTo.fileType === "image" ? "Фото" :
                message.replyTo.fileType === "video" ? "Видео" : "Файл"
              ) : (
                message.replyTo.text?.length > 50
                  ? message.replyTo.text.slice(0, 50) + "..."
                  : message.replyTo.text
              )}
            </div>
          </div>
        )}

        <div className={styles.content}>
          {isEditing ? (
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
                {message.read ? <IoCheckmarkDone /> : <IoCheckmark />}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;