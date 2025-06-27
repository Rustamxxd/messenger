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
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import ProfileSidebar from './ProfileSidebar';
import { CloseOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import { getUserProfile } from "../lib/firebase";
import { LuInfo } from "react-icons/lu";

const ChatWindow = ({ chatId, onHeaderClick, onMessages, onTypingUsers }) => {
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
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [usersCache, setUsersCache] = useState({});
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [profileSidebarUser, setProfileSidebarUser] = useState(null);
  const [globalMediaViewer, setGlobalMediaViewer] = useState(null);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const user = useSelector((state) => state.user.user);
  const scrollPositionRef = useRef({});
  const sendAudioRef = useRef(null);

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
    if (selectedMessages.includes(msg.id)) {
      // Если уже выбрано — не открывать кастомное меню, позволить стандартному
      return;
    }
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
    try {
      const messageRef = doc(db, `chats/${chatId}/messages`, messageId);
      const messageSnap = await getDoc(messageRef);
      if (messageSnap.exists()) {
        const messageData = messageSnap.data();
        // Создаем полную структуру документа
        await updateDoc(messageRef, {
          ...messageData,  // сохраняем все существующие поля
          text: messageData.text || '',
          sender: messageData.sender || '',
          timestamp: messageData.timestamp || null,
          deletedFor: [...(messageData.deletedFor || []), user.uid],
          fileType: messageData.fileType || null,
          caption: messageData.caption || null,
          read: messageData.read || false,
          edited: messageData.edited || false,
          replyTo: messageData.replyTo || null
        });
      }
    } catch (error) {
      console.error("Error hiding message:", error);
    }
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

  const handleScrollToMessage = (messageId) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add(styles.highlighted);
      setTimeout(() => el.classList.remove(styles.highlighted), 2000);
    }
  };

  const handleSelectMessage = (id) => {
    if (!multiSelectMode) setMultiSelectMode(true);
    setSelectedMessages((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const handleExitMultiSelect = () => {
    setMultiSelectMode(false);
    setSelectedMessages([]);
    setSelectedMessage(null);
  };

  useEffect(() => {
    if (multiSelectMode && selectedMessages.length === 0) {
      setMultiSelectMode(false);
    }
  }, [selectedMessages, multiSelectMode]);

  const handleDeleteSelected = async () => {
    const ownIds = [];
    const foreignIds = [];
    selectedMessages.forEach(id => {
      const msg = messages.find(m => m.id === id);
      if (!msg) return;
      if (msg.sender === user.uid) ownIds.push({id, msg});
      else foreignIds.push(id);
    });
    setIsDeleting(true);
    // Удалить свои у всех параллельно
    const ownPromise = Promise.all(ownIds.map(({id, msg}) => deleteMessage(id, msg)));
    // Удалить чужие только локально параллельно
    const foreignPromise = Promise.all(foreignIds.map(id => {
      const messageRef = doc(db, `chats/${chatId}/messages`, id);
      return updateDoc(messageRef, { deletedFor: arrayUnion(user.uid) });
    }));
    await Promise.all([ownPromise, foreignPromise]);
    setIsDeleting(false);
    setSelectedMessages([]);
    setMultiSelectMode(false);
    setReplyTo(null);
    setFile(null);
    setFilePreview(null);
    setNewMessage("");
  };

  // Получить displayName по uid (с кэшем)
  const getDisplayName = async (uid) => {
    if (uid === user.uid) return user.displayName || user.email || 'Вы';
    if (usersCache[uid]) return usersCache[uid].displayName || usersCache[uid].email || uid;
    const profile = await getUserProfile(uid);
    setUsersCache((prev) => ({ ...prev, [uid]: profile }));
    return profile?.displayName || profile?.email || uid;
  };

  // Формирование текста для копирования
  const handleCopySelected = async () => {
    // Сортируем по времени (по умолчанию filteredMessages уже отсортированы)
    const selectedMsgs = filteredMessages.filter((m) => selectedMessages.includes(m.id));
    const lines = await Promise.all(selectedMsgs.map(async (msg) => {
      const name = await getDisplayName(msg.sender);
      let line = `> ${name}:`;
      if (msg.fileType === 'audio') {
        line += `\n🎤 Голосовое сообщение${msg.caption ? ` (${msg.caption})` : ''}`;
      } else if (msg.fileType === 'image') {
        line += `\n🖼 ${msg.caption ? msg.caption : 'Фото'}`;
      } else if (msg.fileType === 'video') {
        line += `\n📹 ${msg.caption ? msg.caption : 'Видео'}`;
      } else if (msg.text) {
        line += `\n${msg.text}`;
      }
      return line;
    }));
    const text = lines.join('\n\n');
    await navigator.clipboard.writeText(text);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
    // Сброс мультивыбора
    setSelectedMessages([]);
    setMultiSelectMode(false);
  };

  const handleClearSelectedMessage = () => setSelectedMessage(null);

  // Для передачи в ContextMenu
  const handleCopyText = () => {
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
  };

  useEffect(() => {
    if (onTypingUsers) {
      onTypingUsers(typingUsers);
    }
  }, [typingUsers, onTypingUsers]);

  useEffect(() => {
    if (onMessages) {
      onMessages(messages);
    }
  }, [messages, onMessages]);

  const handleSendMessage = async (...args) => {
    sendAudioRef.current?.play?.();
    await sendMessage(...args);
  };

  return (
    <div className={styles.windowWrapper}>
      <audio ref={sendAudioRef} src="/assets/sendMessage.mp3" preload="auto" />
      <div className={styles.chatMain}>
        <ChatHeader
          otherUser={otherUser}
          typingUsers={typingUsers}
          onAvatarOrNameClick={onHeaderClick}
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
          onUpdateMessage={updateMessage}
          editingMessageId={editingMessageId}
          setEditingMessageId={setEditingMessageId}
          selectedMessage={selectedMessage}
          selectedMessages={selectedMessages}
          onSelectMessage={handleSelectMessage}
          multiSelectMode={multiSelectMode}
          isGroup={otherUser?.isGroup}
          members={otherUser?.members}
          onOpenProfile={id => {
            const member = otherUser?.members?.find(m => m.id === id);
            if (member) setProfileSidebarUser({ ...member, uid: member.id });
          }}
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
          sendMessage={handleSendMessage}
          handleInputChange={handleInputChange}
          showEmoji={showEmoji}
          setShowEmoji={setShowEmoji}
          handleEmojiClick={(emoji) => setNewMessage((prev) => prev + emoji.emoji)}
          handleFileChange={handleFileChange}
          file={file}
          setFile={setFile}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          multiSelectMode={multiSelectMode}
          selectedMessages={selectedMessages}
          onExitMultiSelect={handleExitMultiSelect}
          onDeleteSelected={handleDeleteSelected}
          onCopySelected={handleCopySelected}
          isDeleting={isDeleting}
          onClearSelectedMessage={handleClearSelectedMessage}
        />

        {contextMenu.visible && (
          <ContextMenu
            contextMenu={contextMenu}
            selectedMessage={selectedMessage}
            onClose={() => {
              setContextMenu({ ...contextMenu, visible: false });
              if (!selectedMessages.includes(selectedMessage?.id)) {
                setSelectedMessage(null);
              }
            }}
            onReply={handleReply}
            onEdit={(msg) => setEditingMessageId(msg.id)}
            onDelete={handleDeleteMessage}
            onHide={handleHideMessage}
            onSelect={(id) => {
              handleSelectMessage(id);
              setMultiSelectMode(true);
            }}
            onCopyText={handleCopyText}
          />
        )}

        {showSnackbar && (
          <div className={styles.snackbar}>
            <LuInfo className={styles.snackbarIcon} />
            Скопировано в буфер обмена
          </div>
        )}

        <ProfileSidebar
          open={!!profileSidebarUser}
          user={profileSidebarUser}
          allMessages={messages}
          currentUserId={user?.uid}
          onClose={() => setProfileSidebarUser(null)}
          onScrollToMessage={handleScrollToMessage}
          onOpenMedia={(files, initialIndex) => setGlobalMediaViewer({ files, initialIndex })}
          isGroupContext={true}
        />

        {globalMediaViewer && (
          <MediaViewer
            files={globalMediaViewer.files}
            initialIndex={globalMediaViewer.initialIndex}
            onClose={() => setGlobalMediaViewer(null)}
          />
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;