const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.updateLastMessageAndUnread = onDocumentCreated(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    const messageData = event.data;
    const chatId = event.params.chatId;

    const chatRef = admin.firestore().doc(`chats/${chatId}`);

    const updateData = {
      lastMessage: {
        text: messageData.text,
        senderId: messageData.senderId,
        createdAt: messageData.createdAt,
      },
    };

    messageData.members.forEach((uid) => {
      if (uid !== messageData.senderId) {
        updateData[`unreadCount_${uid}`] = admin.firestore.FieldValue.increment(1);
      }
    });

    await chatRef.update(updateData);

    return null;
  }
);