"use client";

import { useState } from 'react';
import { useStore } from '../app/store/store';

const TranslateComponent = () => {
  const [text, setText] = useState('');
  const translatedText = useStore((state) => state.translatedText);
  const setTranslatedText = useStore((state) => state.setTranslatedText);

  const handleTranslate = async () => {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLanguage: 'EN',
      }),
    });
    const data = await response.json();
    setTranslatedText(data.translation);
  };

  return (
    <div className="mt-6 space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Введите текст для перевода"
        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleTranslate}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Перевести
      </button>
      {translatedText && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-700">Перевод: <span className="font-semibold">{translatedText}</span></p>
        </div>
      )}
    </div>
  );
};

export default TranslateComponent;