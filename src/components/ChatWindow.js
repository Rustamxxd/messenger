import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  setDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Message from "./Message";
import UserAvatar from "./UserAvatar";
import styles from "@/styles/ChatWindow.module.css";
import { IoSend } from "react-icons/io5";
import { MdAttachFile } from "react-icons/md";
import EmojiPicker from "emoji-picker-react";

const setTypingStatus = async (chatId, uid, name, isTyping) => {
  if (!chatId || !uid) return;
  const typingRef = doc(db, `chats/${chatId}/typing/${uid}`);
  if (isTyping) {
    await setDoc(typingRef, {
      name,
      isTyping: true,
      timestamp: serverTimestamp(),
    });
  } else {
    await deleteDoc(typingRef).catch(() => {});
  }
};

const ChatWindow = ({ chatId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const user = useSelector((state) => state.user.user);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!chatId || !user?.uid) return;

    const q = query(collection(db, `chats/${chatId}/messages`), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const markMessagesAsRead = async () => {
      const unreadQuery = query(
        collection(db, `chats/${chatId}/messages`),
        where("read", "==", false),
        where("sender", "!=", user.uid)
      );
      const snapshot = await getDocs(unreadQuery);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.forEach((doc) => {
          batch.update(doc.ref, { read: true });
        });
        await batch.commit();
      }
    };

    markMessagesAsRead();

    return () => unsubscribe();
  }, [chatId, user?.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;

    const typingRef = collection(db, `chats/${chatId}/typing`);
    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      const typingNow = snapshot.docs
        .filter((doc) => doc.id !== user?.uid)
        .map((doc) => doc.data())
        .find((d) => d.isTyping && d.name);

      setTypingUsers(typingNow ? [typingNow] : []);
    });

    return () => unsubscribe();
  }, [chatId, user?.uid]);

  useEffect(() => {
    return () => {
      if (chatId && user?.uid) {
        setTypingStatus(chatId, user.uid, user.displayName || "Аноним", false);
      }
    };
  }, [chatId, user?.uid]);

  useEffect(() => {
    if (!chatId || !user?.uid) return;

    const unsub = onSnapshot(doc(db, "chats", chatId), async (docSnap) => {
      const data = docSnap.data();
      if (!data?.members) return;

      const otherId = data.members.find((uid) => uid !== user.uid);
      const otherRef = doc(db, "users", otherId);
      const otherSnap = await getDoc(otherRef);

      if (otherSnap.exists()) {
        const otherData = otherSnap.data();
        setOtherUser(otherData);
        setIsOnline(otherData.isOnline);
      }
    });

    return () => unsub();
  }, [chatId, user?.uid]);

  const sendMessage = async () => {
    if (!chatId || (!newMessage.trim() && !file) || !user?.uid) return;

    const messageData = {
      sender: user.uid,
      senderName: user.displayName,
      timestamp: serverTimestamp(),
      read: false,
    };

    if (newMessage.trim()) {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        ...messageData,
        text: newMessage.trim(),
        originalText: newMessage,
      });
    }

    if (file) {
      const storageRef = ref(storage, `chats/${chatId}/files/${file.name}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, `chats/${chatId}/messages`), {
        ...messageData,
        text: fileUrl,
        fileType,
      });
      setFile(null);
    }

    setNewMessage("");
    setFile(null);
    setTypingStatus(chatId, user.uid, user.displayName || "Аноним", false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (user?.uid && chatId) {
      setTypingStatus(chatId, user.uid, user.displayName || "Аноним", true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(chatId, user.uid, user.displayName || "Аноним", false);
      }, 3000);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.type.split("/")[0];
      setFile(file);
      setFileType(fileType);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage(newMessage + emojiData.emoji);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerChat}>
        <UserAvatar user={otherUser} />
        <div className={styles.info}>
          <div className={styles.name}>{otherUser?.displayName || "Пользователь"}</div>
          <div className={styles.status}>{isOnline ? "в сети" : "был недавно"}</div>
        </div>
      </div>

      <div className={styles.messages}>
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} isOwn={msg.sender === user?.uid} />
        ))}
        {typingUsers.length > 0 && (
          <div className={styles.typingStatus}>
            {typingUsers[0].name} печатает<span className={styles.dots}></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputWrapper}>
        <textarea
          className={styles.inputField}
          placeholder="Введите сообщение..."
          value={newMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        
        {/* Кнопка для открытия Emoji Picker */}
        <button
          className={styles.emojiButton}
          onClick={() => setShowEmojiPicker((prev) => !prev)}
        >
          😊
        </button>

        {/* Показываем Emoji Picker, если он активирован */}
        {showEmojiPicker && (
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            style={{
              position: "absolute",
              bottom: "70px",
              left: "10px",
              zIndex: 1000,
            }}
          />
        )}

        {/* Кнопка прикрепления файла */}
        <button
          className={styles.attachButton}
          onClick={() => document.querySelector('input[type="file"]').click()}
        >
          <MdAttachFile />
        </button>

        {/* Кнопка отправки сообщения */}
        <button
          className={styles.sendButton}
          onClick={sendMessage}
          disabled={!newMessage.trim() && !file}
        >
          <IoSend />
        </button>

        {/* Скрытый input для выбора файла */}
        <input
          type="file"
          accept="image/*,audio/*,video/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
