export type DemoTask =
  | { type: "setDemoMode"; enabled: boolean; reset?: boolean }
  | { type: "resetDemoData" }
  | { type: "navigate"; route: string }
  | { type: "waitFor"; selector: string; visible?: boolean; timeoutMs?: number }
  | { type: "spotlight"; selector: string | null; title?: string; narration?: string }
  | { type: "action"; name: string; payload?: unknown }
  | { type: "sleep"; ms: number };

export type DemoSlideCard = {
  title: string;
  description: string;
};

export type DemoSlideInfoCard = {
  label: string;
  items: string[];
};

export type DemoSlideOverviewIcon = {
  icon: string; // icon name or emoji
  label: string;
};

export type DemoSlide = {
  eyebrow: string;
  title: string;
  subtitle: string;
  bullets: string[];
  cards?: DemoSlideCard[];
  infoCards?: DemoSlideInfoCard[];
  image?: string;
  imageSticker?: string;
  note?: string;
  // Keynote style additions
  slideType?: "overview" | "feature" | "cover";
  overviewIcons?: DemoSlideOverviewIcon[];
  featureTagline?: string;
  transition?: string; // reveal.js transition
};

export type DemoStep = {
  id: string;
  title: string;
  narration: string;
  slide: DemoSlide;
  tasks: DemoTask[];
};

export const demoScript: DemoStep[] = [
  {
    id: "intro",
    title: "Welcome",
    narration: "MELO VP presentation opening.",
    slide: {
      eyebrow: "Sprint 3",
      title: "MELO - AI-POWERED SOCIAL MEDIA & MARKETING ASSISTANT",
      subtitle: "Lulin Yang, Kiki Xing, Tazwar Habib, Weijing Zhang, Xingyuan Zhou",
      bullets: [],
      slideType: "cover",
      note: "Opening title slide. Demo stays hidden.",
    },
    tasks: [],
  },
  {
    id: "overview",
    title: "Overview",
    narration: "What we've built in Sprint 3.",
    slide: {
      eyebrow: "",
      title: "What We've Built",
      subtitle: "Sprint 3 — five upgrades for a stable, guided demo",
      bullets: [],
      slideType: "overview",
      overviewIcons: [
        { icon: "☁️", label: "Cloud" },
        { icon: "📖", label: "User Guide" },
        { icon: "🤖", label: "AI Robot" },
        { icon: "📋", label: "Templates" },
        { icon: "✨", label: "UI Polish" },
      ],
      transition: "fade",
      note: "Overview slide with 5 icons.",
    },
    tasks: [],
  },
];
