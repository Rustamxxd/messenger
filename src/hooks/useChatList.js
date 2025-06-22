import { useEffect, useState } from 'react';
import { collection, onSnapshot, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useChatList(user) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getUniqueChats = (chats) => {
    const uniqueChatsMap = new Map();

    chats.forEach(chat => {
      const chatKey = chat.members.sort().join('_');
      const key = chat.members.length > 2 ? chat.id : chatKey;

      if (
        !uniqueChatsMap.has(key) ||
        (chat.lastMessage?.timestamp?.seconds >
          uniqueChatsMap.get(key).lastMessage?.timestamp?.seconds)
      ) {
        uniqueChatsMap.set(key, chat);
      }
    });

    return Array.from(uniqueChatsMap.values());
  };

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let unsubscribe;

    const fetchChats = async () => {
      try {
        unsubscribe = onSnapshot(collection(db, 'chats'), async (snapshot) => {
          const allChats = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          const userChats = allChats.filter(chat =>
            chat.members?.includes(user.uid)
          );

          const usersSnapshot = await getDocs(collection(db, 'users'));
          const usersMap = {};
          usersSnapshot.forEach(doc => {
            usersMap[doc.id] = { uid: doc.id, ...doc.data() };
          });

          const enrichedChats = await Promise.all(
            getUniqueChats(userChats).map(async (chat) => {
              const isGroup = chat.members.length > 2;
              let displayName, photoURL;

              const allMessagesSnapshot = await getDocs(
                collection(db, 'chats', chat.id, 'messages')
              );
              const allMessages = allMessagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

              const lastMessage = allMessages.length > 0
                ? allMessages.reduce((a, b) => (a.timestamp?.seconds > b.timestamp?.seconds ? a : b))
                : null;

              if (lastMessage) {
                if (!lastMessage.sender) {
                  lastMessage.sender = lastMessage.senderId || lastMessage.authorId || lastMessage.userId || null;
                }
              }

              const otherUserId = !isGroup ? chat.members.find(id => id !== user.uid) : null;

              let checkmarkStatus = 0;
              if (lastMessage && lastMessage.sender === user.uid) {
                if (isGroup) {
                  const others = chat.members.filter(id => id !== user.uid);
                  const allRead = others.every(id => lastMessage.readBy?.includes(id));
                  checkmarkStatus = allRead ? 2 : 1;
                } else if (otherUserId) {
                  checkmarkStatus = lastMessage.readBy?.includes(otherUserId) ? 2 : 1;
                }
              }

              let unreadForOther = 0;
              if (otherUserId) {
                unreadForOther = allMessages.filter(
                  (msg) => msg.sender === user.uid && !(msg.readBy || []).includes(otherUserId)
                ).length;
              }

              let unreadCount = 0;
              allMessages.forEach((msg) => {
                const isUnread = msg.sender !== user.uid && !msg.readBy?.includes(user.uid);
                if (isUnread) unreadCount += 1;
              });

              if (isGroup) {
                displayName = chat.name || 'Групповой чат';
                photoURL = chat.photoURL || null;
                
                const groupMembers = chat.members.map(memberId => {
                  const memberData = usersMap[memberId] || {};
                  return {
                    id: memberId,
                    displayName: memberData.displayName || memberData.email || 'Участник',
                    photoURL: memberData.photoURL,
                    lastSeen: memberData.lastSeen || null,
                    status: memberData.status,
                    role: chat.ownerId === memberId ? 'owner' : (chat.admins?.includes(memberId) ? 'admin' : 'member')
                  };
                });
                
                return {
                  ...chat,
                  displayName,
                  photoURL,
                  members: groupMembers,
                  lastMessage,
                  unreadCount,
                  unreadForOther,
                  checkmarkStatus,
                  isGroup
                };
              } else {
                const otherUserId = chat.members.find(id => id !== user.uid);
                const otherUser = usersMap[otherUserId] || {};
                
                return {
                  ...chat,
                  ...otherUser,
                  displayName: otherUser.displayName || otherUser.email || 'Неизвестный',
                  photoURL: otherUser.photoURL || null,
                  lastMessage,
                  unreadCount,
                  unreadForOther,
                  checkmarkStatus,
                  isGroup
                };
              }
            })
          );

          enrichedChats.sort((a, b) => {
            const aTime = a.lastMessage?.timestamp?.seconds || a.timestamp?.seconds || 0;
            const bTime = b.lastMessage?.timestamp?.seconds || b.timestamp?.seconds || 0;
            return bTime - aTime;
          });

          setChats(enrichedChats);
          setLoading(false);
        });
      } catch (err) {
        console.error('Ошибка загрузки чатов:', err);
        setError(err);
        setLoading(false);
      }
    };

    fetchChats();
    return () => unsubscribe && unsubscribe();
  }, [user?.uid]);

  return { chats, loading, error };
}