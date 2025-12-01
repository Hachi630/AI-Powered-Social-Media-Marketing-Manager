import { useTheme } from '../contexts/ThemeContext'
import styles from './ThemeToggle.module.css'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      className={`${styles.toggle} ${isDark ? styles.dark : styles.light}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className={styles.track}>
        <span className={styles.thumb} />
        <span className={styles.labelOff}>OFF</span>
        <span className={styles.labelOn}>ON</span>
      </span>
    </button>
  )
}

