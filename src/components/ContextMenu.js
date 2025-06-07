import { useEffect, useRef, useState } from "react";
import styles from "@/styles/ChatWindow.module.css";

const ContextMenu = ({ contextMenu, selectedMessage, onClose, onReply, onEdit, onDelete }) => {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: contextMenu.y, left: contextMenu.x });

  useEffect(() => {
    const menu = menuRef.current;
    if (menu) {
      const { offsetWidth, offsetHeight } = menu;
      const newLeft = Math.min(contextMenu.x, window.innerWidth - offsetWidth - 8);
      const newTop = Math.min(contextMenu.y, window.innerHeight - offsetHeight - 8);
      setPosition({ left: newLeft, top: newTop });
    }
  }, [contextMenu]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!contextMenu.visible || !selectedMessage) return null;

  return (
    <ul
      ref={menuRef}
      className={styles.contextMenu}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <li
        onClick={() => {
          onReply?.(selectedMessage);
          onClose();
        }}
      >
        ↩️ Ответить
      </li>
      <li
        onClick={() => {
          onEdit?.(selectedMessage);
          onClose();
        }}
      >
        ✏️ Редактировать
      </li>
      <li
        onClick={() => {
          onDelete?.(selectedMessage.id);
          onClose();
        }}
      >
        🗑️ Удалить
      </li>
    </ul>
  );
};

export default ContextMenu;