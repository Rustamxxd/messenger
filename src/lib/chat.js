// src/lib/chat.js
import axios from 'axios';
import { getFirestoreApiUrl } from './firebase';

// Преобразование Firestore-объекта в обычный JS-объект
const parseFirestoreFields = (fields) => {
  const result = {};
  for (const [key, value] of Object.entries(fields)) {
    if ('stringValue' in value) result[key] = value.stringValue;
    else if ('integerValue' in value) result[key] = parseInt(value.integerValue, 10);
    else if ('arrayValue' in value) {
      result[key] = (value.arrayValue.values || []).map((v) =>
        'stringValue' in v ? v.stringValue : v
      );
    } else if ('mapValue' in value) {
      result[key] = parseFirestoreFields(value.mapValue.fields);
    } else {
      result[key] = value;
    }
  }
  return result;
};

// Преобразование JS-объекта в Firestore-формат
const toFirestoreFields = (obj) => {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') result[key] = { stringValue: value };
    else if (typeof value === 'number') result[key] = { integerValue: value };
    else if (Array.isArray(value)) {
      result[key] = {
        arrayValue: {
          values: value.map((v) =>
            typeof v === 'string'
              ? { stringValue: v }
              : { mapValue: { fields: toFirestoreFields(v) } }
          ),
        },
      };
    } else if (typeof value === 'object' && value !== null) {
      result[key] = { mapValue: { fields: toFirestoreFields(value) } };
    }
  }
  return result;
};

// Получить один чат
export const getChat = async (chatId) => {
  try {
    const response = await axios.get(`${getFirestoreApiUrl()}/chats/${chatId}`);
    return parseFirestoreFields(response.data.fields);
  } catch (error) {
    console.error('Ошибка получения чата:', error);
    throw error;
  }
};

// Добавить новый чат (put по ID)
export const addChat = async (chatId, chatData) => {
  try {
    const response = await axios.put(
      `${getFirestoreApiUrl()}/chats/${chatId}`,
      { fields: toFirestoreFields(chatData) }
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка добавления чата:', error);
    throw error;
  }
};

// Обновить чат (patch по ID)
export const updateChat = async (chatId, chatData) => {
  try {
    const response = await axios.patch(
      `${getFirestoreApiUrl()}/chats/${chatId}`,
      { fields: toFirestoreFields(chatData) }
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка обновления чата:', error);
    throw error;
  }
};

// Удалить чат
export const deleteChat = async (chatId) => {
  try {
    await axios.delete(`${getFirestoreApiUrl()}/chats/${chatId}`);
  } catch (error) {
    console.error('Ошибка удаления чата:', error);
    throw error;
  }
};

// Получить все чаты
export const getChats = async () => {
  try {
    const response = await axios.get(`${getFirestoreApiUrl()}/chats`);
    return response.data.documents.map((doc) => ({
      id: doc.name.split('/').pop(),
      ...parseFirestoreFields(doc.fields),
    }));
  } catch (error) {
    console.error('Ошибка получения чатов:', error);
    throw error;
  }
};
