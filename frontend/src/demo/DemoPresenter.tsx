import { useCallback, useEffect, useState, useRef } from "react";
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
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 120, left: 24 });
  const [isDraggingTooltip, setIsDraggingTooltip] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const step = demoSteps[stepIndex];
  const isEmbed = new URLSearchParams(window.location.search).get("embed") === "1";

  const stepCount = demoSteps.length;
  const isActive = isDemoMode();

  const updateSpotlight = useCallback((targetSelector?: string) => {
    const selector = targetSelector ?? step.target;
    const targetRect = getTargetRect(selector);
    setRect(targetRect);
    if (targetRect) {
      const tooltipHeight = 280; // Estimated tooltip height
      const tooltipWidth = 520; // Max tooltip width

      // Check if target is on the left side of the screen (e.g., sidebar content)
      const isLeftSide = targetRect.left < window.innerWidth / 2;

      const top = Math.min(
        window.innerHeight - tooltipHeight - 24,
        Math.max(24, targetRect.top)
      );

      let left;
      if (isLeftSide) {
        // Position tooltip on the right side if target is on the left
        left = Math.min(
          window.innerWidth - tooltipWidth - 24,
          Math.max(targetRect.right + 24, window.innerWidth - tooltipWidth - 24)
        );
      } else {
        // Position tooltip on the left or below if target is on the right
        left = Math.min(
          window.innerWidth - tooltipWidth - 24,
          Math.max(24, targetRect.left)
        );
      }

      setTooltipPos({ top, left });
    } else {
      // If no target found, position tooltip at default location
      setTooltipPos({ top: 120, left: 24 });
    }
  }, [step.target]);

  const goToStep = useCallback(
    async (nextIndex: number) => {
      const nextStep = demoSteps[nextIndex];
      if (!nextStep) return;

      // Clear current spotlight immediately
      setRect(null);

      if (nextStep.route && location.pathname !== nextStep.route) {
        navigate(nextStep.route);
      }
      setStepIndex(nextIndex);
      // Note: Action execution is handled by useEffect to prevent duplicates
      // Update spotlight with the new step's target
      setTimeout(() => updateSpotlight(nextStep.target), 300);
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
    // Reload the page to reset all state and show onboarding form
    window.location.reload();
  }, []);

  const handleExit = useCallback(() => {
    disableDemoMode();
    // Stay on current page, just reload to remove demo mode
    window.location.reload();
  }, []);

  const handleSkipVideo = useCallback(() => {
    setShowWelcomeVideo(false);
  }, []);

  const handleVideoEnd = useCallback(() => {
    // Pause video at last frame instead of hiding
    setVideoEnded(true);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  const handleStartDemo = useCallback(() => {
    setShowWelcomeVideo(false);
  }, []);

  // Tooltip drag handlers
  const handleTooltipMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDraggingTooltip(true);
    setDragOffset({
      x: e.clientX - tooltipPos.left,
      y: e.clientY - tooltipPos.top,
    });
    e.preventDefault();
  }, [tooltipPos]);

  // Mouse move handler
  useEffect(() => {
    if (!isActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingTooltip) {
        const newLeft = Math.max(0, Math.min(window.innerWidth - 520, e.clientX - dragOffset.x));
        const newTop = Math.max(0, Math.min(window.innerHeight - 280, e.clientY - dragOffset.y));
        setTooltipPos({ left: newLeft, top: newTop });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingTooltip(false);
    };

    if (isDraggingTooltip) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isActive, isDraggingTooltip, dragOffset]);

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

  // Track which step's action has been executed to prevent duplicate calls
  const executedStepRef = useRef<number>(-1);
  
  useEffect(() => {
    if (!isActive) return;
    // Only execute action once per step
    if (step?.action && executedStepRef.current !== stepIndex) {
      executedStepRef.current = stepIndex;
      step.action();
    }
  }, [isActive, stepIndex, step]);

  // Hide onboarding form when reaching step 3 (index 3) or later
  useEffect(() => {
    if (!isActive) return;
    // Step 3 is "Ask a Question" (index 3), step 4 is "Generate Image" (index 4)
    if (stepIndex >= 3) {
      // Mark onboarding as done in localStorage
      localStorage.setItem("melo_demo_onboarding_done", "true");
      // Dispatch event to close onboarding modal
      window.dispatchEvent(new CustomEvent("demo-hide-onboarding"));
    }
  }, [isActive, stepIndex]);

  if (!isActive || isEmbed) return null;

  // Show welcome video first
  if (showWelcomeVideo) {
    return (
      <div className={styles.videoOverlay}>
        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            className={styles.welcomeVideo}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={handleVideoEnd}
            controls={false}
          >
            <source src="/img/welcome.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {!videoEnded ? (
            <button className={styles.skipButton} onClick={handleSkipVideo}>
              Skip Video
            </button>
          ) : (
            <button className={styles.startDemoButton} onClick={handleStartDemo}>
              Welcome to Demo Mode
            </button>
          )}
        </div>
      </div>
    );
  }

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

  // Disable Next if target element is not found, or if step requires manual next
  const isNextDisabled = step.requireManualNext ? false : !canAdvance;

  // Step 13 (wrap) should only show Exit button
  const isFinalStep = stepIndex === stepCount - 1;

  return (
    <>
      <div className={styles.overlay} />
      <div className={styles.spotlight} style={spotlightStyle} />
      <div
        className={styles.tooltip}
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          cursor: isDraggingTooltip ? 'grabbing' : 'grab'
        }}
      >
        <div
          className={styles.tooltipHeader}
          onMouseDown={handleTooltipMouseDown}
          style={{ cursor: isDraggingTooltip ? 'grabbing' : 'grab' }}
        >
          <div className={styles.tooltipStepNumber}>
            <span className={styles.tooltipStepBadge}>{stepIndex + 1}</span>
            <span>Step {stepIndex + 1} of {stepCount}</span>
          </div>
          <div className={styles.tooltipProgress}>
            <div className={styles.tooltipProgressBar}>
              <div
                className={styles.tooltipProgressFill}
                style={{ width: `${((stepIndex + 1) / stepCount) * 100}%` }}
              />
            </div>
            <span>{Math.round(((stepIndex + 1) / stepCount) * 100)}%</span>
          </div>
        </div>
        <div className={styles.tooltipContent}>
          <div className={styles.tooltipTitle}>
            <span className={styles.tooltipTitleIcon}>📚</span>
            {step.title}
          </div>
          <div className={styles.tooltipBody}>{step.narration}</div>
          <div className={styles.tooltipControls}>
            {isFinalStep ? (
              // Step 13: Only show Exit button
              <button className={styles.controlButton} onClick={handleExit}>
                Exit
              </button>
            ) : (
              <>
                <button className={styles.controlButtonSecondary} onClick={handleBack}>
                  Back
                </button>
                <button className={styles.controlButton} onClick={handleNext} disabled={isNextDisabled}>
                  Next
                </button>
                <button className={styles.controlButtonSecondary} onClick={handleRestart}>
                  Restart
                </button>
                <button className={styles.controlButtonSecondary} onClick={handleExit}>
                  Exit
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className={styles.pill}>Demo Mode</div>
    </>
  );
}
