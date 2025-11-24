import { useState } from 'react';
import styles from './Sidebar.module.css';

const imgMenu = "https://www.figma.com/api/mcp/asset/d93b1662-2b6f-4e14-b1d7-51e827954f80";
const imgPlus = "https://www.figma.com/api/mcp/asset/f6beab8b-a935-4630-b842-9457988a8796";
const imgSearch = "https://www.figma.com/api/mcp/asset/01b94121-363b-46b8-a66f-282bf993abb1";
const imgAvatar = "https://www.figma.com/api/mcp/asset/3d8e0cdd-ecdb-4f02-b256-ee2d85bad6ec";

const chatHistory = [
  "Analog Clock React app",
  "Simple Design System",
  "Figma variable planning",
  "OKCLH token algorithm",
  "Component naming advice"
];

export default function Sidebar() {
  const [selectedChat, setSelectedChat] = useState(0);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.topSection}>
        <div className={styles.header}>
          <button className={styles.menuButton}>
            <img src={imgMenu} alt="Menu" className={styles.icon} />
          </button>
          <h2 className={styles.title}>Flippy chats</h2>
          <button className={styles.plusButton}>
            <img src={imgPlus} alt="Add" className={styles.icon} />
          </button>
        </div>
        <div className={styles.searchBox}>
          <img src={imgSearch} alt="Search" className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search" 
            className={styles.searchInput}
          />
        </div>
        <div className={styles.chatsSection}>
          <p className={styles.sectionTitle}>Chats</p>
          <div className={styles.chatList}>
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`${styles.chatItem} ${selectedChat === index ? styles.active : ''}`}
                onClick={() => setSelectedChat(index)}
              >
                {chat}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.userSection}>
        <img src={imgAvatar} alt="Avatar" className={styles.avatar} />
        <span className={styles.userEmail}>Miya@gmail.com</span>
      </div>
    </aside>
  );
}

