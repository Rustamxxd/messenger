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
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { doc, updateDoc, arrayUnion, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import ProfileSidebar from './ProfileSidebar';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const user = useSelector((state) => state.user.user);
  const scrollPositionRef = useRef({});

  useOnlineStatus(user?.uid);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

  useEffect(() => {
    const handleScroll = (e) => {
      if (contextMenu.visible) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const messagesContainer = document.querySelector(`.${styles.messages}`);
    if (messagesContainer) {
      messagesContainer.addEventListener('wheel', handleScroll, { passive: false });
      messagesContainer.addEventListener('touchmove', handleScroll, { passive: false });
    }

    return () => {
      if (messagesContainer) {
        messagesContainer.removeEventListener('wheel', handleScroll);
        messagesContainer.removeEventListener('touchmove', handleScroll);
      }
    };
  }, [contextMenu.visible]);

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
    setReplyTo({
      id: message.id,
      text: message.text,
      sender: message.sender,
      fileType: message.fileType
    });
  };

  const handleReplyClick = (message) => {
    const repliedMessage = messages.find(msg => msg.id === message.replyTo?.id);
    if (repliedMessage) {
      const messageElement = document.getElementById(`message-${repliedMessage.id}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageElement.classList.add(styles.highlighted);
        setTimeout(() => {
          messageElement.classList.remove(styles.highlighted);
        }, 2000);
      }
    }
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
      if (!container) return;
      const isScrollable = container.scrollHeight > container.clientHeight + 5;
      const threshold = 10;
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
      setIsScrolledUp(isScrollable && !isAtBottom);
    };
    container?.addEventListener("scroll", handleScroll);
    handleScroll(); // Проверить сразу при монтировании
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [chatId, messages.length]);

  useEffect(() => {
    const container = document.querySelector(`.${styles.messages}`);
    if (!container) return;
    const handleScroll = () => {
      scrollPositionRef.current[chatId] = container.scrollTop;
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [chatId]);

  useEffect(() => {
    const container = document.querySelector(`.${styles.messages}`);
    if (!container) return;
    // Восстановить позицию, если она была
    const pos = scrollPositionRef.current[chatId];
    if (typeof pos === "number") {
      container.scrollTop = pos;
    } else {
      // Если позиции нет — скроллим к низу
      container.scrollTop = container.scrollHeight;
    }
  }, [chatId, messages.length]);

  const handleDeleteMessage = async (messageId, isOwnMessage) => {
    if (isOwnMessage) {
      // Если это наше сообщение - удаляем его из базы данных
      const message = messages.find(msg => msg.id === messageId);
      await deleteMessage(messageId, message);
    }
  };

  const handleHideMessage = async (messageId) => {
    // Добавляем сообщение в deletedFor для текущего пользователя
    const messageRef = doc(db, `chats/${chatId}/messages`, messageId);
    await updateDoc(messageRef, {
      deletedFor: arrayUnion(user.uid)
    });
  };

  // Фильтруем сообщения, исключая удаленные
  const filteredMessages = messages.filter(msg => {
    const isOwnMessage = msg.sender === user.uid;
    if (isOwnMessage) {
      return !msg.deleted; // Для своих сообщений проверяем флаг deleted
    } else {
      return !msg.deletedFor?.includes(user.uid); // Для чужих проверяем deletedFor
    }
  });

  useEffect(() => {
    if (!filteredMessages.length) return;

    // Найти первое непрочитанное сообщение
    const firstUnread = filteredMessages.find(
      (msg) => !msg.read && msg.sender !== user.uid
    );

    if (firstUnread) {
      // Скроллим к первому непрочитанному сообщению
      const el = document.getElementById(`message-${firstUnread.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }

    // Если все прочитано — скроллим к самому низу
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredMessages, user?.uid]);

  // Функция для передачи в ChatHeader
  const handleHeaderClick = () => setSidebarOpen(true);

  return (
    <div className={styles.windowWrapper + (sidebarOpen ? ' ' + styles.sidebarOpen : '')}>
      <ProfileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={otherUser}
        typingUsers={typingUsers}
      />
      <div className={styles.chatMain}>
        <ChatHeader
          otherUser={otherUser}
          typingUsers={typingUsers}
          onAvatarOrNameClick={handleHeaderClick}
        />
        <MessageList
          messages={filteredMessages}
          userId={user?.uid}
          typingUsers={typingUsers}
          onContextMenu={handleContextMenu}
          onReply={handleReply}
          onReplyClick={handleReplyClick}
          onDelete={handleDeleteMessage}
          onHide={handleHideMessage}
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

        <button
          className={`${styles.scrollDownBtn} ${!isScrolledUp ? styles.scrollDownBtnHidden : ''}`}
          onClick={() => {
            const el = document.querySelector(`.${styles.messages}`);
            el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          }}
        >
          <IoArrowDown className={styles.arrowDown} />
        </button>
        <div className={`${styles.shadowTopWrapper} ${!isScrolledUp ? styles.shadowTopWrapperHidden : ''}`}>
          <div className={styles.shadowTop} />
        </div>

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

        {contextMenu.visible && (
          <ContextMenu
            contextMenu={contextMenu}
            selectedMessage={selectedMessage}
            onClose={() => setContextMenu({ ...contextMenu, visible: false })}
            onReply={handleReply}
            onEdit={(msg) => setEditingMessageId(msg.id)}
            onDelete={handleDeleteMessage}
            onHide={handleHideMessage}
          />
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;