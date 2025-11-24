import styles from './ChatBox.module.css';

const imgImage = "https://www.figma.com/api/mcp/asset/3d8e0cdd-ecdb-4f02-b256-ee2d85bad6ec";
const imgCode = "https://www.figma.com/api/mcp/asset/1453c2fc-6b55-4113-8550-24c95b6e4596";
const imgMic = "https://www.figma.com/api/mcp/asset/19ec87e1-d893-4947-8003-861e52580e32";
const imgArrow = "https://www.figma.com/api/mcp/asset/df0627ac-ba6b-421d-9701-e2fdb38facd6";

export default function ChatBox() {
  return (
    <div className={styles.chatBox}>
      <p className={styles.placeholder}>What would you like to know?</p>
      <div className={styles.controls}>
        <div className={styles.iconButtons}>
          <button className={styles.iconButton}>
            <img src={imgImage} alt="Image" className={styles.icon} />
          </button>
          <button className={styles.iconButton}>
            <img src={imgCode} alt="Code" className={styles.icon} />
          </button>
          <button className={styles.iconButton}>
            <img src={imgMic} alt="Mic" className={styles.icon} />
          </button>
        </div>
        <button className={styles.sendButton}>
          <img src={imgArrow} alt="Send" className={styles.icon} />
        </button>
      </div>
    </div>
  );
}

