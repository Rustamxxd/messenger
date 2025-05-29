import { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useUsers(user) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const currentUserUid = user.uid;

      const filteredUsers = snapshot.docs
        .map((doc) => ({ uid: doc.id, ...doc.data() }))
        .filter((u) => u.uid !== currentUserUid);

      setUsers(filteredUsers);
    } finally {
      setLoading(false);
    }
  };

  return { users, loadUsers, loading };
}