import { useEffect, useRef, useState } from "react";
import styles from "@/styles/ChatWindow.module.css";
import { FaReply } from "react-icons/fa";
import { MdEdit, MdDeleteOutline } from "react-icons/md";

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
  <span className={styles.contextItem}>
    <FaReply className={styles.reply} />
    Ответить
  </span>
</li>
<li
  onClick={() => {
    onEdit?.(selectedMessage);
    onClose();
  }}
>
  <span className={styles.contextItem}>
    <MdEdit className={styles.edit} />
    Редактировать
  </span>
</li>
<li
  onClick={() => {
    onDelete?.(selectedMessage.id);
    onClose();
  }}
>
  <span className={styles.contextItem}>
    <MdDeleteOutline className={styles.delete} />
    Удалить
  </span>
</li>
    </ul>
  );
};

export default ContextMenu;