import { Button, Layout, Space, Typography } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthModal from "../components/AuthModal";
import MiniDemo from "../components/landing/MiniDemo";
import styles from "./HomePage.module.css";
import { User } from "../services/authService";
import meloLogo from "../img/melo-logo.jpg";

// Landing screenshots — drop PNGs into frontend/src/img/landing/ to make them appear.
// Imports use Vite's eager glob so missing files don't break the build.
const screenshotGlob = import.meta.glob("../img/landing/*.{png,jpg,jpeg,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function shot(filename: string): string | null {
  const key = `../img/landing/${filename}`;
  return screenshotGlob[key] || null;
}

const { Footer } = Layout;
const { Paragraph } = Typography;

interface HomePageProps {
  isLoggedIn?: boolean;
  onLoginSuccess?: (user: User) => void;
  onLogout?: () => void;
  user?: User | null;
}

function ScreenshotFrame({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`${styles.screenshotFrame} ${className || ""}`}>
      <div className={styles.screenshotBar}>
        <span className={styles.dot} style={{ background: "#ff5f57" }} />
        <span className={styles.dot} style={{ background: "#febc2e" }} />
        <span className={styles.dot} style={{ background: "#28c840" }} />
      </div>
      {src ? (
        <img src={src} alt={alt} className={styles.screenshotImg} />
      ) : (
        <div className={styles.screenshotPlaceholder}>
          <span>Screenshot coming</span>
        </div>
      )}
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  thumbSrc,
}: {
  number: string;
  title: string;
  description: string;
  thumbSrc: string | null;
}) {
  return (
    <div className={styles.stepCard}>
      <div className={styles.stepNumber}>{number}</div>
      <div className={styles.stepThumb}>
        {thumbSrc ? (
          <img src={thumbSrc} alt={title} />
        ) : (
          <div className={styles.stepThumbPlaceholder} />
        )}
      </div>
      <h3 className={styles.stepTitle}>{title}</h3>
      <p className={styles.stepDescription}>{description}</p>
    </div>
  );
}

