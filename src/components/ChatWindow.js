"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuthState } from "../hooks/useAuth";
import Message from "./Message";
import styles from '@/styles/ChatWindow.module.css';

const ChatWindow = ({ chatId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user] = useAuthState(auth);
  const { translateText, targetLang } = useStore();

  useEffect(() => {
    if (!chatId) return;

    const q = query(collection(db, `chats/${chatId}/messages`), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    let finalText = newMessage;

    if (targetLang) {
      try {
        finalText = await translateText(newMessage, targetLang);
      } catch (error) {
        console.error("Ошибка перевода:", error);
      }
    }

    await addDoc(collection(db, `chats/${chatId}/messages`), {
      text: finalText,
      originalText: newMessage,
      sender: user.uid,
      senderName: user.displayName || "Аноним",
      timestamp: serverTimestamp(),
    });

    setNewMessage("");
  };

  return (
    <div className={styles.container}>
      <div className={styles.messages}>
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} isOwn={msg.sender === user?.uid} />
        ))}
      </div>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          className={styles.inputField}
          placeholder="Введите сообщение..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          className={styles.sendButton}
          onClick={sendMessage}
        >
          Отправить
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
