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

    members.forEach((uid) => {
      if (uid !== messageData.sender) {
        updateData[`unreadCount_${uid}`] = admin.firestore.FieldValue.increment(1);
      }
    });

    await chatRef.update(updateData);

    return null;
  }
);

exports.sendGroupMessageNotification = onDocumentCreated(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    const messageData = event.data?.data();
    const chatId = event.params.chatId;

    if (!messageData || !chatId) return null;

    const chatRef = admin.firestore().doc(`chats/${chatId}`);
    const chatSnap = await chatRef.get();
    const chatData = chatSnap.data();
    const members = chatData?.members || [];

    for (const member of members) {
      const uid = typeof member === "string" ? member : member.id;
      if (uid === messageData.sender) continue;

      const notifRef = admin.firestore().doc(`users/${uid}/groupSettings/${chatId}`);
      const notifSnap = await notifRef.get();
      console.log(`Пользователь: ${uid}, chatId: ${chatId}, notifications:`, notifSnap.exists ? notifSnap.data().notifications : 'нет документа');
      if (notifSnap.exists && notifSnap.data().notifications === false) {
        console.log(`Уведомления выключены для пользователя ${uid} в чате ${chatId}`);
        continue;
      }

      const userRef = admin.firestore().doc(`users/${uid}`);
      const userSnap = await userRef.get();
      const fcmToken = userSnap.data()?.fcmToken;
      if (!fcmToken) {
        console.log(`Нет fcmToken для пользователя ${uid}`);
        continue;
      }

      const payload = {
        notification: {
          title: chatData.name || "Новое сообщение",
          body: messageData.text || "Вам отправили сообщение",
        },
        data: {
          chatId: chatId,
          senderId: messageData.sender,
        },
      };

      try {
        await admin.messaging().send({
          token: fcmToken,
          ...payload,
        });
        console.log(`Push отправлен пользователю ${uid} для чата ${chatId}`);
      } catch (e) {
        console.error("Ошибка отправки FCM:", e);
      }
    }

    return null;
  }
);