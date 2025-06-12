const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.updateLastMessageAndUnread = onDocumentCreated(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    const messageData = event.data?.data();
    const chatId = event.params.chatId;

    if (!messageData || !chatId) return null;

    const chatRef = admin.firestore().doc(`chats/${chatId}`);
    const chatSnap = await chatRef.get();
    const chatData = chatSnap.data();
    const members = chatData?.members || [];

    const updateData = {
      lastMessage: {
        text: messageData.text,
        sender: messageData.sender,
        senderName: messageData.senderName,
        timestamp: messageData.timestamp || admin.firestore.Timestamp.now(),
      },
    };

    // Only increment unread count for other users
    members.forEach((uid) => {
      if (uid !== messageData.sender) {
        updateData[`unreadCount_${uid}`] = admin.firestore.FieldValue.increment(1);
      }
    });

    await chatRef.update(updateData);

    return null;
  }
);