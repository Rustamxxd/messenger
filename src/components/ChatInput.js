import { useState, useEffect, useRef } from "react";
import { PiMicrophone } from "react-icons/pi";
import { IoSend } from "react-icons/io5";
import { ImAttachment } from "react-icons/im";
import { FaRegSmile } from "react-icons/fa";
import { MdDeleteOutline, MdContentCopy } from "react-icons/md";
import { BsFillPlayFill } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import { useVoiceMessage } from "@/hooks/useVoiceMessage";
import styles from "@/styles/ChatWindow.module.css";
import MediaSendModal from "./MediaSendModal";
import { FiLink } from "react-icons/fi";
import { CloseOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';

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
  multiSelectMode,
  selectedMessages,
  onExitMultiSelect,
  onDeleteSelected,
  onCopySelected,
  isDeleting,
  onClearSelectedMessage,
  handleTyping,
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

  const handlePaste = async (e) => {
    // Логика обработки изображений теперь в глобальном обработчике
    // Этот обработчик оставлен для совместимости
  };

  const handleSend = async () => {
    const hasText = newMessage.trim().length > 0;
    const hasVoice = Boolean(audioBlob);
    const hasFile = Boolean(file);

    if (!hasText && !hasVoice && !hasFile) return;

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

  function pluralizeMessage(count) {
    if (count % 10 === 1 && count % 100 !== 11) return 'сообщение';
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'сообщения';
    return 'сообщений';
  }

  // Escape для reply и мультивыбора
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (replyTo) {
          setReplyTo(null);
          onClearSelectedMessage?.();
        } else if (multiSelectMode) {
          onExitMultiSelect();
          onClearSelectedMessage?.();
        }
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [replyTo, multiSelectMode, onExitMultiSelect, onClearSelectedMessage]);

  // Глобальный обработчик вставки
  useEffect(() => {
    const handleGlobalPaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            setPendingFile(file);
            setShowMediaModal(true);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, []);

  // Снятие статуса печатает при размонтировании и уходе пользователя
  useEffect(() => {
    const handleBlur = () => handleTyping?.(false);
    window.addEventListener('beforeunload', handleBlur);
    return () => {
      handleTyping?.(false);
      window.removeEventListener('beforeunload', handleBlur);
    };
  }, [handleTyping]);

  return (
    <div className={styles.inputArea}>
      <input type="file" hidden onChange={handleFileChangeModal} />
      {multiSelectMode ? (
        <div className={styles.multiSelectBar + (!multiSelectMode ? ' ' + styles.multiSelectBarHidden : '')}>
          <button className={styles.multiSelectClose} onClick={() => { onExitMultiSelect(); onClearSelectedMessage?.(); }} disabled={isDeleting}>
            <CloseOutlined />
          </button>
          <span className={styles.multiSelectCount}>
            Выбрано {selectedMessages.length} {pluralizeMessage(selectedMessages.length)}
          </span>
          <div className={styles.multiSelectActions}>
            {isDeleting ? (
              <span className={styles.deletingSpinner} title="Удаление..." />
            ) : (
              <>
                <button
                  className={styles.multiCopy}
                  title="Копировать"
                  onClick={selectedMessages.length > 0 ? onCopySelected : undefined}
                  disabled={selectedMessages.length === 0}
                >
                  <MdContentCopy />
                </button>
                <button className={styles.multiDelete} onClick={onDeleteSelected} title="Удалить">
                  <DeleteOutlined />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
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
                  <span className={styles.replyText} style={{display: 'flex', alignItems: 'center', gap: 6}}>
                    {replyTo.fileType ? (
                      replyTo.fileType === "audio" ? "Голос" :
                      replyTo.fileType === "image" ? "Фото" :
                      replyTo.fileType === "video" ? "Видео" : "Файл"
                    ) : (
                      (() => {
                        const linkRegex = /^(?:@?((https?:\/\/|https?:\/)?(www\.)?([\w-]+\.)+[a-zA-Z]{2,})(:[0-9]+)?(\/\S*)?)$/i;
                        if (replyTo.text && linkRegex.test(replyTo.text.trim())) {
                          return <><FiLink style={{marginRight: 4}}/>Ссылка</>;
                        }
                        return replyTo.text?.slice(0, 80) + "...";
                      })()
                    )}
                  </span>
                </div>
                <button className={styles.replyCancel} onClick={() => { setReplyTo(null); onClearSelectedMessage?.(); }}>×</button>
              </div>
            )}

            <div
              className={styles.animatedPlaceholder + (newMessage ? ' ' + styles.placeholderHidden : '')}
            >Сообщение</div>

            <textarea
              id='message'
              value={newMessage}
              onChange={handleInputChange}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isRecording) {
                  e.preventDefault();
                  handleSend();
                } else {
                  handleKeyDown?.(e);
                }
              }}
              placeholder=""
              className={isRecording ? styles.shrinkedTextarea : ""}
              onFocus={() => handleTyping?.(true)}
              onBlur={() => handleTyping?.(false)}
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
            <span className={styles.iconSwitch + ((isRecording || showSend) ? ' ' + styles.iconSendActive : '')}>
              <IoSend className={styles.send} />
            </span>
            <span className={styles.iconSwitch + (!(isRecording || showSend) ? ' ' + styles.iconMicActive : '')}>
              <PiMicrophone />
            </span>
          </button>

          {showMediaModal && pendingFile && (
            <MediaSendModal
              file={pendingFile}
              onSend={handleSendMedia}
              onCancel={handleCancelMedia}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ChatInput;