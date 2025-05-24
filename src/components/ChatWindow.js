"use client";

import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import Message from "./Message";
import UserAvatar from "./UserAvatar";
import styles from "@/styles/ChatWindow.module.css";

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

  const user = useSelector((state) => state.user.user);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;

    const q = query(collection(db, `chats/${chatId}/messages`), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [chatId]);

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
    if (!chatId || !newMessage.trim() || !user?.uid) return;

    await addDoc(collection(db, `chats/${chatId}/messages`), {
      text: newMessage.trim(),
      originalText: newMessage,
      sender: user.uid,
      senderName: user.displayName || "Аноним",
      timestamp: serverTimestamp(),
    });

    setNewMessage("");
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
        <button className={styles.sendButton} onClick={sendMessage}>
          Отправить
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
