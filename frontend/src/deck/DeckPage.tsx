import { useEffect, useRef } from "react";
// @ts-ignore - reveal.js doesn't have types
import Reveal from "reveal.js/dist/reveal.esm.js";
// @ts-ignore - reveal.js plugins don't have types
import RevealNotes from "reveal.js/plugin/notes/notes.esm.js";
import { demoScript } from "../demo/script/demoScript";
import styles from "./DeckPage.module.css";
import ParticleBackground from "./components/ParticleBackground";
import TypewriterText from "./components/TypewriterText";
import Live2DWidget from "../components/Live2DWidget";

export default function DeckPage() {
  const revealRef = useRef<HTMLDivElement>(null);
  const revealInstanceRef = useRef<Reveal | null>(null);

  const steps = demoScript;

  // 初始化 reveal.js
  useEffect(() => {
    if (!revealRef.current || revealInstanceRef.current) return;

    const reveal = new Reveal(revealRef.current, {
      hash: true,
      controls: false,
      progress: false,
      center: false,
      transition: 'slide',
      backgroundTransition: 'slide',
      embedded: false,
      width: '100%',
      height: '100%',
      margin: 0,
      minScale: 1,
      maxScale: 1,
      // Speaker notes plugin - press 'S' to open speaker view
      plugins: [RevealNotes],
    });

    reveal.initialize().then(() => {
      revealInstanceRef.current = reveal;
    });

    return () => {
      if (revealInstanceRef.current) {
        revealInstanceRef.current.destroy();
        revealInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <section className={styles.deckPane}>

          {/* reveal.js 容器 */}
          <div ref={revealRef} className="reveal">
            <div className="slides">
              {steps.map((step, index) => {
                const isCover = step.slide.slideType === "cover";
                const isOverview = step.slide.slideType === "overview";
                const isFeature = step.slide.slideType === "feature";
                const isLink = step.slide.slideType === "link";
                const isDualImage = step.slide.slideType === "dual-image";
                const isVerticalList = step.slide.slideType === "vertical-list";
                const isImageShowcase = step.slide.slideType === "image-showcase";
                const isImageZoom = step.slide.slideType === "image-zoom";
                const isGrid2x2 = step.slide.slideType === "grid-2x2";
                const isGrid2x3 = step.slide.slideType === "grid-2x3";
                const isTemplateCards = step.slide.slideType === "template-cards";
                const isCodeBlock = step.slide.slideType === "code-block";
                const transition = step.slide.transition || "fade";
                
                return (
                  <section 
                    key={step.id} 
                    className={`${styles.slideFrame} ${isCover ? styles.slideFrameCover : ""}`}
                    data-transition={transition}
                  >
                    {isCover ? (
                      <div className={styles.coverBody}>
                        <ParticleBackground />
                        <div className={styles.coverSprint}>{step.slide.eyebrow}</div>
                        <div className={styles.coverTitle}>{step.slide.title}</div>
                        <div className={styles.coverNames}>
                          <TypewriterText text={step.slide.subtitle} speed={50} delay={2500} />
                        </div>
                      </div>
                    ) : isOverview ? (
                      <div className={styles.overviewSlide}>
                        <div className={styles.overviewHeader}>
                          <h1 className={styles.overviewTitle}>{step.slide.title}</h1>
                          <p className={styles.overviewSubtitle}>{step.slide.subtitle}</p>
                        </div>
                        {step.id === "cloud" ? (
                          // Architecture diagram layout for cloud deployment
                          <div className={styles.architectureDiagram}>
                            {/* Left column: COMPUTE (Amplify + Render) */}
                            <div className={styles.architectureColumn}>
                              <div className={styles.architectureColumnHeader}>COMPUTE</div>
                              <div className={styles.architectureServiceItem}>
                                <div className={styles.architectureServiceIcon}>
                                  <img
                                    src={step.slide.overviewIcons?.[0].icon || ""}
                                    alt={step.slide.overviewIcons?.[0].label || ""}
                                  />
                                </div>
                                <div className={styles.architectureServiceRole}>Frontend Hosting</div>
                                <div className={styles.architectureServiceLabel}>
                                  {step.slide.overviewIcons?.[0].label}
                                </div>
                              </div>
                              <div className={styles.architectureServiceItem}>
                                <div className={styles.architectureServiceIcon}>
                                  <img
                                    src={step.slide.overviewIcons?.[1].icon || ""}
                                    alt={step.slide.overviewIcons?.[1].label || ""}
                                  />
                                </div>
                                <div className={styles.architectureServiceRole}>Backend API</div>
                                <div className={styles.architectureServiceLabel}>
                                  {step.slide.overviewIcons?.[1].label}
                                </div>
                              </div>
                            </div>

                            {/* Right column: DATA (S3 + MongoDB Atlas) */}
                            <div className={styles.architectureColumn}>
                              <div className={styles.architectureColumnHeader}>DATA</div>
                              <div className={styles.architectureServiceItem}>
                                <div className={styles.architectureServiceIcon}>
                                  <img
                                    src={step.slide.overviewIcons?.[2].icon || ""}
                                    alt={step.slide.overviewIcons?.[2].label || ""}
                                  />
                                </div>
                                <div className={styles.architectureServiceRole}>File Storage</div>
                                <div className={styles.architectureServiceLabel}>
                                  {step.slide.overviewIcons?.[2].label}
                                </div>
                              </div>
                              <div className={styles.architectureServiceItem}>
                                <div className={styles.architectureServiceIcon}>
                                  <img
                                    src={step.slide.overviewIcons?.[3].icon || ""}
                                    alt={step.slide.overviewIcons?.[3].label || ""}
                                  />
                                </div>
                                <div className={styles.architectureServiceRole}>Database</div>
                                <div className={styles.architectureServiceLabel}>
                                  {step.slide.overviewIcons?.[3].label}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Regular icon grid for other overview slides
                          <div className={styles.overviewIcons}>
                            {step.slide.overviewIcons?.map((icon, iconIndex) => (
                              <div
                                key={`${step.id}-icon-${iconIndex}`}
                                className={styles.overviewIconItem}
                                style={{ animationDelay: `${iconIndex * 0.2}s` }}
                              >
                                <div className={styles.overviewIcon}>
                                  {icon.isImage ? (
                                    <img
                                      src={icon.icon}
                                      alt={icon.label}
                                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                  ) : (
                                    icon.icon
                                  )}
                                </div>
                                <div className={styles.overviewIconLabel}>{icon.label}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : isFeature ? (
                      <div className={styles.featureSlide}>
                        <div className={styles.featureContent}>
                          <h1 className={styles.featureTitle}>{step.slide.title}</h1>
                          <p className={styles.featureTagline}>{step.slide.featureTagline}</p>
                          {step.slide.image && (
                            <div className={
                              step.slide.image.includes('kirby-robot') ? styles.featureImageLarge :
                              step.slide.image.includes('Thanks') ? styles.featureImageXLarge :
                              styles.featureImage
                            }>
                              <img src={step.slide.image} alt="" />
                            </div>
                          )}
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
                    ) : isLink ? (
                      <div className={styles.linkSlide}>
                        <div className={styles.linkContent}>
                          <h1 className={styles.linkTitle}>{step.slide.title}</h1>
                          <a
                            href={step.slide.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.linkUrl}
                          >
                            {step.slide.link}
                          </a>
                        </div>
                      </div>
                    ) : isDualImage ? (
                      <div className={styles.dualImageSlide}>
                        {step.slide.images?.sort((a, b) => a.order - b.order).map((img, imgIndex) => (
                          <div
                            key={`${step.id}-image-${imgIndex}`}
                            className={`${styles.dualImageItem} ${
                              img.position === "left" ? styles.dualImageLeft : styles.dualImageRight
                            }`}
                            style={{ animationDelay: `${imgIndex * 1}s` }}
                          >
                            <img src={img.src} alt={`Image ${imgIndex + 1}`} className={styles.dualImage} />
                          </div>
                        ))}
                      </div>
                    ) : isVerticalList ? (
                      <div className={styles.verticalListSlide}>
                        {step.slide.listItems?.map((item, itemIndex) => (
                          <div
                            key={`${step.id}-item-${itemIndex}`}
                            className={styles.verticalListItem}
                            style={{ animationDelay: `${itemIndex * 0.2}s` }}
                          >
                            <h2 className={styles.verticalListTitle}>{item.title}</h2>
                            <p className={styles.verticalListDescription}>{item.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : isImageShowcase ? (
                      <div className={styles.imageShowcaseSlide}>
                        {step.slide.image && (
                          <img
                            src={step.slide.image}
                            alt={step.slide.title || "Showcase"}
                            className={styles.imageShowcaseImg}
                          />
                        )}
                      </div>
                    ) : isImageZoom ? (
                      <div className={styles.imageZoomSlide}>
                        {step.slide.image && (
                          <div className={styles.imageZoomContainer}>
                            <img
                              src={step.slide.image}
                              alt={step.slide.title || "Zoom"}
                              className={styles.imageZoomImg}
                            />
                          </div>
                        )}
                      </div>
                    ) : isGrid2x2 ? (
                      <div className={styles.grid2x2Slide}>
                        {step.slide.gridImages?.map((imgSrc, imgIndex) => (
                          <div
                            key={`${step.id}-grid-${imgIndex}`}
                            className={styles.grid2x2Item}
                            style={{ animationDelay: `${imgIndex * 0.15}s` }}
                          >
                            <img
                              src={imgSrc}
                              alt={`Mascot ${imgIndex + 1}`}
                              className={styles.grid2x2Img}
                            />
                          </div>
                        ))}
                      </div>
                    ) : isGrid2x3 ? (
                      <div className={styles.grid2x3Slide}>
                        {step.slide.gridImages?.map((imgSrc, imgIndex) => (
                          <div
                            key={`${step.id}-grid-${imgIndex}`}
                            className={styles.grid2x3Item}
                            style={{ animationDelay: `${imgIndex * 0.12}s` }}
                          >
                            <img
                              src={imgSrc}
                              alt={`Screenshot ${imgIndex + 1}`}
                              className={styles.grid2x3Img}
                            />
                          </div>
                        ))}
                      </div>
                    ) : isTemplateCards ? (
                      <div className={styles.templateCardsSlide}>
                        <h1 className={styles.templateCardsTitle}>{step.slide.title}</h1>
                        <div className={styles.templateCardsGrid}>
                          {step.slide.templateCards?.map((card, cardIndex) => (
                            <div
                              key={`${step.id}-template-${cardIndex}`}
                              className={`${styles.templateCardItem} ${cardIndex === 0 ? styles.templateCardClickable : ""}`}
                              style={{
                                animationDelay: `${cardIndex * 0.15}s`,
                                borderColor: card.borderColor,
                              }}
                              onClick={cardIndex === 0 ? () => {
                                revealInstanceRef.current?.next();
                              } : undefined}
                            >
                              <div
                                className={styles.templateCardIcon}
                                style={{ backgroundColor: card.iconBgColor }}
                              >
                                {card.icon}
                              </div>
                              <h3 className={styles.templateCardTitle}>{card.title}</h3>
                              <p className={styles.templateCardDesc}>{card.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : isCodeBlock ? (
                      <div className={styles.codeBlockSlide}>
                        <h1 className={styles.codeBlockTitle}>{step.slide.title}</h1>
                        <div className={styles.codeBlockContainer}>
                          <pre className={styles.codeBlockPre}>
                            <code className={styles.codeBlockCode}>
                              {step.slide.codeContent}
                            </code>
                          </pre>
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
                    {/* Speaker notes - press 'S' to open speaker view */}
                    <aside className="notes">
                      <p><strong>{step.title}</strong></p>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{step.narration}</p>
                      {step.slide.note && <p style={{ whiteSpace: 'pre-wrap' }}><em>{step.slide.note}</em></p>}
                    </aside>
                  </section>
                );
              })}
            </div>
          </div>
        </section>
        {/* Live2D AI Robot in bottom right corner */}
        <div className={styles.live2dDock}>
          <Live2DWidget modelPath="/umiushi/model.model3.json" />
        </div>
      </div>
    </div>
  );
}
