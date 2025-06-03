import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { db, storage } from '@/lib/firebase';
import { 
  collection, query, orderBy, onSnapshot,
  doc, getDoc, addDoc, serverTimestamp,
  deleteDoc, updateDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { setTypingStatus } from '../../utils/chatUtils';

export const useChat = (chatId) => {
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const user = useSelector((state) => state.user.user);

  useEffect(() => {
    if (!chatId || !user?.uid) return;

    setLoading(true);
    const messagesQuery = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('timestamp')
    );

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribeMessages();
  }, [chatId, user?.uid]);

  useEffect(() => {
    const fetchOtherUser = async () => {
      if (!chatId || !user?.uid) return;
      
      try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        const members = chatDoc.data()?.members || [];
        const otherId = members.find((uid) => uid !== user.uid);
        
        if (otherId) {
          const otherSnap = await getDoc(doc(db, 'users', otherId));
          setOtherUser(otherSnap.data());
        }
      } catch (err) {
        setError(err);
      }
    };

    fetchOtherUser();
  }, [chatId, user?.uid]);

  useEffect(() => {
    if (!chatId || !user?.uid) return;

    const typingRef = collection(db, `chats/${chatId}/typing`);
    const unsubscribeTyping = onSnapshot(typingRef, (snapshot) => {
      const typers = snapshot.docs
        .filter((doc) => doc.id !== user.uid)
        .map((doc) => doc.data().name);
      setTypingUsers(typers);
    });

    return () => unsubscribeTyping();
  }, [chatId, user?.uid]);

  useEffect(() => {
  const cleanupTyping = async () => {
    if (chatId && user?.uid) {
      await setTypingStatus(db, chatId, user.uid, user.displayName, false);
    }
  };

  window.addEventListener("beforeunload", cleanupTyping);
  return () => {
    cleanupTyping();
    window.removeEventListener("beforeunload", cleanupTyping);
  };
}, [chatId, user?.uid]);

  const sendMessage = async (text, file = null) => {
    if (!text.trim() && !file) return;

    try {
      const messageData = {
        sender: user.uid,
        text: text.trim(),
        timestamp: serverTimestamp(),
        read: false,
      };

      if (file) {
        const storageRef = ref(storage, `chats/${chatId}/files/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        messageData.text = url;
        messageData.fileType = file.type.split('/')[0];
      }

      await addDoc(collection(db, `chats/${chatId}/messages`), messageData);
    } catch (err) {
      setError(err);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await deleteDoc(doc(db, `chats/${chatId}/messages`, messageId));
    } catch (err) {
      setError(err);
    }
  };

  const updateMessage = async (messageId, newText) => {
    try {
      await updateDoc(doc(db, `chats/${chatId}/messages`, messageId), {
        text: newText,
        edited: true
      });
    } catch (err) {
      setError(err);
    }
  };

  const handleTyping = (isTyping) => {
    if (!chatId || !user?.uid) return;
    setTypingStatus(db, chatId, user.uid, user.displayName, isTyping);
  };
  

  return {
    messages,
    otherUser,
    typingUsers,
    loading,
    error,
    sendMessage,
    deleteMessage,
    updateMessage,
    handleTyping
  };
};