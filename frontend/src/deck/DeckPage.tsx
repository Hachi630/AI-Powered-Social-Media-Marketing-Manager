import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Deck,
  Slide,
  Heading,
  Text,
  Notes,
  DeckContext,
} from "spectacle";
import { useDemoBridge } from "./runtime/useDemoBridge";
import { useDemoRunner, type DeckApi } from "./runtime/useDemoRunner";
import { demoScript } from "../demo/script/demoScript";
import Live2DWidget from "../components/Live2DWidget";
import { useAppSettings } from "../contexts/AppSettingsContext";
import styles from "./DeckPage.module.css";
import { useContext } from "react";

const DeckController = ({
  onApiReady,
  onSlideChange,
}: {
  onApiReady: (api: DeckApi) => void;
  onSlideChange: (index: number) => void;
}) => {
  const deck = useContext(DeckContext);
  const readyRef = useRef(false);
  const slideRef = useRef(deck.activeView.slideIndex);

  useEffect(() => {
    if (!readyRef.current) {
      onApiReady({
        skipTo: deck.skipTo,
        stepForward: deck.stepForward,
        stepBackward: deck.stepBackward,
      });
      readyRef.current = true;
    }
  }, [deck, onApiReady]);

  useEffect(() => {
    if (slideRef.current !== deck.activeView.slideIndex) {
      slideRef.current = deck.activeView.slideIndex;
      onSlideChange(deck.activeView.slideIndex);
    }
  }, [deck.activeView.slideIndex, onSlideChange]);

  return null;
};

export default function DeckPage() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [deckApi, setDeckApi] = useState<DeckApi | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const { ready, lastError: bridgeError, clearError, send, resetSession } = useDemoBridge(frameRef);
  const { settings } = useAppSettings();

  const steps = demoScript;
  const deckTheme = useMemo(
    () => ({
      colors: {
        primary: "#17171c",
        secondary: "#f7f1e7",
        tertiary: "#e4552d",
        quaternary: "#2e5d52",
        quinary: "#f3eee6",
      },
      fonts: {
        header: "Fraunces, serif",
        text: "Chakra Petch, sans-serif",
        monospace: "IBM Plex Mono, monospace",
      },
      fontSizes: {
        h1: "56px",
        h2: "42px",
        h3: "30px",
        text: "22px",
        monospace: "18px",
      },
    }),
    []
  );

  const runner = useDemoRunner({
    steps,
    ready,
    send,
    deckApi,
    onStepChange: () => {},
  });

  const isRunning = runner.status === "running";
  const errorMessage = runner.lastError ?? bridgeError;
  const showDemo = runner.stepIndex > 1;

  const frameSrc = useMemo(() => `/dashboard?embed=1`, []);

  const handleSlideChange = useCallback(
    (index: number) => {
      if (isRunning) return;
      runner.setStepIndex(index);
    },
    [isRunning, runner]
  );

  const handleResetData = useCallback(() => {
    if (!ready) return;
    send({ type: "RESET_DEMO_DATA" }).catch(() => undefined);
  }, [ready, send]);

  const handleReload = useCallback(() => {
    resetSession();
    setFrameKey((prev) => prev + 1);
  }, [resetSession]);

  useEffect(() => {
    if (errorMessage) {
      const timer = window.setTimeout(() => clearError(), 9000);
      return () => window.clearTimeout(timer);
    }
  }, [clearError, errorMessage]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.brand}>
            <div className={styles.brandTitle}>MELO Demo Deck</div>
            <div className={styles.brandSubtitle}>Automated walkthrough</div>
          </div>
          <div className={styles.statusRow}>
            <span className={`${styles.statusPill} ${ready ? styles.statusPillAccent : ""}`}>
              {ready ? "DEMO READY" : "WAITING"}
            </span>
            <span>
              Step {runner.stepIndex + 1} / {steps.length}
            </span>
            <span>Status: {runner.status.toUpperCase()}</span>
          </div>
        </div>
        <div className={styles.controls}>
          <button
            className={`${styles.controlButton} ${styles.controlButtonPrimary}`}
            onClick={isRunning ? runner.pause : runner.start}
            disabled={!ready}
          >
            {isRunning ? "Pause" : "Play"}
          </button>
          <button className={styles.controlButton} onClick={runner.prev} disabled={!ready}>
            Prev
          </button>
          <button className={styles.controlButton} onClick={runner.next} disabled={!ready}>
            Next
          </button>
          <button className={styles.controlButton} onClick={runner.runCurrentStep} disabled={!ready}>
            Run Step
          </button>
          <button className={styles.controlButton} onClick={runner.restart} disabled={!ready}>
            Restart
          </button>
          <button className={`${styles.controlButton} ${styles.controlButtonGhost}`} onClick={handleResetData} disabled={!ready}>
            Reset Data
          </button>
          <button className={`${styles.controlButton} ${styles.controlButtonGhost}`} onClick={handleReload}>
            Reload Demo
          </button>
        </div>
        {errorMessage && <div className={styles.error}>Demo error: {errorMessage}</div>}
      </div>

      <div className={`${styles.main} ${!showDemo ? styles.mainFull : ""}`}>
        <section className={`${styles.panel} ${styles.deckPane}`}>
          <span className={styles.panelLabel}>Slides</span>
          <Deck theme={deckTheme} transition={{ from: { opacity: 0 }, enter: { opacity: 1 }, leave: { opacity: 0 } }}>
            <DeckController onApiReady={setDeckApi} onSlideChange={handleSlideChange} />
            {steps.map((step, index) => {
              const isCover = index === 0;
              return (
              <Slide key={step.id} backgroundColor="transparent" className={styles.slideFrame}>
                  {isCover ? (
                    <div className={styles.cover}>
                      <div className={styles.coverBody}>
                        <div className={styles.coverSprint}>{step.slide.eyebrow}</div>
                        <div className={styles.coverTitle}>{step.slide.title}</div>
                        <div className={styles.coverNames}>{step.slide.subtitle}</div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`${styles.slide} ${
                        step.slide.subtitle || step.slide.bullets.length > 0
                          ? ""
                          : styles.slideTitleOnly
                      }`}
                    >
                      {step.slide.eyebrow && (
                        <div className={styles.slideEyebrow}>{step.slide.eyebrow}</div>
                      )}
                      <Heading className={styles.slideTitle}>{step.slide.title}</Heading>
                      {step.slide.subtitle && (
                        <Text className={styles.slideSubtitle}>{step.slide.subtitle}</Text>
                      )}
                      {step.slide.bullets.length > 0 && (
                        <ul className={styles.slideList}>
                          {step.slide.bullets.map((bullet, index) => (
                            <li key={`${step.id}-bullet-${index}`} className={styles.slideListItem}>
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className={styles.footerNote}>Step {index + 1}</div>
                    </div>
                  )}
                  {step.slide.note && <Notes>{step.slide.note}</Notes>}
                </Slide>
              );
            })}
          </Deck>
        </section>

        {showDemo && (
          <section className={`${styles.panel} ${styles.demoPane}`}>
            <span className={styles.panelLabel}>Live Demo</span>
            <iframe
              key={frameKey}
              ref={frameRef}
              className={styles.iframe}
              src={frameSrc}
              title="Melo Demo"
              allow="clipboard-read; clipboard-write"
            />
          </section>
        )}
      </div>
      <div className={styles.live2dDock}>
        <Live2DWidget modelPath={settings.live2dModel} isPreview />
      </div>
    </div>
  );
}
