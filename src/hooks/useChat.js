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

  // ————————————— Читаем сообщения —————————————
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
    const fetchChatInfo = async () => {
      if (!chatId || !user?.uid) return;

      try {
        const chatDocRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatDocRef);
        const chatData = chatDoc.data();

        if (!chatData) return;
        const participantIds = chatData.participants || chatData.members || [];
        const isAutoGroup = Array.isArray(participantIds) && participantIds.length > 2;
        const isGroupFlag = chatData.isGroup === true || isAutoGroup;

        if (isGroupFlag) {
         
          setOtherUser({
            id: chatDoc.id,
            displayName: chatData.name || 'Группа',
            isGroup: true,
            members: participantIds,
            photoURL: chatData.photoURL || null
          });
        } else {

          const otherId = participantIds.find((uid) => uid !== user.uid);
          if (otherId) {
            const otherSnap = await getDoc(doc(db, 'users', otherId));
            setOtherUser(otherSnap.data());
          }
        }
      } catch (err) {
        setError(err);
      }
    };

    fetchChatInfo();
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

  const sendMessage = async (text, file = null, replyTo = null, voice = null) => {
    if (!text.trim() && !file && !voice) return;

    const messageData = {
      sender: user.uid,
      timestamp: serverTimestamp(),
      read: false,
    };

    if (replyTo) {
      messageData.replyTo = {
        id: replyTo.id,
        text: replyTo.text || "",
        sender: replyTo.sender || null,
      };
    }

    if (voice) {
      const voiceRef = ref(storage, `chats/${chatId}/voice/${Date.now()}.webm`);
      await uploadBytes(voiceRef, voice);
      const url = await getDownloadURL(voiceRef);
      messageData.voice = url;
    }

    if (file) {
      const fileType = file.type?.split("/")[0];
      const fileRef = ref(storage, `chats/${chatId}/files/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      messageData.text = url;
      messageData.fileType = fileType;
    } else if (text.trim()) {
      messageData.text = text.trim();
    }

    await addDoc(collection(db, `chats/${chatId}/messages`), messageData);
  };

  const deleteMessage = async (messageId) => {
    try {
      await updateDoc(doc(db, `chats/${chatId}/messages`, messageId), {
        text: "[сообщение удалено]",
        deleted: true,
      });
    } catch (err) {
      setError(err);
    }
  };

  const updateMessage = async (messageId, newText) => {
    try {
      await updateDoc(doc(db, `chats/${chatId}/messages`, messageId), {
        text: newText,
        edited: true,
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
    handleTyping,
  };
};