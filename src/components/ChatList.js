"use client";


import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import multiavatar from "@multiavatar/multiavatar";

export default function ChatList({ onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "chats"), (snapshot) => {
      setChats(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateChat = async () => {
    const chatName = prompt("Введите название чата:");
    if (!chatName) return;

    try {
      await addDoc(collection(db, "chats"), {
        name: chatName,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Ошибка создания чата:", error);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="🔍 Поиск чатов..."
        className="w-full p-2 mb-3 border rounded"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <button
        className="w-full bg-blue-500 text-white p-2 rounded mb-3 hover:bg-blue-600 transition"
        onClick={handleCreateChat}
      >
        ➕ Создать чат
      </button>
      <div className="space-y-3">
        {filteredChats.map((chat) => (
          <div
            key={chat.id}
            className="flex items-center p-3 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-200 transition"
            onClick={() => onSelectChat(chat)}
          >
            <div
              dangerouslySetInnerHTML={{ __html: multiavatar(chat.name) }}
              className="w-12 h-12"
            />
            <div className="ml-3">
              <p className="font-medium">{chat.name}</p>
              <p className={`text-sm ${chat.online ? "text-green-500" : "text-gray-400"}`}>
                {chat.online ? "В сети" : "Не в сети"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
