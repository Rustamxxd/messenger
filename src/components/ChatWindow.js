import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import styles from "@/styles/ChatWindow.module.css";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import ContextMenu from "./ContextMenu";
import MediaViewer from "./MediaViewer";
import { IoArrowDown } from "react-icons/io5";
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
  const [filePreview, setFilePreview] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [modalMedia, setModalMedia] = useState(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const user = useSelector((state) => state.user.user);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setNewMessage(text);
    handleTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  };

  const handleReply = (message) => {
    setReplyTo(message);
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    setSelectedMessage(msg);
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    const previewURL = URL.createObjectURL(selected);
    const type = selected.type.split("/")[0];
    setFilePreview({ type, url: previewURL });
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const container = document.querySelector(`.${styles.messages}`);
    const handleScroll = () => {
      const isUp = container.scrollTop + container.clientHeight < container.scrollHeight - 50;
      setIsScrolledUp(isUp);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={styles.chatWindow}>
      <ChatHeader otherUser={otherUser} />

      <MessageList
        messages={messages}
        userId={user?.uid}
        typingUsers={typingUsers}
        onContextMenu={handleContextMenu}
        onReply={handleReply}
        onDelete={(id) => deleteMessage(id)}
        setModalMedia={setModalMedia}
        onUpdateMessage={(id, newText) => updateMessage(id, newText)}
        editingMessageId={editingMessageId}
        setEditingMessageId={setEditingMessageId}
      />

      {modalMedia && (
        <MediaViewer
          files={modalMedia.files}
          initialIndex={modalMedia.initialIndex}
          onClose={() => setModalMedia(null)}
        />
      )}

      {isScrolledUp && (
        <>
          <button
            className={styles.scrollDownBtn}
            onClick={() => {
              const el = document.querySelector(`.${styles.messages}`);
              el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            }}
          >
            <IoArrowDown className={styles.arrowDown} />
          </button>
          <div className={styles.shadowTopWrapper}>
            <div className={styles.shadowTop} />
          </div>
        </>
      )}

      <ChatInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sendMessage={sendMessage}
        handleInputChange={handleInputChange}
        showEmoji={showEmoji}
        setShowEmoji={setShowEmoji}
        handleEmojiClick={(emoji) => setNewMessage((prev) => prev + emoji.emoji)}
        handleFileChange={handleFileChange}
        file={file}
        setFile={setFile}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
      />

      <ContextMenu
        contextMenu={contextMenu}
        selectedMessage={selectedMessage}
        onClose={() => setContextMenu({ ...contextMenu, visible: false })}
        onReply={(msg) => {
          handleReply(msg);
          setContextMenu({ ...contextMenu, visible: false });
        }}
        onEdit={(msg) => {
          setEditingMessageId(msg.id);
          setContextMenu({ ...contextMenu, visible: false });
        }}
        onDelete={(id) => {
          deleteMessage(id);
          setContextMenu({ ...contextMenu, visible: false });
        }}
      />

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;