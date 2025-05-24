import { useState, useEffect } from 'react';
import { getChats, getChat, addChat, updateChat, deleteChat } from '../lib/firebase';

export function useChats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const chats = await getChats();
        setChats(chats);
      } catch (error) {
        console.error('Ошибка при получении чатов:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const createChat = async (chatId, chatData) => {
    try {
      await addChat(chatId, chatData);
      setChats(prevChats => [...prevChats, { id: chatId, ...chatData }]);
    } catch (error) {
      console.error('Ошибка при создании чата:', error);
    }
  };

  const editChat = async (chatId, chatData) => {
    try {
      await updateChat(chatId, chatData);
      setChats(prevChats =>
        prevChats.map(chat => (chat.id === chatId ? { ...chat, ...chatData } : chat))
      );
    } catch (error) {
      console.error('Ошибка при обновлении чата:', error);
    }
  };

  const removeChat = async (chatId) => {
    try {
      await deleteChat(chatId);
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Ошибка при удалении чата:', error);
    }
  };

  return { chats, loading, createChat, editChat, removeChat, };
}

export function useChatById(chatId) {
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const chat = await getChat(chatId);
        setChat(chat);
      } catch (error) {
        console.error('Ошибка при получении чата:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, [chatId]);

  return { chat, loading, };
}