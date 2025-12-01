import { useTheme } from '../contexts/ThemeContext'
import styles from './ThemeToggle.module.css'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isWarm = theme === 'warm'

  const handleClassicClick = () => {
    if (!isWarm) return // Already on classic, do nothing
    toggleTheme()
  }

  const handleWarmClick = () => {
    if (isWarm) return // Already on warm, do nothing
    toggleTheme()
  }

  return (
    <div className={styles.toggleContainer}>
      <button
        className={`${styles.segment} ${!isWarm ? styles.active : ''}`}
        onClick={handleClassicClick}
        aria-label="Switch to classic mode"
      >
        Classic
      </button>
      <button
        className={`${styles.segment} ${isWarm ? styles.active : ''}`}
        onClick={handleWarmClick}
        aria-label="Switch to warm mode"
      >
        Warm
      </button>
    </div>
  )
}

