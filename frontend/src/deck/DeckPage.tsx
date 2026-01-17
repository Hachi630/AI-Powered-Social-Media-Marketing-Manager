import { useCallback, useEffect, useRef, useState } from "react";
// @ts-ignore - reveal.js doesn't have types
import Reveal from "reveal.js";
import { useDemoBridge } from "./runtime/useDemoBridge";
import { useDemoRunner, type DeckApi } from "./runtime/useDemoRunner";
import { demoScript } from "../demo/script/demoScript";
import Live2DWidget from "../components/Live2DWidget";
import { useAppSettings } from "../contexts/AppSettingsContext";
import styles from "./DeckPage.module.css";

export default function DeckPage() {
  const revealRef = useRef<HTMLDivElement>(null);
  const revealInstanceRef = useRef<Reveal | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [deckApi, setDeckApi] = useState<DeckApi | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const { ready, lastError: bridgeError, clearError, send, resetSession } = useDemoBridge(frameRef);
  const { settings } = useAppSettings();

  const steps = demoScript;

  // 初始化 reveal.js
  useEffect(() => {
    if (!revealRef.current || revealInstanceRef.current) return;

    const reveal = new Reveal(revealRef.current, {
      hash: false,
      controls: false,
      progress: false,
      center: false,
      transition: 'fade',
      backgroundTransition: 'fade',
      embedded: false,
      width: '100%',
      height: '100%',
      margin: 0,
      minScale: 1,
      maxScale: 1,
    });

    reveal.initialize().then(() => {
      revealInstanceRef.current = reveal;
      
      // 暴露 API
      setDeckApi({
        skipTo: ({ slideIndex }) => {
          reveal.slide(slideIndex);
        },
        stepForward: () => {
          reveal.next();
        },
        stepBackward: () => {
          reveal.prev();
        },
      });

      // 监听 slide 变化
      reveal.on('slidechanged', (event: { indexh: number }) => {
        handleSlideChange(event.indexh);
      });
    });

    return () => {
      if (revealInstanceRef.current) {
        revealInstanceRef.current.destroy();
        revealInstanceRef.current = null;
      }
    };
  }, []);

  const runner = useDemoRunner({
    steps,
    ready,
    send,
    deckApi,
    onStepChange: () => {},
  });

  const isRunning = runner.status === "running";
  const errorMessage = runner.lastError ?? bridgeError;
  const currentStep = steps[runner.stepIndex];
  const showDemo = runner.stepIndex > 1 && !currentStep?.slide?.image;

  const frameSrc = `/dashboard?embed=1`;

  const handleSlideChange = useCallback(
    (index: number) => {
      if (isRunning) return;
      runner.setStepIndex(index);
    },
    [isRunning, runner]
  );

  // 同步 reveal.js 到 runner 的 stepIndex
  useEffect(() => {
    if (revealInstanceRef.current && deckApi) {
      const currentIndex = revealInstanceRef.current.getIndices().h;
      if (currentIndex !== runner.stepIndex) {
        revealInstanceRef.current.slide(runner.stepIndex);
      }
    }
  }, [runner.stepIndex, deckApi]);

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
          
          {/* reveal.js 容器 */}
          <div ref={revealRef} className="reveal">
            <div className="slides">
              {steps.map((step, index) => {
                const isCover = step.slide.slideType === "cover";
                const isOverview = step.slide.slideType === "overview";
                const isFeature = step.slide.slideType === "feature";
                const transition = step.slide.transition || "fade";
                
                return (
                  <section 
                    key={step.id} 
                    className={`${styles.slideFrame} ${isCover ? styles.slideFrameCover : ""}`}
                    data-transition={transition}
                  >
                    {isCover ? (
                      <div className={styles.coverBody}>
                        <div className={styles.coverSprint}>{step.slide.eyebrow}</div>
                        <div className={styles.coverTitle}>{step.slide.title}</div>
                        <div className={styles.coverNames}>{step.slide.subtitle}</div>
                      </div>
                    ) : isOverview ? (
                      <div className={styles.overviewSlide}>
                        <div className={styles.overviewHeader}>
                          <h1 className={styles.overviewTitle}>{step.slide.title}</h1>
                          <p className={styles.overviewSubtitle}>{step.slide.subtitle}</p>
                        </div>
                        <div className={styles.overviewIcons}>
                          {step.slide.overviewIcons?.map((icon, iconIndex) => (
                            <div 
                              key={`${step.id}-icon-${iconIndex}`} 
                              className={styles.overviewIconItem}
                              style={{ animationDelay: `${iconIndex * 0.2}s` }}
                            >
                              <div className={styles.overviewIcon}>{icon.icon}</div>
                              <div className={styles.overviewIconLabel}>{icon.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : isFeature ? (
                      <div className={styles.featureSlide}>
                        <div className={styles.featureContent}>
                          <h1 className={styles.featureTitle}>{step.slide.title}</h1>
                          <p className={styles.featureTagline}>{step.slide.featureTagline}</p>
                          {step.slide.title === "Cloud deployment" && (
                            <div className={styles.cloudVisual}>
                              <div className={styles.cloud3D}>☁️</div>
                              <div className={styles.cloudNodes}>
                                <span className={styles.cloudNode}>AWS</span>
                                <span className={styles.cloudNode}>Render</span>
                              </div>
                            </div>
                          )}
                          {step.slide.title === "AI robot" && (
                            <div className={styles.live2dVisual}>
                              <div className={styles.live2dCharacter}>🤖</div>
                              <div className={styles.live2dBubble}>
                                <span className={styles.bubbleText}>I'm here to help!</span>
                              </div>
                            </div>
                          )}
                          {step.slide.title === "Template system" && (
                            <div className={styles.templateVisual}>
                              {["Promo", "Event", "New menu", "Holiday"].map((template, idx) => (
                                <div 
                                  key={template}
                                  className={styles.templateCard}
                                  style={{ animationDelay: `${idx * 0.15}s` }}
                                >
                                  {template}
                                </div>
                              ))}
                              <div className={styles.templateArrow}>Reuse → Faster</div>
                            </div>
                          )}
                          {step.slide.title === "UI/UX improvements" && (
                            <div className={styles.uiuxVisual}>
                              <div className={styles.beforeAfter}>
                                <div className={styles.beforeSection}>
                                  <div className={styles.beforeLabel}>Before</div>
                                  <div className={styles.beforeUI}></div>
                                </div>
                                <div className={styles.afterSection}>
                                  <div className={styles.afterLabel}>After</div>
                                  <div className={styles.afterUI}></div>
                                </div>
                              </div>
                              <div className={styles.wipeSlider}></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`${styles.slide} ${
                          step.slide.subtitle || step.slide.bullets.length > 0 || step.slide.cards
                            ? ""
                            : styles.slideTitleOnly
                        }`}
                      >
                        <div className={`${styles.slideHeader} ${step.slide.image && step.slide.infoCards ? styles.hasImageContent : ""}`}>
                          <h1 className={styles.slideTitle}>{step.slide.title}</h1>
                          {step.slide.subtitle && (
                            <p className={styles.slideSubtitle}>{step.slide.subtitle}</p>
                          )}
                        </div>
                        {step.slide.cards && step.slide.cards.length > 0 && (
                          <div className={styles.slideCards}>
                            {step.slide.cards.map((card, cardIndex) => (
                              <div key={`${step.id}-card-${cardIndex}`} className={styles.slideCard}>
                                <h3 className={styles.slideCardTitle}>{card.title}</h3>
                                <p className={styles.slideCardDescription}>{card.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {step.slide.image && step.slide.infoCards ? (
                          <div className={styles.slideContentWithImage}>
                            <div className={styles.slideImageWrapper}>
                              <div className={styles.slideImageContainer}>
                                <img src={step.slide.image} alt={step.slide.title} className={styles.slideImage} />
                              </div>
                            </div>
                            <div className={styles.slideInfoCards}>
                              {step.slide.infoCards.map((card, cardIndex) => (
                                <div key={`${step.id}-info-card-${cardIndex}`} className={styles.slideInfoCard}>
                                  <div className={styles.slideInfoCardLabel}>{card.label}</div>
                                  <div className={styles.slideInfoCardItems}>
                                    {card.items.map((item, itemIndex) => (
                                      <div key={`${step.id}-info-card-${cardIndex}-item-${itemIndex}`} className={styles.slideInfoCardItem}>
                                        {item}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : step.slide.image && step.slide.bullets.length > 0 ? (
                          <div className={styles.slideContentWithImage}>
                            <div className={styles.slideImageContainer}>
                              <img src={step.slide.image} alt={step.slide.title} className={styles.slideImage} />
                            </div>
                            <ul className={styles.slideList}>
                              {step.slide.bullets.map((bullet, bulletIndex) => (
                                <li key={`${step.id}-bullet-${bulletIndex}`} className={styles.slideListItem}>
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <>
                            {step.slide.image && (
                              <div className={styles.slideImageContainer}>
                                <img src={step.slide.image} alt={step.slide.title} className={styles.slideImage} />
                              </div>
                            )}
                            {step.slide.bullets.length > 0 && (
                              <ul className={styles.slideList}>
                                {step.slide.bullets.map((bullet, bulletIndex) => (
                                  <li key={`${step.id}-bullet-${bulletIndex}`} className={styles.slideListItem}>
                                    {bullet}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
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
