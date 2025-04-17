"use client";

import { useState } from "react";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import UserSearch from "@/components/UserSearch";
import { createOrGetChat } from "@/lib/firebase";
import { useStore } from "@/app/store/store";

export default function Home() {
  const { user } = useStore();
  const [selectedChat, setSelectedChat] = useState(null);

  const handleSelectUser = async (targetUser) => {
    const chatId = await createOrGetChat(user.uid, targetUser.uid);
    setSelectedChat({ id: chatId });
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/4 bg-gray-100 border-r p-4 flex flex-col">
        {/* Поиск пользователя */}
        <UserSearch onSelectUser={handleSelectUser} />

        {/* Список чатов */}
        <ChatList onSelectChat={setSelectedChat} />
      </div>

      <div className="flex-1 flex items-center justify-center bg-white">
        {selectedChat ? (
          <ChatWindow chatId={selectedChat.id} />
        ) : (
          <p className="text-gray-500 text-lg">Выберите чат или найдите пользователя</p>
        )}
      </div>
    </div>
  );
}
