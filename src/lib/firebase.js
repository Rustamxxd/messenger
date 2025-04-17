import {
  initializeApp
} from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "firebase/storage";

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

export {
  auth,
  db,
  storage
};

export const registerUser = async (email, password, nickname) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, {
    displayName: nickname
  });

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email,
    nickname,
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

export const updateUserProfile = async (userId, {
  nickname,
  about,
  avatarUrl
}) => {
  const userRef = doc(db, "users", userId);
  await setDoc(
    userRef, {
      displayName: nickname,
      about,
      photoURL: avatarUrl,
    }, {
      merge: true
    }
  );
};

export const getUserProfile = async (userId) => {
  const userRef = doc(db, "users", userId);
  const userSnapshot = await getDoc(userRef);
  if (userSnapshot.exists()) {
    return userSnapshot.data();
  } else {
    return null;
  }
};

export const uploadAvatar = async (file) => {
  const avatarRef = ref(storage, `avatars/${file.name}`);
  const uploadTask = uploadBytesResumable(avatarRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {},
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};

// Новая функция для поиска или создания чата
export const createOrGetChat = async (userId1, userId2) => {
  const chatsRef = collection(db, "chats");

  const q = query(chatsRef, where("participants", "in", [
    [userId1, userId2],
    [userId2, userId1]
  ]));

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const existingChat = querySnapshot.docs[0];
    return existingChat.id;
  }

  const newChatRef = await addDoc(chatsRef, {
    participants: [userId1, userId2],
    createdAt: Date.now()
  });

  return newChatRef.id;
};