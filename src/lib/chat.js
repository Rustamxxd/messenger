import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export const getChat = async (chatId) => {
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) throw new Error("Чат не найден");
  return { id: chatSnap.id, ...chatSnap.data() };
};

export const addChat = async (chatData) => {
  const chatsRef = collection(db, "chats");
  const newChatRef = await addDoc(chatsRef, chatData);
  return newChatRef.id;
};

export const updateChat = async (chatId, chatData) => {
  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, chatData);
};

export const deleteChat = async (chatId) => {
  const chatRef = doc(db, "chats", chatId);
  await deleteDoc(chatRef);
};

export const getChats = async () => {
  const chatsRef = collection(db, "chats");
  const querySnapshot = await getDocs(chatsRef);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getChatsForUser = async (userId) => {
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("participants", "array-contains", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
