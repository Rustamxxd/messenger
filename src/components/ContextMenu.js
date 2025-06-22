import { useEffect, useRef, useState } from "react";
import styles from "@/styles/ChatWindow.module.css";
import { BsReply } from "react-icons/bs";
import { MdOutlineModeEdit, MdDeleteOutline, MdContentCopy } from "react-icons/md";
import { useSelector } from "react-redux";
import { CheckCircleOutlined } from '@ant-design/icons';

const ContextMenu = ({ contextMenu, selectedMessage, onClose, onReply, onEdit, onDelete, onHide, onSelect, onCopyText }) => {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: contextMenu.y, left: contextMenu.x });
  const user = useSelector((state) => state.user.user);
  const isOwnMessage = selectedMessage?.sender === user?.uid;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const menu = menuRef.current;
    if (menu) {
      const { offsetWidth, offsetHeight } = menu;
      const newLeft = Math.min(contextMenu.x, window.innerWidth - offsetWidth - 8);
      const newTop = Math.min(contextMenu.y, window.innerHeight - offsetHeight - 8);
      setPosition({ left: newLeft, top: newTop });
    }
    if (contextMenu.visible) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [contextMenu]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsVisible(false);
        setTimeout(onClose, 200);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsVisible(false);
        setTimeout(onClose, 200);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const handleCopyContent = async () => {
    if (!selectedMessage) return;
    
    if (selectedMessage.fileType === 'image') {
      try {
        // Копируем изображение в буфер обмена
        const response = await fetch(selectedMessage.text);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        if (onCopyText) onCopyText();
        setIsVisible(false);
        setTimeout(onClose, 200);
      } catch (error) {
        console.error('Ошибка при копировании изображения:', error);
        // Fallback: копируем URL изображения
        navigator.clipboard.writeText(selectedMessage.text);
        if (onCopyText) onCopyText();
        setIsVisible(false);
        setTimeout(onClose, 200);
      }
    } else if (selectedMessage.text) {
      // Для текстовых сообщений копируем текст
      navigator.clipboard.writeText(selectedMessage.text);
      if (onCopyText) onCopyText();
      setIsVisible(false);
      setTimeout(onClose, 200);
    }
  };

  const getCopyText = () => {
    if (!selectedMessage) return 'Копировать';
    
    if (selectedMessage.fileType === 'image') {
      return 'Копировать изображение';
    } else {
      return 'Копировать текст';
    }
  };

  const shouldShowCopy = () => {
    if (!selectedMessage) return false;
    
    // Показываем копирование только для фото и текстовых сообщений
    return selectedMessage.fileType === 'image' || !selectedMessage.fileType;
  };

  if (!contextMenu.visible && !isVisible) return null;

  return (
    <ul
      ref={menuRef}
      className={
        styles.contextMenu +
        ' ' + (isVisible ? styles.contextMenuVisible : styles.contextMenuHidden)
      }
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <li
        onClick={() => {
          onReply?.(selectedMessage);
          onClose();
        }}
      >
        <span className={styles.contextItem}>
          <BsReply style={{fontSize: '20px', color: '#666'}} />
          Ответить
        </span>
      </li>
      {isOwnMessage && (
        <li
          onClick={() => {
            if (selectedMessage.fileType) {
              onReply?.(selectedMessage);
            } else {
              onEdit?.(selectedMessage);
            }
            setIsVisible(false);
            setTimeout(onClose, 200);
          }}
        >
          <span className={styles.contextItem}>
            <MdOutlineModeEdit style={{fontSize: '20px', color: '#666'}} />
            Редактировать
          </span>
        </li>
      )}
      {shouldShowCopy() && (
      <li
          onClick={handleCopyContent}
      >
        <span className={styles.contextItem}>
        <MdContentCopy  style={{fontSize: '20px', color: '#666'}}/>
            {getCopyText()}
        </span>
      </li>
      )}
      <li
        onClick={() => {
          onSelect?.(selectedMessage.id);
          onClose();
        }}
      >
        <span className={styles.contextItem}>
          <CheckCircleOutlined style={{fontSize: '19px', color: '#666'}} />
          Выбрать
        </span>
      </li>
      <li
        onClick={() => {
          if (isOwnMessage) {
            onDelete?.(selectedMessage.id, true);
          } else {
            onHide?.(selectedMessage.id);
          }
          onClose();
        }}
      >
        <span className={styles.contextItem} style={{color: 'red'}}>
          <MdDeleteOutline style={{fontSize: '20px', color: 'red'}} />
          {isOwnMessage ? "Удалить" : "Скрыть"}
        </span>
      </li>
    </ul>
  );
};

export default ContextMenu;