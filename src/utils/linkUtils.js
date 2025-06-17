// Функция для обнаружения и обработки ссылок в тексте
export const processLinks = (text) => {
  if (!text || typeof text !== 'string') return text;

  // Простое регулярное выражение для поиска URL
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Добавляем текст перед ссылкой
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
        key: parts.length
      });
    }
    
    // Добавляем ссылку
    parts.push({
      type: 'link',
      content: match[0],
      key: parts.length
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Добавляем оставшийся текст
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
      key: parts.length
    });
  }
  
  return parts.length > 0 ? parts : [{ type: 'text', content: text, key: 0 }];
};

// Функция для рендеринга текста с ссылками
export const renderTextWithLinks = (text, styles) => {
  if (!text || typeof text !== 'string') return text;
  
  console.log('renderTextWithLinks called with:', text); // Отладка
  
  const parts = processLinks(text);
  console.log('Processed parts:', parts); // Отладка
  
  return parts.map((part) => {
    if (part.type === 'link') {
      console.log('Rendering link:', part.content); // Отладка
      return (
        <a
          key={part.key}
          href={part.content}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.messageLink}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Link clicked:', part.content); // Отладка
          }}
          style={{
            color: '#0088cc',
            textDecoration: 'none',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {part.content}
        </a>
      );
    } else {
      return part.content;
    }
  });
}; 