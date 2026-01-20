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
  slideType?: "overview" | "feature" | "cover" | "link" | "dual-image" | "vertical-list" | "image-showcase" | "image-zoom" | "grid-2x2" | "grid-2x3" | "template-cards" | "code-block";
  // Template cards for 2x2 grid display
  templateCards?: {
    icon: string;
    iconBgColor: string;
    borderColor: string;
    title: string;
    description: string;
  }[];
  // Code block content
  codeContent?: string;
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
  // Grid 2x2 images
  gridImages?: string[];
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
      image: "/img/kirby-busy.svg",
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
      image: "/img/kirby-guide.svg",
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
        { icon: "☁️", label: "CLOUD" },
        { icon: "📖", label: "USER GUIDE" },
        { icon: "🤖", label: "AI ROBOT" },
        { icon: "📋", label: "TEMPLATES" },
        { icon: "🔌", label: "MCP" },
        { icon: "✨", label: "UI POLISH" },
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
      image: "/img/kirby-robot.svg",
      transition: "concave",
      note: "AI Robot introduction slide.",
    },
  },
  // {
  //   id: "ai-robot-demo",
  //   title: "AI Robot Demo",
  //   narration: "Meet our AI assistant.",
  //   slide: {
  //     eyebrow: "",
  //     title: "",
  //     subtitle: "",
  //     bullets: [],
  //     slideType: "image-showcase",
  //     image: "/img/entrance_transparent.webp",
  //     transition: "fade",
  //     note: "AI Robot image showcase.",
  //   },
  // },
  //   {
  //   id: "ai-robot-mascots",
  //   title: "AI Robot Mascots",
  //   narration: "Meet our AI assistant mascots.",
  //   slide: {
  //     eyebrow: "",
  //     title: "",
  //     subtitle: "",
  //     bullets: [],
  //     slideType: "grid-2x2",
  //     gridImages: [
  //       "/img/mascot1_float.gif",
  //       "/img/mascot2_float.gif",
  //       "/img/mascot3_float.gif",
  //       "/img/mascot4_float.gif",
  //     ],
  //     transition: "fade",
  //     note: "AI Robot mascots grid slide.",
  //   },
  // },
  {
    id: "templates-intro",
    title: "Templates",
    narration: "We created templates for users who don't know how to write prompts.",
    slide: {
      eyebrow: "",
      title: "We created templates for users who don't know how to write prompts.",
      subtitle: "",
      bullets: [],
      slideType: "template-cards",
      templateCards: [
        {
          icon: "☕",
          iconBgColor: "#FEE2E2",
          borderColor: "#F87171",
          title: "Food & Restaurant",
          description: "Create engaging social media content for your restaurant, cafe, or bakery",
        },
        {
          icon: "👗",
          iconBgColor: "#D1FAE5",
          borderColor: "#34D399",
          title: "Fashion & Apparel",
          description: "Create product descriptions and styling suggestions for your clothing or accessory store",
        },
        {
          icon: "💖",
          iconBgColor: "#FCE7F3",
          borderColor: "#F472B6",
          title: "Beauty & Salon",
          description: "Create service showcases and case studies for your beauty salon, hair salon, or nail salon",
        },
        {
          icon: "🏠",
          iconBgColor: "#D1FAE5",
          borderColor: "#6EE7B7",
          title: "Home & Decor",
          description: "Create product showcases and styling inspiration for your furniture or home decor store",
        },
      ],
      transition: "concave",
      note: "Templates introduction slide with 4 template cards.",
    },
  },
  {
    id: "template-food",
    title: "Food & Restaurant Template",
    narration: "Template prompt for food and restaurant businesses.",
    slide: {
      eyebrow: "",
      title: "Food & Restaurant",
      subtitle: "",
      bullets: [],
      slideType: "code-block",
      codeContent: `I'm a [restaurant/cafe/bakery] owner and want to create social media marketing content. Please help me:

1. Create an attractive Instagram post copy for our new [dish name]
2. Include product features, taste descriptions, and recommendations
3. Use warm and appealing language style
4. Add appropriate hashtag suggestions
5. Provide the best posting time recommendations

Please generate complete social media content for me.`,
      transition: "slide",
      note: "Food & Restaurant template prompt.",
    },
  },
  {
    id: "mcp-intro",
    title: "MCP Introduction",
    narration: "Ensuring output quality via a custom MCP framework.",
    slide: {
      eyebrow: "",
      title: "Ensuring output quality via a custom MCP framework.",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      image: "/img/MCP.png",
      transition: "concave",
      note: "MCP introduction slide.",
    },
  },
  {
    id: "mcp-architecture",
    title: "MCP Architecture",
    narration: "Our MCP Copywriter architecture with RAG context injection.",
    slide: {
      eyebrow: "",
      title: "",
      subtitle: "",
      bullets: [],
      slideType: "image-showcase",
      image: "/img/mcp-architecture.svg",
      transition: "fade",
      note: "MCP Copywriter architecture diagram.",
    },
  },
  // {
  //   id: "templates-demo",
  //   title: "Templates Demo",
  //   narration: "See our template cards in action.",
  //   slide: {
  //     eyebrow: "",
  //     title: "",
  //     subtitle: "",
  //     bullets: [],
  //     slideType: "image-zoom",
  //     image: "/img/templates-screenshot.png",
  //     transition: "fade",
  //     note: "Templates screenshot with zoom animation.",
  //   },
  // },
  // {
  //   id: "skills-intro",
  //   title: "Skills Introduction",
  //   narration: "What are skills.",
  //   slide: {
  //     eyebrow: "",
  //     title: "Skills are task-focused AI capabilities\nthat allow the assistant to understand user intent and perform specific actions more accurately.",
  //     subtitle: "",
  //     bullets: [],
  //     slideType: "feature",
  //     transition: "concave",
  //     note: "Skills introduction slide.",
  //   },
  // },
  // {
  //   id: "skills-custom",
  //   title: "Custom Skills",
  //   narration: "Our custom marketing skills.",
  //   slide: {
  //     eyebrow: "",
  //     title: "We designed our own marketing-focused skills\nto improve output quality in real business scenarios.",
  //     subtitle: "",
  //     bullets: [],
  //     slideType: "feature",
  //     transition: "concave",
  //     note: "Custom marketing skills slide.",
  //   },
  // },
  {
    id: "ui-redesign",
    title: "UI Redesign",
    narration: "We redesigned our interface with flat design.",
    slide: {
      eyebrow: "",
      title: "We redesigned our interface with flat gradient design.",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      image: "/img/paint.png",
      transition: "concave",
      note: "UI redesign introduction slide.",
    },
  },
  {
    id: "ui-screenshots",
    title: "UI Screenshots",
    narration: "Screenshots of our redesigned interface.",
    slide: {
      eyebrow: "",
      title: "",
      subtitle: "",
      bullets: [],
      slideType: "grid-2x3",
      gridImages: [
        "/img/S1.png",
        "/img/S2.png",
        "/img/S3.png",
        "/img/S4.png",
        "/img/S5.png",
        "/img/S6.png",
      ],
      transition: "fade",
      note: "UI screenshots 2x3 grid.",
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
      image: "/img/kirby-testing.png",
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
      title: "",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      image: "/img/Thanks.png",
      transition: "concave",
      note: "Thank you slide.",
    },
  },
];
