"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useStore } from "@/app/store/store";

export default function UserSearch({ onSelectUser }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const { user } = useStore();

  useEffect(() => {
    const fetchUsers = async () => {
      if (searchTerm.trim() === "") {
        setResults([]);
        return;
      }

      const q = query(
        collection(db, "users"),
        where("nickname", ">=", searchTerm),
        where("nickname", "<=", searchTerm + "\uf8ff")
      );

      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.uid !== user.uid) {
          users.push(data);
        }
      });
      setResults(users);
    };

    const delayDebounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  return (
    <div>
      <input
        type="text"
        placeholder="Поиск по нику"
        className="mb-2 w-full p-2 border rounded"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="space-y-1">
        {results.map((u) => (
          <div
            key={u.uid}
            onClick={() => onSelectUser(u)}
            className="cursor-pointer p-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            {u.nickname}
          </div>
        ))}
      </div>
    </div>
  );
}