import React from "react";
import styles from "@/styles/Message.module.css";

const Message = ({ message, isOwn }) => {
  const hasTranslation = message.originalText && message.originalText !== message.text;

  const renderMessageContent = () => {
    if (message.type === 'emoji') {
      return <span className={styles.emoji}>{message.text}</span>;
    }

    if (message.type === 'image') {
      return <img src={message.text} alt="message image" className={styles.messageImage} />;
    }

    if (message.type === 'audio') {
      return (
        <audio controls className={styles.messageAudio}>
          <source src={message.text} type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>
      );
    }

    if (message.type === 'video') {
      return (
        <video controls className={styles.messageVideo}>
          <source src={message.text} type="video/mp4" />
          Your browser does not support the video element.
        </video>
      );
    }

    return <p className={styles.messageText}>{message.text}</p>;
  };

  const formatTime = (timestamp) => {
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp.toDate?.() || new Date();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className={`${styles.messageWrapper} ${isOwn ? styles.own : styles.other}`}>
      <div
        className={`${styles.messageBubble} ${isOwn ? styles.ownBubble : styles.otherBubble}`}
        title={hasTranslation ? `Оригинал: ${message.originalText}` : undefined}
      >
        {!isOwn && <p className={styles.senderName}>{message.senderName}</p>}
        
        <div className={styles.messageContentWrapper}>
          <div className={styles.messageTextContainer}>
            {renderMessageContent()}
          </div>
          <span className={`${styles.timestamp} ${isOwn ? styles.ownTime : styles.otherTime}`}>
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Message;