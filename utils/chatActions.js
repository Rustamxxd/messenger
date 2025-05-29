export const startNewChat = async (user, targetUser, db) => {
  if (!user || !targetUser) return;

  const existingChat = chats.find(
    (chat) =>
      chat.members?.length === 2 &&
      chat.members.includes(user.uid) &&
      chat.members.includes(targetUser.uid)
  );
  if (existingChat) {
    onSelectChat(existingChat);
    setMode(null);
    return;
  }

  const docRef = await addDoc(collection(db, 'chats'), {
    name: `${user.displayName || user.email} & ${targetUser.displayName || targetUser.email}`,
    members: [user.uid, targetUser.uid],
    createdAt: serverTimestamp(),
  });

  onSelectChat({ id: docRef.id });
  setMode(null);
};

export const createGroupChat = async (selectedUsers, groupName, db) => {
  if (selectedUsers.length < 2) return alert('Выберите хотя бы двух пользователей');
  const memberIds = [user.uid, ...selectedUsers.map((u) => u.uid)];
  const docRef = await addDoc(collection(db, 'chats'), {
    name: groupName,
    members: memberIds,
    createdAt: serverTimestamp(),
  });

  onSelectChat({ id: docRef.id });
  setMode(null);
  setSelectedUsers([]);
};

export const toggleUser = (selectedUsers, userToAdd) => {
  setSelectedUsers((prev) =>
    prev.some((u) => u.uid === userToAdd.uid)
      ? prev.filter((u) => u.uid !== userToAdd.uid)
      : [...prev, userToAdd]
  );
};