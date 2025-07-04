import { useState } from 'react';
import {
  addDoc,
  getDocs,
  collection,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  query,
  where
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

    // Сброс локального счётчика
    await updateDoc(chatRef, {
      [`unreadCount_${user.uid}`]: 0,
    });

    // Отметим непрочитанные сообщения как прочитанные
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('readBy', 'not-in', [user.uid]));

    try {
      const snapshot = await getDocs(q);
      const updates = snapshot.docs.map(docSnap => {
        const msg = docSnap.data();
        const readBy = msg.readBy || [];
        if (!readBy.includes(user.uid)) {
          return updateDoc(doc(messagesRef, docSnap.id), {
            readBy: [...readBy, user.uid],
          });
        }
        return null;
      });
      await Promise.all(updates.filter(Boolean));
    } catch (err) {
      console.error('Ошибка при обновлении readBy:', err);
    }
  };

  const toggleUser = (userToAdd) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.uid === userToAdd.uid)
        ? prev.filter((u) => u.uid !== userToAdd.uid)
        : [...prev, userToAdd]
    );
  };

  // Функция для загрузки group avatar
  async function uploadGroupAvatar(file) {
    const fileExt = file.name.split('.').pop();
    const filePath = `group_avatars/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  const createGroupChat = async (selectedUsers, groupName, groupAvatar, groupDescription) => {
    try {
      if (selectedUsers.length < 2) {
        return 'notEnoughUsers';
      }
      let photoURL = null;
      if (groupAvatar) {
        photoURL = await uploadGroupAvatar(groupAvatar);
      }
      const safeGroupName = groupName && groupName.trim() ? groupName.trim() : 'Групповой чат';
      const members = [
        {
          id: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'owner',
        },
        ...selectedUsers.map(u => ({
          id: u.uid,
          displayName: u.displayName,
          photoURL: u.photoURL,
          role: 'member',
        }))
      ];
      await addDoc(collection(db, 'chats'), {
        name: safeGroupName,
        members,
        photoURL,
        description: groupDescription || '',
        timestamp: serverTimestamp(),
        ownerId: user.uid,
        isGroup: true,
      });
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

  const handleDeleteChatForAll = async (chatId) => {
    const chatRef = doc(db, 'chats', chatId);
    // Удаляем все сообщения из подколлекции
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);
    const deletePromises = messagesSnapshot.docs.map((msgDoc) => deleteDoc(msgDoc.ref));
    await Promise.all(deletePromises);
    await deleteDoc(chatRef);
    console.log(`Чат ${chatId} удален для всех`);
  };

  return {
    selectedUsers,
    setSelectedUsers,
    startNewChat,
    createGroupChat,
    resetUnreadCount,
    toggleUser,
    handleDeleteChat,
    handleDeleteChatForAll,
  };
}