import axios from 'axios';
import { getFirestoreApiUrl } from './firebase';

export const getChat = async (chatId) => {
  try {
    const response = await axios.get(`${getFirestoreApiUrl()}/chats/${chatId}`);
    return response.data.fields;
  } catch (error) {
    console.error('Ошибка получения чата:', error);
    throw error;
  }
};

export const addChat = async (chatId, chatData) => {
  try {
    const response = await axios.put(
      `${getFirestoreApiUrl()}/chats/${chatId}`,
      { fields: chatData }
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка добавления чата:', error);
    throw error;
  }
};

export const updateChat = async (chatId, chatData) => {
  try {
    const response = await axios.patch(
      `${getFirestoreApiUrl()}/chats/${chatId}`,
      { fields: chatData }
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка обновления чата:', error);
    throw error;
  }
};

export const deleteChat = async (chatId) => {
  try {
    await axios.delete(`${getFirestoreApiUrl()}/chats/${chatId}`);
  } catch (error) {
    console.error('Ошибка удаления чата:', error);
    throw error;
  }
};

export const getChats = async () => {
  try {
    const response = await axios.get(`${getFirestoreApiUrl()}/chats`);
    const chats = response.data.documents.map((doc) => ({ id: doc.name.split('/').pop(), ...doc.fields }));
    return chats;
  } catch (error) {
    console.error('Ошибка получения чатов:', error);
    throw error;
  }
};