import { useEffect, useState } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import styles from './ELOTipBubble.module.css';

export interface ELOTipBubbleProps {
  message: string;
  type?: 'info' | 'reminder' | 'tip';
  duration?: number; // Auto-dismiss time in ms, 0 means no auto-dismiss
  onClose?: () => void;
  position: { x: number; y: number }; // ELO widget position
  visible: boolean;
}

export default function ELOTipBubble({
  message,
  type = 'info',
  duration = 0,
  onClose,
  position,
  visible,
}: ELOTipBubbleProps) {
  const [isClosing, setIsClosing] = useState(false);

  // Calculate position on the left side of ELO
  const widgetWidth = 200;
  const widgetHeight = 200;
  const bubbleWidth = 300;
  const gap = 15; // Gap between ELO and tip bubble

  // Position to the left of ELO, vertically centered
  const bubbleLeft = position.x - bubbleWidth - gap;
  const bubbleTop = position.y + (widgetHeight / 2) - 50; // Center vertically, adjust for bubble height

  // Ensure bubble stays within viewport
  const constrainedLeft = Math.max(20, Math.min(bubbleLeft, window.innerWidth - bubbleWidth - 20));
  const constrainedTop = Math.max(20, Math.min(bubbleTop, window.innerHeight - 200));

  const bubbleStyle: React.CSSProperties = {
    top: `${constrainedTop}px`,
    left: `${constrainedLeft}px`,
  };

  // Auto-dismiss after duration
  useEffect(() => {
    if (visible && duration > 0) {
      console.log('[ELO Tip] Setting auto-dismiss timer:', duration);
      const timer = setTimeout(() => {
        console.log('[ELO Tip] Auto-dismissing tip');
        setIsClosing(true);
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
          setIsClosing(false);
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  const handleClose = () => {
    console.log('[ELO Tip] Closing tip bubble');
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
      setIsClosing(false);
    }, 300); // Wait for fade out animation
  };

  // Debug logging
  useEffect(() => {
    if (visible) {
      console.log('[ELO Tip] Tip bubble visible:', { message, type, duration, position });
    }
  }, [visible, message, type, duration, position]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`${styles.tipBubble} ${styles[type]} ${isClosing ? styles.fadeOut : ''}`}
      style={bubbleStyle}
    >
      <div className={styles.tipHeader}>
        <p className={styles.tipMessage}>{message}</p>
        {onClose && (
          <button
            className={styles.tipCloseButton}
            onClick={handleClose}
            aria-label="Close tip"
          >
            <CloseOutlined />
          </button>
        )}
      </div>
    </div>
  );
}
