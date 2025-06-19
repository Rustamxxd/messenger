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

  const handleCopyText = () => {
    if (selectedMessage?.text) {
      navigator.clipboard.writeText(selectedMessage.text);
      if (onCopyText) onCopyText();
      setIsVisible(false);
      setTimeout(onClose, 200);
    }
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
          }}
        >
          <span className={styles.contextItem}>
            <MdOutlineModeEdit style={{fontSize: '20px', color: '#666'}} />
            Редактировать
          </span>
        </li>
      )}
      <li
        onClick={selectedMessage && !['image','video','audio'].includes(selectedMessage.fileType) && selectedMessage.text ? handleCopyText : undefined}
        className={selectedMessage && (!selectedMessage.text || ['image','video','audio'].includes(selectedMessage.fileType)) ? styles.contextMenuCopyDisabled : undefined}
      >
        <span className={styles.contextItem}>
        <MdContentCopy  style={{fontSize: '20px', color: '#666'}}/>
          Копировать текст
        </span>
      </li>
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