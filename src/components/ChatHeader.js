import styles from "@/styles/ChatWindow.module.css";

const ChatHeader = ({ otherUser, darkMode, toggleDarkMode }) => (
  <div className={styles.header}>
    <img src={otherUser?.photoURL || "/default-avatar.png"} alt="Avatar" className={styles.avatar} />
    <span className={styles.userName}>{otherUser?.displayName || "Собеседник"}</span>
    <button onClick={toggleDarkMode} style={{ marginLeft: "auto" }}>
      {darkMode ? "🌞" : "🌙"}
    </button>
  </div>
);

export default ChatHeader;
