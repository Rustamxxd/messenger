import { useState, useEffect, useRef } from "react";
import { PiMicrophone } from "react-icons/pi";
import { IoSend } from "react-icons/io5";
import { ImAttachment } from "react-icons/im";
import { FaRegSmile } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";
import { BsFillPlayFill } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import { useVoiceMessage } from "@/hooks/useVoiceMessage";
import styles from "@/styles/ChatWindow.module.css";
import MediaSendModal from "./MediaSendModal";

const ChatInput = ({
  newMessage,
  setNewMessage,
  sendMessage,
  handleInputChange,
  handleKeyDown,
  showEmoji,
  setShowEmoji,
  handleEmojiClick,
  handleFileChange,
  file,
  replyTo,
  setReplyTo,
  setFile,
}) => {
  const {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    reset,
  } = useVoiceMessage();

  const [seconds, setSeconds] = useState(0);
  const hideTimeout = useRef(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  useEffect(() => {
    if (!isRecording) return;
    setSeconds(0);
    const i = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [isRecording]);

  

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleCancelAudio = () => {
    reset();
    setSeconds(0);
  };

  const handleFileChangeModal = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setPendingFile(selected);
    setShowMediaModal(true);
  };

  const handleSendMedia = async (caption) => {
    await sendMessage(caption, pendingFile, replyTo);
    setShowMediaModal(false);
    setPendingFile(null);
    setFile?.(null);
    setReplyTo(null);
    setNewMessage("");
    reset();
  };

  const handleCancelMedia = () => {
    setShowMediaModal(false);
    setPendingFile(null);
    setFile?.(null);
  };

  const handleSend = async () => {
    const hasText = newMessage.trim().length > 0;
    const hasVoice = Boolean(audioBlob);
    const hasFile = Boolean(file);

    if (!hasText && !hasVoice && !hasFile) return;

    // Сбросить UI сразу!
    setNewMessage("");
    setFile?.(null);
    setPendingFile?.(null);
    setReplyTo(null);
    reset();
    setShowMediaModal(false);
    setSeconds(0);

    try {
      if (hasVoice) {
        const voiceFile = new File([audioBlob], 'voice.webm', { type: 'audio/webm' });
        sendMessage(newMessage.trim(), voiceFile, replyTo); // не await!
      } else if (hasFile) {
        sendMessage(newMessage.trim(), file, replyTo);
      } else {
        sendMessage(newMessage.trim(), null, replyTo);
      }
    } catch (error) {
      console.error('Ошибка при отправке:', error);
    }
  };

  const showSend = !!(newMessage.trim() || file || audioBlob);

  return (
    <div className={styles.inputArea}>
      <input type="file" hidden onChange={handleFileChangeModal} />

      <div className={`${styles.inputBubble} ${isRecording ? styles.recording : ""}`}>
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
          <button>
            <FaRegSmile className={styles.smile} />
          </button>

          {showEmoji && (
            <div className={styles.emojiPicker}>
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>

        {replyTo && (
          <div className={styles.replyPreview}>
            <div className={styles.replyContent}>
              {replyTo.fileType === "image" && (
                <img src={replyTo.text} alt="preview" className={styles.replyMediaPreview} />
              )}
              {replyTo.fileType === "video" && (
                <video src={replyTo.text} className={styles.replyMediaPreview} />
              )}
              {replyTo.fileType === "audio" && (
                <div className={styles.replyAudioPreview}>
                  <BsFillPlayFill className={styles.replyAudioIcon} />
                </div>
              )}
              <span className={styles.replyLabel}>Ответ:</span>
              <span className={styles.replyText}>
                {replyTo.fileType ? (
                  replyTo.fileType === "audio" ? "Голос" :
                  replyTo.fileType === "image" ? "Фото" :
                  replyTo.fileType === "video" ? "Видео" : "Файл"
                ) : (
                  replyTo.text?.slice(0, 80) + "..."
                )}
              </span>
            </div>
            <button className={styles.replyCancel} onClick={() => setReplyTo(null)}>×</button>
          </div>
        )}

        <textarea
          value={newMessage}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isRecording) {
              e.preventDefault();
              handleSend();
            } else {
              handleKeyDown?.(e);
            }
          }}
          placeholder="Сообщение"
          className={isRecording ? styles.shrinkedTextarea : ""}
        />

        {!isRecording && (
          <button onClick={() => document.querySelector('input[type="file"]').click()}>
            <ImAttachment className={styles.attachment} />
          </button>
        )}

        {isRecording && (
          <div className={styles.voiceTimerRight}>
            <span className={styles.voiceTime}>{formatTime(seconds)}</span>
            <span className={styles.redDot}></span>
          </div>
        )}
      </div>

      {isRecording && (
        <button onClick={handleCancelAudio} className={styles.voiceCancelExternal}><MdDeleteOutline className={styles.inputDelete}/></button>
      )}

      <button
        className={styles.sendButton}
        onClick={() => {
          if (isRecording) {
            stopRecording((blob) => {
              if (!blob) return;
              // Сбросить UI сразу!
              reset();
              setSeconds(0);
              setNewMessage("");
              setFile?.(null);
              setPendingFile?.(null);
              setReplyTo(null);
              setShowMediaModal(false);

              const voiceFile = new File([blob], "voice.webm", { type: "audio/webm" });
              sendMessage(newMessage.trim(), voiceFile, replyTo);
            });
          } else if (newMessage.trim() || file) {
            handleSend();
          } else {
            startRecording();
          }
        }}
      >
        {isRecording || showSend ? <IoSend className={styles.send}/> : <PiMicrophone />}
      </button>

      {showMediaModal && pendingFile && (
        <MediaSendModal
          file={pendingFile}
          onSend={handleSendMedia}
          onCancel={handleCancelMedia}
        />
      )}
    </div>
  );
};

export default ChatInput;