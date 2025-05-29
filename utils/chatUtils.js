export const getUniqueChats = (chats) => {
  const uniqueChats = [];
  const seenMembers = new Set();

  chats.forEach((chat) => {
    const membersKey = chat.members.sort().join(',');

    if (!seenMembers.has(membersKey)) {
      seenMembers.add(membersKey);
      uniqueChats.push(chat);
    }
  });

  return uniqueChats;
};