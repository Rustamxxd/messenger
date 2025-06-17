import React from 'react';
import styles from '@/styles/Message.module.css';

const LinkText = ({ text }) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Альтернативный подход - ищем ссылки вручную
  const words = text.split(' ');
  
  return words.map((word, index) => {
    // Проверяем, является ли слово ссылкой
    let isLink = false;
    let href = word;
    let displayText = word;
    
    // Убираем @ из начала, если есть
    if (word.startsWith('@')) {
      href = word.substring(1);
      displayText = word;
      isLink = true;
    }
    
    // Проверяем различные форматы ссылок
    if (word.includes('http') || word.includes('www.') || 
        (word.includes('.com') || word.includes('.ru') || word.includes('.org') || word.includes('.net'))) {
      isLink = true;
    }
    
    if (isLink) {
      // Добавляем протокол для www ссылок
      if (href.startsWith('www.')) {
        href = 'https://' + href;
      }
      // Добавляем протокол для доменов без www и без http
      else if (!href.startsWith('http')) {
        href = 'https://' + href;
      }
      // Исправляем неполные протоколы
      if (href.includes('https:/') && !href.includes('https://')) {
        href = href.replace('https:/', 'https://');
      }
      if (href.includes('http:/') && !href.includes('http://')) {
        href = href.replace('http:/', 'http://');
      }

      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.clickableLink}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(href, '_blank', 'noopener,noreferrer');
          }}
        >
          {displayText}
        </a>
      );
    }
    
    // Возвращаем обычное слово с пробелом
    return index < words.length - 1 ? word + ' ' : word;
  });
};

export default LinkText; 