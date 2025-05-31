import { useState } from 'react';
import { addDoc, getDocs, collection, updateDoc, doc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useChatActions(user, onSelectChat) {
  const [selectedUsers, setSelectedUsers] = useState([]);

  const startNewChat = async (targetUser, onSuccess) => {
    if (!user || !targetUser) return;

    const chatsSnapshot = await getDocs(collection(db, 'chats'));
    const allChats = chatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const existingChat = allChats.find(
      (chat) =>
        chat.members?.length === 2 &&
        chat.members.includes(user.uid) &&
        chat.members.includes(targetUser.uid)
    );
    
    if (existingChat) {
      onSelectChat(existingChat);
      onSuccess?.();
      return;
    }

    const docRef = await addDoc(collection(db, 'chats'), {
      name: `${user.displayName || user.email} & ${targetUser.displayName || targetUser.email}`,
      members: [user.uid, targetUser.uid],
      timestamp: serverTimestamp(),
    });

    onSelectChat({ id: docRef.id });
    onSuccess?.();
  };

  const resetUnreadCount = async (chatId) => {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`unreadCount_${user.uid}`]: 0,
    });
  };

  const toggleUser = (userToAdd) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.uid === userToAdd.uid)
        ? prev.filter((u) => u.uid !== userToAdd.uid)
        : [...prev, userToAdd]
    );
  };

  const createGroupChat = async (selectedUsers, groupName) => {
    try {
      if (selectedUsers.length < 2) {
        alert('Выберите хотя бы двух пользователей');
        return false;
      }

      const memberIds = [user.uid, ...selectedUsers.map((u) => u.uid)];
      const docRef = await addDoc(collection(db, 'chats'), {
        name: groupName,
        members: memberIds,
        timestamp: serverTimestamp(),
      });

      onSelectChat({ id: docRef.id });
      return true;
    } catch (error) {
      console.error('Ошибка при создании группового чата:', error);
      return false;
    }
  };

  const handleDeleteChat = async (chatId) => {
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    const chatData = chatDoc.data();

    const isLastUser = chatData.members.length === 1;
    const isAdmin = chatData.admins?.includes(user.uid);

    if (isLastUser || isAdmin) {
      await deleteDoc(chatRef);
      console.log(`Чат ${chatId} удален`);
    } else {
      const updatedMembers = chatData.members.filter((uid) => uid !== user.uid);
      await updateDoc(chatRef, { members: updatedMembers });
      console.log(`Пользователь ${user.uid} удален из чата ${chatId}`);
    }
  };

  return {
    selectedUsers,
    setSelectedUsers,
    startNewChat,
    createGroupChat,
    resetUnreadCount,
    toggleUser,
    handleDeleteChat,
  };
}
