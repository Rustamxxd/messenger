import { useState, useEffect, useRef } from "react";
import { PiMicrophone } from "react-icons/pi";
import { IoSend } from "react-icons/io5";
import { ImAttachment } from "react-icons/im";
import { FaRegSmile } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";
import EmojiPicker from "emoji-picker-react";
import { useVoiceMessage } from "@/hooks/useVoiceMessage";
import styles from "@/styles/ChatWindow.module.css";

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

  const handleSend = async () => {
  const hasText = newMessage.trim().length > 0;
  const hasVoice = Boolean(audioBlob);
  const hasFile = Boolean(file);

  if (!hasText && !hasVoice && !hasFile) return;

  if (hasVoice) {
    const voiceFile = new File([audioBlob], 'voice.webm', { type: 'audio/webm' });
    await sendMessage(newMessage.trim(), voiceFile, replyTo);
  } else {
    await sendMessage(newMessage.trim(), file, replyTo);
  }

  setNewMessage("");
  setFile?.(null);
  setReplyTo(null);
  reset();
  setSeconds(0);
};

  const showSend = !!(newMessage.trim() || file || audioBlob);

  return (
    <div className={styles.inputArea}>
      <input type="file" hidden onChange={handleFileChange} />

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
            <span className={styles.replyLabel}>Ответ:</span>
            <span className={styles.replyText}>{replyTo.text?.slice(0, 80)}...</span>
            <button className={styles.replyCancel} onClick={() => setReplyTo(null)}>×</button>
          </div>
        )}

        <textarea
          value={newMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
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
            stopRecording(async (blob) => {
              const voiceFile = new File([blob], "voice.webm", { type: "audio/webm" });
              await sendMessage(newMessage.trim(), voiceFile);
              reset();
              setSeconds(0);
              setNewMessage("");
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
    </div>
  );
};

export default ChatInput;