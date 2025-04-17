"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useStore } from '@/store/store';
import { getChat, updateChat } from '@/lib/chat';
import { getChats } from '@/lib/chat';
import { uploadAvatar } from '@/utils/getAvatar';
import TranslateComponent from '@/components/TranslateComponent';
import UserAvatar from '@/components/UserAvatar';

export default function ChatPage() {
  const router = useRouter();
  const { id } = router.query;
  const [chat, setChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const user = useStore((state) => state.user);

  useEffect(() => {
    if (id) {
      const fetchChat = async () => {
        try {
          const chatData = await getChat(id);
          setChat(chatData);
          setLoading(false);
        } catch (error) {
          console.error('Ошибка получения чата:', error);
        }
      };

      fetchChat();
    }
  }, [id]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    const updatedChat = {
      ...chat,
      messages: [...(chat.messages || []), { user: user.name, message: newMessage }],
    };

    try {
      await updateChat(id, updatedChat);
      setChat(updatedChat);
      setNewMessage('');
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Чат с {chat.name}</h1>
        <div className="space-y-4 mb-6">
          {chat.messages?.map((msg, index) => (
            <div key={index} className="flex items-start space-x-3">
              <UserAvatar name={msg.user} />
              <div className="text-gray-700">
                <p className="font-semibold">{msg.user}</p>
                <p>{msg.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-4">
          <input
            type="text"
            className="flex-1 p-2 border border-gray-300 rounded-lg"
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Отправить
          </button>
        </div>

        <div className="mt-6">
          <TranslateComponent />
        </div>
      </div>
    </div>
  );
}
