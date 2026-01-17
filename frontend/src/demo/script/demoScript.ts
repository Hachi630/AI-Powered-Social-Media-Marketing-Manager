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
  slideType?: "overview" | "feature" | "cover" | "link" | "dual-image" | "vertical-list";
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
      transition: "fade",
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
      transition: "fade",
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
      transition: "fade",
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
      transition: "fade",
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
    id: "what-are-skills",
    title: "What are Skills?",
    narration: "Explaining what skills are.",
    slide: {
      eyebrow: "",
      title: "Skills",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      featureTagline: "Reusable modules that perform a specific task with clear inputs and outputs.",
      transition: "fade",
      note: "Skills definition slide.",
    },
  },
  {
    id: "skills-workflow",
    title: "Skills Workflow",
    narration: "How we use skills in our development process.",
    slide: {
      eyebrow: "",
      title: "",
      subtitle: "",
      bullets: [],
      slideType: "vertical-list",
      listItems: [
        {
          title: "Spec-kit (Define)",
          description: "Turn ideas into a clear, testable spec (scope, flows, acceptance criteria)",
        },
        {
          title: "Claude Skills (Build)",
          description: "Implement features as reusable \"skills\" (e.g., post generation, scheduling, file upload)",
        },
        {
          title: "Outcome",
          description: "Faster iteration, consistent behavior, easier to extend",
        },
      ],
      transition: "fade",
      note: "Skills workflow with three stages.",
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
      transition: "fade",
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
      transition: "fade",
      note: "Thank you slide.",
    },
  },
];
