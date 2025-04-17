import axios from 'axios';

export const getTranslatedText = async (text, sourceLang, targetLang) => {
  const apiKey = process.env.NEXT_PUBLIC_TRANSLATE_API_KEY;
  const endpoint = 'https://api-free.deepl.com/v2/translate';

  try {
    const response = await axios.post(endpoint, null, {
      params: {
        auth_key: apiKey,
        text: text,
        source_lang: sourceLang.toUpperCase(),
        target_lang: targetLang.toUpperCase(),
      },
    });

    return response.data.translations[0].text;
  } catch (error) {
    console.error('Ошибка при переводе:', error);
    throw error;
  }
};