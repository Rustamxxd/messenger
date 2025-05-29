import { collection, getDocs } from 'firebase/firestore';

export const loadUsers = async (db, userUid) => {
  const snapshot = await getDocs(collection(db, 'users'));
  const filteredUsers = snapshot.docs
    .map((doc) => ({ uid: doc.id, ...doc.data() }))
    .filter((u) => u.uid !== userUid);

  return filteredUsers;
};