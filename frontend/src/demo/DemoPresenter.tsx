import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { demoSteps } from "./demoSteps";
import { disableDemoMode, isDemoMode, resetDemoMode } from "./demoMode";
import styles from "./DemoPresenter.module.css";

const getTargetRect = (selector?: string): DOMRect | null => {
  if (!selector) return null;
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  return el.getBoundingClientRect();
};

export default function DemoPresenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 120, left: 24 });
  const step = demoSteps[stepIndex];
  const isEmbed = new URLSearchParams(window.location.search).get("embed") === "1";

  const stepCount = demoSteps.length;
  const isActive = isDemoMode();

  const updateSpotlight = useCallback(() => {
    const targetRect = getTargetRect(step.target);
    setRect(targetRect);
    if (targetRect) {
      const top = Math.min(
        window.innerHeight - 200,
        Math.max(24, targetRect.bottom + 12)
      );
      const left = Math.min(
        window.innerWidth - 380,
        Math.max(24, targetRect.left)
      );
      setTooltipPos({ top, left });
    }
  }, [step.target]);

  const goToStep = useCallback(
    async (nextIndex: number) => {
      const nextStep = demoSteps[nextIndex];
      if (!nextStep) return;
      if (nextStep.route && location.pathname !== nextStep.route) {
        navigate(nextStep.route);
      }
      setStepIndex(nextIndex);
      if (nextStep.action) {
        nextStep.action();
      }
      setTimeout(updateSpotlight, 300);
    },
    [location.pathname, navigate, updateSpotlight]
  );

  const handleNext = useCallback(() => {
    if (stepIndex < stepCount - 1) {
      goToStep(stepIndex + 1);
    }
  }, [goToStep, stepIndex, stepCount]);

  const handleBack = useCallback(() => {
    if (stepIndex > 0) {
      goToStep(stepIndex - 1);
    }
  }, [goToStep, stepIndex]);

  const handleRestart = useCallback(() => {
    resetDemoMode();
    goToStep(0);
  }, [goToStep]);

  const handleExit = useCallback(() => {
    disableDemoMode();
    window.location.href = "/home";
  }, []);

  useEffect(() => {
    if (!isActive) return;
    setTimeout(updateSpotlight, 300);
  }, [isActive, updateSpotlight, stepIndex]);

  useEffect(() => {
    if (!isActive) return;
    const onResize = () => updateSpotlight();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isActive, updateSpotlight]);

  useEffect(() => {
    if (!isActive) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") handleNext();
      if (event.key === "ArrowLeft") handleBack();
      if (event.key === "Escape") handleRestart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isActive, handleBack, handleNext, handleRestart]);

  useEffect(() => {
    if (!isActive) return;
    if (step?.action) {
      step.action();
    }
  }, [isActive, step]);

  if (!isActive || isEmbed) return null;

  const spotlightStyle = rect
    ? {
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
      }
    : {
        top: "20%",
        left: "20%",
        width: "60%",
        height: "20%",
      };
  const canAdvance = !step.target || Boolean(rect);

  return (
    <>
      <div className={styles.overlay} />
      <div className={styles.spotlight} style={spotlightStyle} />
      <div
        className={styles.tooltip}
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <div className={styles.tooltipTitle}>{step.title}</div>
        <div className={styles.tooltipBody}>{step.narration}</div>
      </div>
      <div className={styles.controls}>
        <button className={styles.controlButtonSecondary} onClick={handleBack}>
          Back
        </button>
        <button className={styles.controlButton} onClick={handleNext} disabled={!canAdvance}>
          Next
        </button>
        <button className={styles.controlButtonSecondary} onClick={handleRestart}>
          Restart
        </button>
        <button className={styles.controlButtonSecondary} onClick={handleExit}>
          Exit
        </button>
      </div>
      <div className={styles.pill}>Demo Mode</div>
    </>
  );
}
