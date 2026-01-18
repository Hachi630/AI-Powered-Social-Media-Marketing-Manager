import { useEffect, useState } from 'react';
import styles from './TypewriterText.module.css';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
}

export default function TypewriterText({ text, speed = 50, delay = 0 }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setStarted(true);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setTimeout(() => setShowCursor(false), 1000);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, started]);

  return (
    <span className={styles.typewriter}>
      {displayedText}
      {showCursor && <span className={styles.cursor}>|</span>}
    </span>
  );
}
