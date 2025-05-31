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
      
      if (!uniqueChatsMap.has(key) || 
          (chat.lastMessage?.timestamp?.seconds > uniqueChatsMap.get(key).lastMessage?.timestamp?.seconds)) {
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
            usersMap[doc.id] = doc.data();
          });

          const enrichedChats = await Promise.all(
            getUniqueChats(userChats).map(async (chat) => {
              const isGroup = chat.members.length > 2;
              let displayName, photoURL;

              if (isGroup) {
                displayName = chat.name || 'Групповой чат';
                photoURL = null;
              } else {
                const otherUserId = chat.members.find(id => id !== user.uid);
                const otherUser = usersMap[otherUserId];
                displayName = otherUser?.displayName || otherUser?.email || 'Unknown';
                photoURL = otherUser?.photoURL || null;
              }

              const messagesQuery = query(
                collection(db, 'chats', chat.id, 'messages'),
                orderBy('timestamp', 'desc'),
                limit(1)
                );
              const messagesSnapshot = await getDocs(messagesQuery);
              const lastMessage = messagesSnapshot.docs[0]?.data();

              const unreadQuery = query(
                collection(db, 'chats', chat.id, 'messages'),
                where('read', '==', false),
                where('sender', '!=', user.uid)
              );
              const unreadSnapshot = await getDocs(unreadQuery);
              const unreadCount = unreadSnapshot.size;

              return {
                ...chat,
                displayName,
                photoURL,
                lastMessage,
                unreadCount,
                isGroup
              };
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
        console.error('Error loading chats:', err);
        setError(err);
        setLoading(false);
      }
    };
    fetchChats();

    return () => unsubscribe && unsubscribe();
  }, [user?.uid]);

  return { chats, loading, error };
}
