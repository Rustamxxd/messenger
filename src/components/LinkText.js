import React from 'react';
import styles from '@/styles/Message.module.css';

const LinkText = ({ text }) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  const words = text.split(' ');
  
  return words.map((word, index) => {

    let isLink = false;
    let href = word;
    let displayText = word;

    if (word.startsWith('@')) {
      href = word.substring(1);
      displayText = word;
      isLink = true;
    }

    if (word.includes('http') || word.includes('www.') || 
        (word.includes('.com') || word.includes('.ru') || word.includes('.org') || word.includes('.net'))) {
      isLink = true;
    }
    
    if (isLink) {

      if (href.startsWith('www.')) {
        href = 'https://' + href;
      }

      else if (!href.startsWith('http')) {
        href = 'https://' + href;
      }

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

    return index < words.length - 1 ? word + ' ' : word;
  });
};

export default LinkText; 