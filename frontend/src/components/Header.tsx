import styles from './Header.module.css';

interface HeaderProps {
  isLoggedIn?: boolean;
}

export default function Header({ isLoggedIn = false }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <img 
            src="https://www.figma.com/api/mcp/asset/e4dc93cd-bef8-48fe-b81c-d4e7430cbf99" 
            alt="MELO.AI Logo" 
            className={styles.logoImage}
          />
          <span className={styles.logoText}>MELO.AI</span>
        </div>
        <nav className={styles.nav}>
          <a href="#" className={styles.navLink}>Dashboard</a>
          <a href="#" className={styles.navLink}>Calendar</a>
          <a href="#" className={styles.navLink}>Settings</a>
        </nav>
        {!isLoggedIn && (
          <div className={styles.authButtons}>
            <button className={styles.signInBtn}>Sign in</button>
            <button className={styles.registerBtn}>Register</button>
          </div>
        )}
      </div>
    </header>
  );
}

