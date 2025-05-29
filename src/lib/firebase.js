import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };

export const registerUser = async (email, password, displayName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName });
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    photoURL: user.photoURL || "",
  });

  return user;
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Ошибка входа:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Ошибка выхода:", error);
    throw error;
  }
};

export const updateUserProfile = async (userId, updates, currentUser = auth.currentUser) => {
  const userRef = doc(db, "users", userId);

  await setDoc(userRef, updates, { merge: true });

  if (currentUser && currentUser.uid === userId) {
    await updateProfile(currentUser, {
      displayName: updates.displayName,
      photoURL: updates.photoURL,
    });
  }
};

export const getUserProfile = async (userId) => {
  const userRef = doc(db, "users", userId);
  const userSnapshot = await getDoc(userRef);
  return userSnapshot.exists() ? userSnapshot.data() : null;
};

export const uploadAvatar = async (file) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Пользователь не авторизован");

  const fileExt = file.name.split(".").pop();
  const filePath = `avatars/${currentUser.uid}.${fileExt}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
};

export const createOrGetChat = async (userId1, userId2) => {
  const chatsRef = collection(db, "chats");

  const q = query(chatsRef, where("participants", "array-contains", userId1));
  const querySnapshot = await getDocs(q);

  const chatDoc = querySnapshot.docs.find(doc => {
    const participants = doc.data().participants || [];
    return participants.includes(userId2) && participants.length === 2;
  });

  if (chatDoc) return chatDoc.id;
  const newChatRef = await addDoc(chatsRef, {
    participants: [userId1, userId2],
    createdAt: Date.now(),
  });

  return newChatRef.id;
};

export const getChatsForUser = async (userId) => {
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("participants", "array-contains", userId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};
