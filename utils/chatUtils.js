import { doc, setDoc, deleteDoc } from "firebase/firestore";

export const setTypingStatus = async (db, chatId, userId, name, isTyping) => {
  const ref = doc(db, `chats/${chatId}/typing`, userId);
  try {
    if (isTyping) {
      await setDoc(ref, { name });
    } else {
      await deleteDoc(ref);
    }
  } catch (error) {
    console.warn("Typing status error:", error.message);
  }
};