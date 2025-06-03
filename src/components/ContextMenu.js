import styles from "@/styles/ChatWindow.module.css";

const ContextMenu = ({ contextMenu, selectedMessage, onClose, onReply, onEdit, onDelete }) => {
  if (!contextMenu.visible || !selectedMessage) return null;

  return (
    <ul className={styles.contextMenu} style={{ top: contextMenu.y, left: contextMenu.x }}>
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
          onEdit?.(selectedMessage.id, selectedMessage.text); // при редактировании откроем UI в Message
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
