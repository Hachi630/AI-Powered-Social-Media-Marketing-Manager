export type DemoTask =
  | { type: "sleep"; ms: number }
  | { type: "spotlight"; selector: string; title?: string; narration?: string }
  | { type: "setDemoMode"; enabled: boolean; reset?: boolean }
  | { type: "resetDemoData" }
  | { type: "navigate"; route: string }
  | { type: "waitFor"; selector: string; visible?: boolean; timeoutMs?: number }
  | { type: "action"; name: string; payload?: unknown };

export type DemoSlideCard = {
  title: string;
  description: string;
};

export type DemoSlideInfoCard = {
  label: string;
  items: string[];
};

export type DemoSlideOverviewIcon = {
  icon: string; // icon name, emoji, or image path
  label: string;
  isImage?: boolean; // true if icon is an image path
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
  slideType?: "overview" | "feature" | "cover" | "link" | "dual-image" | "vertical-list" | "image-showcase" | "image-zoom";
  overviewIcons?: DemoSlideOverviewIcon[];
  featureTagline?: string;
  transition?: string; // reveal.js transition
  link?: string; // URL for link slide type
  // Dual image slide type
  images?: {
    src: string;
    position: "left" | "right";
    order: number;
  }[];
  // Vertical list items
  listItems?: {
    title: string;
    description: string;
  }[];
};

export type DemoStep = {
  id: string;
  title: string;
  narration: string;
  slide: DemoSlide;
  tasks?: DemoTask[];
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
      transition: "zoom",
      note: "Opening title slide.",
    },
  },
  {
    id: "problem",
    title: "Problem Statement",
    narration: "The challenge small businesses face.",
    slide: {
      eyebrow: "",
      title: "Small businesses don't have time for marketing ops.",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      transition: "concave",
      note: "Problem statement slide.",
    },
  },
  {
    id: "solution",
    title: "Solution",
    narration: "Our solution to the problem.",
    slide: {
      eyebrow: "",
      title: "We turn marketing ops into a guided workflow.",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      transition: "concave",
      note: "Solution statement slide.",
    },
  },
  {
    id: "overview",
    title: "Overview",
    narration: "What we've built in Sprint 3.",
    slide: {
      eyebrow: "",
      title: "What We've Built",
      subtitle: "",
      bullets: [],
      slideType: "overview",
      overviewIcons: [
        { icon: "☁️", label: "Cloud" },
        { icon: "📖", label: "User Guide" },
        { icon: "🤖", label: "AI Robot" },
        { icon: "📋", label: "Templates" },
        { icon: "✨", label: "UI Polish" },
      ],
      transition: "convex",
      note: "Overview slide with 5 icons.",
    },
  },
  {
    id: "cloud",
    title: "Cloud Deployment",
    narration: "Our cloud infrastructure.",
    slide: {
      eyebrow: "",
      title: "",
      subtitle: "",
      bullets: [],
      slideType: "overview",
      overviewIcons: [
        { icon: "/img/Amplify.svg", label: "AWS Amplify", isImage: true },
        { icon: "/img/Render logomark - Black.svg", label: "Render", isImage: true },
        { icon: "/img/Simple Storage Service.svg", label: "AWS S3", isImage: true },
        { icon: "/img/mongodb-svgrepo-com.svg", label: "MongoDB Atlas", isImage: true },
      ],
      transition: "slide",
      note: "Cloud infrastructure with 4 components.",
    },
  },
  {
    id: "live-demo",
    title: "Live Demo",
    narration: "Visit our live deployment.",
    slide: {
      eyebrow: "",
      title: "Try it live",
      subtitle: "",
      bullets: [],
      slideType: "link",
      link: "https://main.d1sxixpats4kxg.amplifyapp.com/",
      transition: "fade",
      note: "Live deployment link.",
    },
  },
  {
    id: "ai-robot",
    title: "AI Robot",
    narration: "We added an AI Robot to help users navigate our system.",
    slide: {
      eyebrow: "",
      title: "We added an AI Robot to help users use our system.",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      transition: "concave",
      note: "AI Robot introduction slide.",
    },
  },
  {
    id: "ai-robot-demo",
    title: "AI Robot Demo",
    narration: "Meet our AI assistant.",
    slide: {
      eyebrow: "",
      title: "",
      subtitle: "",
      bullets: [],
      slideType: "image-showcase",
      image: "/img/entrance_transparent.webp",
      transition: "fade",
      note: "AI Robot image showcase.",
    },
  },
  {
    id: "templates-intro",
    title: "Templates",
    narration: "We created templates for users who don't know how to write prompts.",
    slide: {
      eyebrow: "",
      title: "We created templates for users who don't know how to write prompts.",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      transition: "concave",
      note: "Templates introduction slide.",
    },
  },
  {
    id: "templates-demo",
    title: "Templates Demo",
    narration: "See our template cards in action.",
    slide: {
      eyebrow: "",
      title: "",
      subtitle: "",
      bullets: [],
      slideType: "image-zoom",
      image: "/img/templates-screenshot.png",
      transition: "fade",
      note: "Templates screenshot with zoom animation.",
    },
  },
  {
    id: "sprint-4-goals",
    title: "Sprint 4 Goals",
    narration: "Our goals for Sprint 4.",
    slide: {
      eyebrow: "",
      title: "Sprint 4 Goals: Testing & Polish",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      transition: "concave",
      note: "Sprint 4 goals slide.",
    },
  },
  {
    id: "thanks",
    title: "Thanks",
    narration: "Thank you.",
    slide: {
      eyebrow: "",
      title: "Thanks",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      transition: "concave",
      note: "Thank you slide.",
    },
  },
];
