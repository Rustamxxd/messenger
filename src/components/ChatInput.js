import { IoSend } from "react-icons/io5";
import { MdAttachFile, MdOutlineEmojiEmotions } from "react-icons/md";
import EmojiPicker from "emoji-picker-react";
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
  file
}) => (
  <div className={styles.inputArea}>
    <input type="file" hidden onChange={handleFileChange} />
    <button onClick={() => document.querySelector('input[type="file"]').click()}>
      <MdAttachFile />
    </button>
    <button onClick={() => setShowEmoji((prev) => !prev)}>
      <MdOutlineEmojiEmotions />
    </button>
    {showEmoji && (
      <div className={styles.emojiPicker}>
        <EmojiPicker onEmojiClick={handleEmojiClick} />
      </div>
    )}
    <textarea
      value={newMessage}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      placeholder="Введите сообщение..."
    />
    <button onClick={sendMessage} disabled={!newMessage.trim() && !file}>
      <IoSend />
    </button>
  </div>
);

export default ChatInput;