export default function HomePage({
  isLoggedIn = false,
  onLoginSuccess,
}: HomePageProps) {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleLoginSuccess = (user: User) => {
    onLoginSuccess?.(user);
    setIsAuthModalOpen(false);
    navigate("/dashboard");
  };

  const scrollToHowItWorks = () => {
    document
      .getElementById("how-it-works")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Layout className={styles.layout}>
      {/* Header */}
      <header className={styles.headerBar}>
        <div className={styles.headerContent}>
          <div
            className={styles.headerLeft}
            onClick={() => navigate("/home")}
            style={{ cursor: "pointer" }}
          >
            <img src={meloLogo} alt="Melo" className={styles.headerLogo} />
          </div>
          <div className={styles.headerTagline}>
            AI Social Media & Marketing Manager For Your Business
          </div>
        </div>
      </header>

      {/* Hero — dark, oversized type, single product screenshot */}
      <section className={styles.hero}>
        <div className={styles.heroOrb} aria-hidden />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Marketing that
            <br />
            <span className={styles.heroAccent}>runs itself.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Brand-aware AI that plans, writes, schedules and publishes.
            <br />
            Built for small brands and lean teams.
          </p>
          <Space size={16} className={styles.heroCtas}>
            <Button
              type="primary"
              size="large"
              className={styles.primaryBtn}
              onClick={handleGetStarted}
            >
              Get started
            </Button>
            <Button
              size="large"
              className={styles.ghostBtn}
              onClick={scrollToHowItWorks}
            >
              See how it works <ArrowRightOutlined />
            </Button>
          </Space>

          <div className={styles.heroProduct}>
            <MiniDemo />
          </div>
        </div>
      </section>

      {/* How it works — light section */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div className={styles.sectionWrap}>
          <h2 className={styles.sectionTitle}>
            From idea to published, in four steps.
          </h2>
          <p className={styles.sectionLead}>
            One workflow that replaces a stack of marketing tools. No tabs to
            juggle. No copy-pasting between apps.
          </p>

          <div className={styles.stepGrid}>
            <StepCard
              number="01"
              title="Setup Brand"
              description="Tell Melo your voice, audience and products. It remembers across every conversation."
              thumbSrc={shot("step-1-brand.png")}
            />
            <StepCard
              number="02"
              title="Chat"
              description="Generate post copy, images and ideas through natural conversation."
              thumbSrc={shot("step-2-chat.png")}
            />
            <StepCard
              number="03"
              title="Plan Campaign"
              description="Turn a goal and date range into a multi-platform content schedule in one click."
              thumbSrc={shot("step-3-plan.png")}
            />
            <StepCard
              number="04"
              title="Auto-Publish"
              description="Calendar pushes to LinkedIn and more at the right time. Set it once, it runs itself."
              thumbSrc={shot("step-4-publish.png")}
            />
          </div>
        </div>
      </section>

      {/* Feature deep-dive 1 — dark */}
      <section className={styles.featureDark}>
        <div className={styles.featureRow}>
          <div className={styles.featureCopy}>
            <h2 className={styles.featureTitle}>
              An AI that
              <br />
              <span className={styles.heroAccent}>knows your brand.</span>
            </h2>
            <p className={styles.featureLead}>
              Every reply is shaped by your brand profile. The same chat helps
              you draft, refine, and visualise content without leaving the
              conversation.
            </p>
            <ul className={styles.featureBullets}>
              <li>Brand profile context built into every reply</li>
              <li>Drop images, PDFs and docs straight into chat</li>
              <li>Conversation memory across sessions</li>
            </ul>
          </div>
          <div className={styles.featureVisual}>
            <ScreenshotFrame
              src={shot("feature-chat.png")}
              alt="Brand-aware chat"
            />
          </div>
        </div>
      </section>

      {/* Feature deep-dive 2 — light */}
      <section className={styles.featureLight}>
        <div className={`${styles.featureRow} ${styles.featureRowReverse}`}>
          <div className={styles.featureCopy}>
            <h2 className={styles.featureTitle}>
              Campaigns,
              <br />
              <span className={styles.heroAccentDark}>not just posts.</span>
            </h2>
            <p className={styles.featureLead}>
              Give Melo a goal and a date range. It returns a complete
              multi-platform calendar with copy variants for Instagram,
              LinkedIn, X and more.
            </p>
            <ul className={styles.featureBullets}>
              <li>Goal-based plan generation</li>
              <li>Per-platform copy variants</li>
              <li>Calendar with drag-and-drop scheduling</li>
            </ul>
          </div>
          <div className={styles.featureVisual}>
            <ScreenshotFrame
              src={shot("feature-campaigns.png")}
              alt="Multi-platform campaign calendar"
            />
          </div>
        </div>
      </section>

      {/* Feature deep-dive 3 — dark */}
      <section className={styles.featureDark}>
        <div className={styles.featureRow}>
          <div className={styles.featureCopy}>
            <h2 className={styles.featureTitle}>
              Schedule once.
              <br />
              <span className={styles.heroAccent}>Publish forever.</span>
            </h2>
            <p className={styles.featureLead}>
              Connect LinkedIn once and Melo posts on your behalf at the right
              time. Recurring schedules generate fresh content automatically,
              whether you're posting weekly product updates or building a
              personal brand on LinkedIn.
            </p>
            <ul className={styles.featureBullets}>
              <li>LinkedIn OAuth, one-click connect</li>
              <li>Recurring schedules with fresh AI-generated posts</li>
              <li>Run-now to preview and publish on demand</li>
            </ul>
          </div>
          <div className={styles.featureVisual}>
            <ScreenshotFrame
              src={shot("feature-schedule.png")}
              alt="Recurring schedule"
            />
          </div>
        </div>
      </section>

      {/* Built for */}
      <section className={styles.builtFor}>
        <div className={styles.sectionWrap}>
          <h2 className={styles.sectionTitle}>Built for the people doing it all.</h2>
          <div className={styles.personaGrid}>
            <div className={styles.personaCard}>
              <h3>Independent Brand Owners</h3>
              <p>You make the product, write the captions, and answer DMs. Melo takes the captions off the list.</p>
            </div>
            <div className={styles.personaCard}>
              <h3>Solo & Small Marketing Teams</h3>
              <p>One marketer, five platforms, infinite ideas. Melo turns the plan into shipped posts.</p>
            </div>
            <div className={styles.personaCard}>
              <h3>Content-First Founders</h3>
              <p>Show up on LinkedIn weekly without burning your evenings. Melo schedules and posts for you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className={styles.closingCta}>
        <div className={styles.closingOrb} aria-hidden />
        <div className={styles.closingContent}>
          <h2 className={styles.closingTitle}>
            Stop juggling tools.
            <br />
            <span className={styles.heroAccent}>Start shipping.</span>
          </h2>
          <Button
            type="primary"
            size="large"
            className={`${styles.primaryBtn} ${styles.primaryBtnLarge}`}
            onClick={handleGetStarted}
          >
            Get started free
          </Button>
        </div>
      </section>

      <Footer className={styles.footer}>
        <div className={styles.footerContent}>
          <Paragraph className={styles.footerText}>
            © 2025 Melo. All rights reserved.
          </Paragraph>
          <Space size="large">
            <Button
              type="link"
              className={styles.footerLink}
              onClick={() => navigate("/privacy-policy")}
            >
              Privacy Policy
            </Button>
            <Button
              type="link"
              className={styles.footerLink}
              onClick={() => navigate("/terms-of-service")}
            >
              Terms of Service
            </Button>
            <Button
              type="link"
              className={styles.footerLink}
              onClick={() => navigate("/contact-us")}
            >
              Contact Us
            </Button>
          </Space>
        </div>
      </Footer>

      <AuthModal
        open={isAuthModalOpen}
        onCancel={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </Layout>
  );
}
