export type DemoTask =
  | { type: "setDemoMode"; enabled: boolean; reset?: boolean }
  | { type: "resetDemoData" }
  | { type: "navigate"; route: string }
  | { type: "waitFor"; selector: string; visible?: boolean; timeoutMs?: number }
  | { type: "spotlight"; selector: string | null; title?: string; narration?: string }
  | { type: "action"; name: string; payload?: unknown }
  | { type: "sleep"; ms: number };

export type DemoSlide = {
  eyebrow: string;
  title: string;
  subtitle: string;
  bullets: string[];
  note?: string;
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
      note: "Opening title slide. Demo stays hidden.",
    },
    tasks: [],
  },
  {
    id: "onboarding",
    title: "Onboarding Form",
    narration: "New users define voice, products, and goals in one guided flow.",
    slide: {
      eyebrow: "Onboarding",
      title: "Set the Brand in Minutes",
      subtitle: "Tone, audience, and product focus shape every output.",
      bullets: [
        "Guided brand profile capture",
        "Custom tone and goals",
        "Immediate impact on AI responses",
      ],
      note: "Highlight how onboarding sets the strategy context.",
    },
    tasks: [
      { type: "setDemoMode", enabled: true, reset: true },
      { type: "navigate", route: "/dashboard" },
      { type: "waitFor", selector: "[data-demo-id='onboarding-form']", visible: true },
      {
        type: "spotlight",
        selector: "[data-demo-id='onboarding-form']",
      },
    ],
  },
  {
    id: "robot",
    title: "Live2D Assistant",
    narration: "Maya picks her AI assistant and continues onboarding.",
    slide: {
      eyebrow: "Assistant",
      title: "A Friendly Face for the Brand",
      subtitle: "The assistant keeps tone consistent across channels.",
      bullets: [
        "Choose the assistant personality",
        "Human voice, brand aligned",
        "Ready for AI conversations",
      ],
      note: "Introduce the AI assistant as a personality anchor.",
    },
    tasks: [
      {
        type: "action",
        name: "onboarding.gotoStep",
        payload: { step: 8 },
      },
      { type: "waitFor", selector: "[data-demo-id='onboarding-live2d']", visible: true },
      {
        type: "spotlight",
        selector: "[data-demo-id='onboarding-live2d']",
      },
    ],
  },
  {
    id: "question",
    title: "Ask a Question",
    narration: "She asks for a 7-day Valentine campaign in a warm tone.",
    slide: {
      eyebrow: "AI Chat",
      title: "Ask, Then Build",
      subtitle: "The assistant turns prompts into structured ideas.",
      bullets: [
        "Natural language requests",
        "Brand-aware suggestions",
        "Immediate draft output",
      ],
      note: "Emphasize speed and brand alignment.",
    },
    tasks: [
      { type: "waitFor", selector: "[data-demo-id='chat-input']", visible: true },
      {
        type: "action",
        name: "chat.sendMessage",
        payload: {
          message:
            "I want a 7-day Valentine's campaign for my cake shop. Warm and playful tone.",
        },
      },
      { type: "sleep", ms: 400 },
      { type: "spotlight", selector: "[data-demo-id='chat-input']" },
    ],
  },
  {
    id: "image",
    title: "Generate Image",
    narration: "Generate a hero image right from the chat.",
    slide: {
      eyebrow: "AI Media",
      title: "Create Visuals Instantly",
      subtitle: "Promotional assets in seconds, on brand.",
      bullets: ["Prompted hero image", "Fast preview", "Ready to schedule"],
      note: "Show the image modal and mention creative control.",
    },
    tasks: [
      {
        type: "action",
        name: "chat.openImageModal",
        payload: {
          prompt:
            "Valentine strawberry cream cake poster, warm, playful, pink-white palette.",
        },
      },
      { type: "waitFor", selector: "[data-demo-id='image-modal']", visible: true },
      { type: "spotlight", selector: "[data-demo-id='image-modal']" },
    ],
  },
  {
    id: "plan",
    title: "Generate Plan",
    narration: "Generate a 7-day content plan and push to calendar.",
    slide: {
      eyebrow: "Content Plan",
      title: "Plan a Week in One Click",
      subtitle: "The assistant outputs a full campaign calendar.",
      bullets: [
        "Auto-generated plan",
        "Optimized timing",
        "One click to calendar",
      ],
      note: "Call out the time saved by automatic planning.",
    },
    tasks: [
      { type: "action", name: "chat.openPlanModal" },
      { type: "waitFor", selector: "[data-demo-id='plan-modal']", visible: true },
      { type: "spotlight", selector: "[data-demo-id='plan-modal']" },
    ],
  },
  {
    id: "calendar",
    title: "Calendar Push",
    narration: "The plan is now scheduled on the calendar.",
    slide: {
      eyebrow: "Calendar",
      title: "Every Post Finds Its Date",
      subtitle: "Auto-filled schedule across platforms.",
      bullets: ["Calendar view", "Multi-platform posts", "Editable details"],
      note: "Show the calendar populated with demo items.",
    },
    tasks: [
      { type: "navigate", route: "/calendar" },
      { type: "waitFor", selector: "[data-demo-id='calendar-grid']", visible: true },
      { type: "spotlight", selector: "[data-demo-id='calendar-grid']" },
    ],
  },
  {
    id: "schedule",
    title: "Scheduled Post",
    narration: "Adjust time and mark the post as scheduled.",
    slide: {
      eyebrow: "Scheduling",
      title: "One Post, Fully Detailed",
      subtitle: "Edit timing and status with confidence.",
      bullets: ["Open event drawer", "Pick time", "Mark as scheduled"],
      note: "Show the scheduling controls quickly.",
    },
    tasks: [
      { type: "waitFor", selector: "[data-demo-id='calendar-event-demo']", visible: true },
      { type: "action", name: "calendar.openDemoEvent" },
      { type: "waitFor", selector: "[data-demo-id='calendar-event-modal']", visible: true },
      {
        type: "action",
        name: "calendar.schedule",
        payload: { time: "10:00" },
      },
      { type: "spotlight", selector: "[data-demo-id='calendar-status-badge']" },
    ],
  },
  {
    id: "brand",
    title: "Brand Profile",
    narration: "Capture the full brand profile to keep the AI consistent.",
    slide: {
      eyebrow: "Brand Profile",
      title: "Always On-Brand",
      subtitle: "A single source of truth for tone and audience.",
      bullets: ["Brand details", "Audience definition", "Goal tracking"],
      note: "Mention the structured fields used by AI.",
    },
    tasks: [
      { type: "navigate", route: "/settings" },
      { type: "waitFor", selector: "[data-demo-id='brand-profile-form']", visible: true },
      { type: "spotlight", selector: "[data-demo-id='brand-profile-form']" },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    narration: "Review KPI highlights and best timing insights.",
    slide: {
      eyebrow: "Analytics",
      title: "See What Works",
      subtitle: "Performance signals guide the next plan.",
      bullets: ["KPI overview", "Best posting times", "Campaign summary"],
      note: "Point to the high-level KPI block.",
    },
    tasks: [
      { type: "navigate", route: "/analytics" },
      { type: "waitFor", selector: "[data-demo-id='analytics-kpi']", visible: true },
      { type: "spotlight", selector: "[data-demo-id='analytics-kpi']" },
    ],
  },
  {
    id: "messaging",
    title: "Messaging",
    narration: "Reply to customers quickly with context.",
    slide: {
      eyebrow: "Messaging",
      title: "Respond in Seconds",
      subtitle: "Centralized conversations with AI assist.",
      bullets: ["Customer inbox", "Suggested replies", "Fast follow-ups"],
      note: "Show the main messaging panel.",
    },
    tasks: [
      { type: "navigate", route: "/messaging" },
      { type: "waitFor", selector: "[data-demo-id='messaging-panel']", visible: true },
      { type: "spotlight", selector: "[data-demo-id='messaging-panel']" },
    ],
  },
  {
    id: "wrap",
    title: "Wrap Up",
    narration: "End of demo. Reset or exit when ready.",
    slide: {
      eyebrow: "Wrap",
      title: "Automation, Start to Finish",
      subtitle: "Every step now runs hands-free.",
      bullets: ["Fully scripted demo", "Reliable timing", "Live product UI"],
      note: "Invite questions and end the walkthrough.",
    },
    tasks: [
      { type: "navigate", route: "/dashboard" },
      { type: "waitFor", selector: "[data-demo-id='demo-banner']", visible: true },
      { type: "spotlight", selector: "[data-demo-id='demo-banner']" },
    ],
  },
];
