import { useEffect, useMemo, useState } from "react";
import styles from "./SpotlightOverlay.module.css";

const getRectForSelector = (selector: string | null): DOMRect | null => {
  if (!selector) return null;
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  return el.getBoundingClientRect();
};

export default function SpotlightOverlay({
  selector,
  title,
  narration,
}: {
  selector: string | null;
  title?: string;
  narration?: string;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 120, left: 24 });

  const hasCopy = Boolean(title || narration);

  const spotlightStyle = useMemo(() => {
    if (!selector) return null;
    if (!rect) {
      return {
        top: "20%",
        left: "20%",
        width: "60%",
        height: "20%",
      } as const;
    }
    return {
      top: rect.top - 6,
      left: rect.left - 6,
      width: rect.width + 12,
      height: rect.height + 12,
    } as const;
  }, [rect, selector]);

  useEffect(() => {
    if (!selector) return;

    let raf = 0;
    const update = () => {
      const nextRect = getRectForSelector(selector);
      setRect(nextRect);
      if (nextRect) {
        const top = Math.min(
          window.innerHeight - 220,
          Math.max(24, nextRect.bottom + 12)
        );
        const left = Math.min(
          window.innerWidth - 400,
          Math.max(24, nextRect.left)
        );
        setTooltipPos({ top, left });
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);

    return () => cancelAnimationFrame(raf);
  }, [selector]);

  if (!selector) return null;

  return (
    <>
      <div className={styles.overlay} />
      {spotlightStyle && <div className={styles.spotlight} style={spotlightStyle} />}
      {hasCopy && (
        <div className={styles.tooltip} style={{ top: tooltipPos.top, left: tooltipPos.left }}>
          {title && <div className={styles.title}>{title}</div>}
          {narration && <div className={styles.body}>{narration}</div>}
        </div>
      )}
    </>
  );
}

