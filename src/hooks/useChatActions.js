import { useState } from 'react';
import { addDoc, getDocs, collection, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
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
      createdAt: serverTimestamp(),
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
  if (selectedUsers.length < 2) {
    alert('Выберите хотя бы двух пользователей');
    return false;
  }

  if (!groupName || groupName.trim() === '') {
    alert('Введите название группы');
    return false;
  }

  try {
    const memberIds = [user.uid, ...selectedUsers.map((u) => u.uid)];
    const docRef = await addDoc(collection(db, 'chats'), {
      name: groupName,
      members: memberIds,
      createdAt: serverTimestamp(),
    });

    onSelectChat({ id: docRef.id });
    return true;
  } catch (error) {
    console.error('Ошибка при создании группового чата:', error);
    alert('Не удалось создать группу');
    return false;
  }
};

  return {
    selectedUsers,
    setSelectedUsers,
    startNewChat,
    createGroupChat,
    resetUnreadCount,
    toggleUser,
  };
}