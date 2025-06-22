import React, { useState, useRef, useEffect } from "react";
import styles from "../styles/MediaSendModal.module.css";
import { FaRegSmile } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";
import EmojiPicker from "emoji-picker-react";

const MediaSendModal = ({ file, onSend, onCancel }) => {
  const [caption, setCaption] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const hideTimeout = useRef(null);
  const fileType = file?.type?.split("/")[0];
  const url = file ? URL.createObjectURL(file) : null;

  let sendLabel = "Отправить файл";
  if (fileType === "image") sendLabel = "Отправить Фото";
  else if (fileType === "video") sendLabel = "Отправить Видео";
  else if (fileType === "audio") sendLabel = file.name?.toLowerCase().endsWith('.mp3') ? "Отправить mp3 файл" : "Отправить Аудио";

  const handleEmojiClick = (e, emojiObject) => {
    setCaption((prev) => prev + (emojiObject.emoji || e.emoji));
    setShowEmoji(false);
  };

  const handleSend = (e) => {
    e.preventDefault();
    onSend(caption);
    handleClose();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
    onCancel();
    }, 300); // Время анимации закрытия
  };

  // Обработка Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className={`${styles.overlay} ${isClosing ? styles.closing : ''}`} onClick={handleClose}>
      <div className={`${styles.wrapper} ${isClosing ? styles.closing : ''}`} onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className={styles.closeBtn}><IoMdClose /></button>
        <div className={styles.sendLabel}>{sendLabel}</div>
        <div className={styles.mediaPreview}>
          {fileType === "image" && <img src={url} alt="preview" className={styles.imagePreview} />}
          {fileType === "video" && <video src={url} controls className={styles.videoPreview} />}
          {fileType === "audio" && <audio src={url} controls className={styles.audioPreview} />}
        </div>
        <form className={styles.inputBubble} onSubmit={handleSend}>
          <div
            className={styles.emojiWrapper}
            onMouseEnter={() => {
              if (hideTimeout.current) clearTimeout(hideTimeout.current);
              setShowEmoji(true);
            }}
            onMouseLeave={() => {
              hideTimeout.current = setTimeout(() => setShowEmoji(false), 250);
            }}
          >
            <button type="button">
              <FaRegSmile className={styles.smile} />
            </button>
            {showEmoji && (
              <div className={styles.emojiPicker}>
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          
          <div
            className={styles.animatedPlaceholder + (caption ? ' ' + styles.placeholderHidden : '')}
          >Добавьте подпись...</div>
          
          <input
            type="text"
            placeholder=""
            value={caption}
            onChange={e => setCaption(e.target.value)}
            className={styles.captionInput}
            onFocus={() => setShowEmoji(false)}
          />
          
          <button type="submit" className={styles.sendIconBtn}>
            <IoSend className={styles.sendIcon} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default MediaSendModal; 