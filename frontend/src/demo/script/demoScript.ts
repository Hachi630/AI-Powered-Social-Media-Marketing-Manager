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
    narration: "",
    slide: {
      eyebrow: "Sprint 3",
      title: "MELO - AI-POWERED SOCIAL MEDIA & MARKETING ASSISTANT",
      subtitle: "Lulin Yang, Kiki Xing, Tazwar Habib, Weijing Zhang, Xingyuan Zhou",
      bullets: [],
      slideType: "cover",
      transition: "zoom",
      note: "Hi everyone, this is our Sprint 3 presentation for MELO, an AI-powered social media and marketing assistant. \nI’ll briefly go through the problem we’re addressing, our solution approach, and what we’ve built in this sprint.",
    },
  },
  {
    id: "problem",
    title: "Problem Statement",
    narration: "",
    slide: {
      eyebrow: "",
      title: "Small businesses don't have time for marketing ops.",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      image: "/img/kirby-busy.svg",
      transition: "concave",
      note: "To quickly recap the problem, small businesses usually don’t have the time or resources for structured marketing operations. \nTasks like planning content, writing posts, and managing multiple platforms are often done by one person, alongside other business responsibilities. \nThis makes marketing fragmented, inefficient, and hard to maintain consistently.",
    },
  },
  {
    id: "solution",
    title: "Solution",
    narration: "",
    slide: {
      eyebrow: "",
      title: "We turn marketing ops into a guided workflow.",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      image: "/img/kirby-guide.svg",
      transition: "concave",
      note: "Our solution focuses on turning these scattered marketing tasks into a guided workflow. Instead of isolated tools, MELO supports users step by step — from defining their brand, to creating content, to planning and publishing. \nAI is used to assist and guide the process, while users remain in control of final decisions.",
    },
  },
  {
    id: "overview",
    title: "Overview",
    narration: "",
    slide: {
      eyebrow: "",
      title: "What We've Built",
      subtitle: "",
      bullets: [],
      slideType: "overview",
      overviewIcons: [
        { icon: "☁️", label: "CLOUD" },
        { icon: "🤖", label: "AI ROBOT" },
        { icon: "📋", label: "TEMPLATES" },
        { icon: "🔌", label: "MCP" },
        { icon: "✨", label: "UI POLISH" },
        { icon: "📖", label: "USER GUIDE" },
      ],
      transition: "convex",
      note: "In this sprint, we focused on improving how users interact with the system. \nWe enhanced the AI assistant so it can guide users and help answer questions about how the system works, rather than only generating content. This makes the platform easier to understand, especially for first-time users. \nWe also introduced structured templates to support users who are not familiar with prompt writing. These templates help users get higher-quality and more consistent AI outputs without needing advanced prompt engineering skills. \nIn addition, we refined the user interface to make the overall visual style more consistent and polished, improving usability across different parts of the system.",
    },
  },
  {
    id: "cloud",
    title: "Cloud Deployment",
    narration: "",
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
      note: "Our project is already deployed and can be accessed online. Users can open the web app, and the system runs end to end in a real cloud environment.",
    },
  },

  {
    id: "ai-robot",
    title: "AI Robot",
    narration: "",
    slide: {
      eyebrow: "",
      title: "We added an AI Robot to help users use our system.",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      image: "/img/kirby-robot.svg",
      transition: "concave",
      note: "We added an AI robot to guide users while they use the system. It helps users understand what to do next, especially when they are new to the workflow. Users can click the robot to open a chat box and ask for help. The robot also gives context tips based on the current page, so the guidance matches what the user is doing. \nIt can show small tip bubbles, like reminders and quick instructions, and these can disappear automatically to keep the UI clean. The robot is also draggable, so users can place it anywhere and keep it out of the way. Overall, it reduces confusion, speeds up onboarding, and helps users finish tasks more smoothly.",
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
    narration: "",
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
          description: "Now, I’d like to introduce two key features: the Templates system and the MCP framework.\n First, I’ll talk about Templates. During development, we found that many small business owners want to use AI for marketing, but don’t know how to write effective prompts or where to start. \nTo solve this, we created a template system tailored to different industries, allowing users to get started quickly.\n We currently have four main template categories:",
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
    narration: "",
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
      note: "Food & Restaurant, for restaurants, cafes, and bakeries, helping generate engaging Instagram posts with product highlights and taste descriptions.\n Fashion & Apparel, providing product descriptions and styling suggestions for clothing and accessory stores.\n Beauty & Salon, helping salons showcase services and customer case studies.\n Home & Decor, offering product showcases and styling inspiration for furniture and home decor stores.\n Each template includes structured prompts. Users simply fill in basic information, such as the store or product name, and the system generates professional marketing content. This allows even users with no AI experience to easily create high-quality social media posts.",
    },
  },
  {
    id: "mcp-intro",
    title: "MCP Introduction",
    narration: "",
    slide: {
      eyebrow: "",
      title: "Ensuring output quality via a custom MCP framework.",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      image: "/img/MCP.png",
      transition: "concave",
      note: "Now, let me introduce the MCP framework. MCP stands for Model Context Protocol, a custom framework we developed to improve the quality and consistency of AI-generated content.",
    },
  },
  {
    id: "mcp-architecture",
    title: "MCP Architecture",
    narration: "",
    slide: {
      eyebrow: "",
      title: "",
      subtitle: "",
      bullets: [],
      slideType: "image-showcase",
      image: "/img/mcp-architecture.svg",
      transition: "fade",
      note: "Standard AI output often lacks industry context and brand alignment. To address this, our MCP framework uses RAG (Retrieval-Augmented Generation) to inject relevant marketing knowledge, brand guidelines, and best practices into the generation process.\n When a user requests content, the system first retrieves contextual information—such as industry writing style, brand voice, and target audience—and then combines it with the user’s input to generate more accurate, business-aligned content.\n This approach improves both content quality and consistency, ensuring a unified brand voice across social posts, product descriptions, and marketing copy.\n Together with the Templates system, MCP makes MELO not just an AI tool, but an intelligent marketing assistant designed for small businesses.",
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
    narration: "",
    slide: {
      eyebrow: "",
      title: "We redesigned our interface with flat gradient design.",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      image: "/img/paint.png",
      transition: "concave",
      note: "In Sprint 3, we changed our user interface to use flat gradient design. This means we removed heavy shadows and 3D effects. Instead, we use soft gradients that look clean and modern. \nThe new design makes our app easier to use. We use the same gradient style on all pages - from the dashboard to the calendar. This creates a consistent look across the whole application.",
    },
  },
  {
    id: "ui-screenshots",
    title: "UI Screenshots",
    narration: "",
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
      note: "You can see six screenshots here. They show our clean and easy-to-use interface. The first one is our dashboard with AI content templates for restaurants, fashion, beauty, and home decoration. The second shows our calendar where you can schedule and drag marketing campaigns. The third is the brand profile page with settings and progress tracking. \nThe fourth screenshot shows our social dashboard with LinkedIn, Twitter, Instagram, and Facebook all in one place. The fifth shows analytics with charts and numbers. The last one is our messaging platform for WhatsApp and SMS. All these pages use the same flat gradient design we just talked about.",
    },
  },
  {
    id: "sprint-4-goals",
    title: "Sprint 4 Goals",
    narration: "",
    slide: {
      eyebrow: "",
      title: "Sprint 4 Goals: Testing & Polish",
      subtitle: "",
      bullets: [],
      slideType: "feature",
      image: "/img/kirby-testing.png",
      transition: "concave",
      note: "For Sprint 4, we will focus on testing and polish. We will test all our main features and make sure everything works well on different devices. We will also improve animations, fix errors, and write privacy policy documents. Our goal is to make a production-ready app that works well and is easy to use. Next, Tazwar will show you our demo",
    },
  },
    {
    id: "live-demo",
    title: "Live Demo",
    narration: "",
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
