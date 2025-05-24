import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export const getUserAvatar = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const avatarRef = ref(storage, `avatars/${userId}`);
    const avatarUrl = await getDownloadURL(avatarRef);
    return avatarUrl;
  } catch (error) {
    console.error('Ошибка получения аватара:', error);
    throw error;
  }
};
