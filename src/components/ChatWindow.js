import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import styles from "@/styles/ChatWindow.module.css";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import ContextMenu from "./ContextMenu";
import { useChat } from "@/hooks/useChat";

const ChatWindow = ({ chatId }) => {
  const {
    messages,
    otherUser,
    typingUsers,
    sendMessage,
    deleteMessage,
    updateMessage,
    handleTyping,
  } = useChat(chatId);

  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const typingTimeoutRef = useRef(null);
  const user = useSelector((state) => state.user.user);

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    setSelectedMessage(msg);
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  const handleInputChange = (e) => {
  const text = e.target.value;
  setNewMessage(text);
  handleTyping(true);

  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }

  typingTimeoutRef.current = setTimeout(() => {
    handleTyping(false);
  }, 2000); // ⏱ 2 сек = как в Telegram
};

  const handleSend = () => {
  sendMessage(newMessage, file);
  setNewMessage("");
  setFile(null);
  handleTyping(false);
};

const handleReply = (message) => {
  console.log("Reply to:", message);
};

  return (
    <div className={`${styles.chatWindow} ${darkMode ? styles.dark : ""}`}>
      <ChatHeader otherUser={otherUser} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />
      <MessageList
      messages={messages}
      userId={user?.uid}
      typingUsers={typingUsers}
      chatId={chatId}
      onContextMenu={handleContextMenu}
      onReply={handleReply}
      onEdit={(id, text) => updateMessage(id, text)}
      onDelete={(id) => deleteMessage(id)}
    />
      <ChatInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sendMessage={handleSend}
        handleInputChange={handleInputChange}
        handleKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        showEmoji={showEmoji}
        setShowEmoji={setShowEmoji}
        handleEmojiClick={(emoji) => setNewMessage((prev) => prev + emoji.emoji)}
        handleFileChange={(e) => setFile(e.target.files[0])}
        file={file}
      />
      <ContextMenu
      contextMenu={contextMenu}
      selectedMessage={selectedMessage}
      onClose={() => setContextMenu({ ...contextMenu, visible: false })}
      onReply={(msg) => console.log("Reply to", msg)} // сюда можно вставить reply state
      onEdit={(id, text) => console.log("Edit", id, text)} // уже реализовано в Message
      onDelete={(id) => deleteMessage(id)}
    />
    </div>
  );
};

export default ChatWindow;
