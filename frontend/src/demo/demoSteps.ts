export interface DemoStep {
  id: string;
  title: string;
  route?: string;
  target?: string;
  narration: string;
  action?: () => Promise<void> | void;
}

export const demoSteps: DemoStep[] = [
  {
    id: "intro",
    title: "Welcome",
    route: "/dashboard",
    target: "[data-demo-id='demo-banner']",
    narration: "Maya is a cake shop owner. We'll run through onboarding, AI image, plan, calendar, scheduling, brand profile, analytics, and messaging.",
  },
  {
    id: "onboarding",
    title: "Onboarding Form",
    route: "/dashboard",
    target: "[data-demo-id='onboarding-form']",
    narration: "New user onboarding appears right after login.",
  },
  {
    id: "robot",
    title: "AI Robot (Live2D)",
    route: "/dashboard",
    target: "[data-demo-id='onboarding-live2d']",
    narration: "Maya chooses her Live2D assistant.",
    action: () => {
      window.dispatchEvent(
        new CustomEvent("demo-onboarding-step", {
          detail: { step: 8 },
        })
      );
    },
  },
  {
    id: "question",
    title: "Ask a Question",
    route: "/dashboard",
    target: "[data-demo-id='chat-input']",
    narration: "She asks for a 7-day Valentine campaign.",
    action: () => {
      window.dispatchEvent(
        new CustomEvent("elo-send-message", {
          detail: {
            message:
              "I want a 7-day Valentine's campaign for my cake shop. Warm and playful tone.",
          },
        })
      );
    },
  },
  {
    id: "image",
    title: "Generate Image",
    route: "/dashboard",
    target: "[data-demo-id='image-generate']",
    narration: "Generate a hero image inside Dashboard.",
    action: () => {
      window.dispatchEvent(
        new CustomEvent("demo-open-image-modal", {
          detail: {
            prompt:
              "Valentine strawberry cream cake poster, warm, playful, pink-white palette.",
          },
        })
      );
    },
  },
  {
    id: "plan",
    title: "Generate Plan",
    route: "/dashboard",
    target: "[data-demo-id='chat-input']",
    narration: "Generate a 7-day content plan and push to calendar.",
    action: () => {
      window.dispatchEvent(new CustomEvent("demo-open-plan-modal"));
    },
  },
  {
    id: "calendar",
    title: "Calendar Push",
    route: "/calendar",
    target: "[data-demo-id='calendar-grid']",
    narration: "The plan is now scheduled on the calendar.",
  },
  {
    id: "schedule",
    title: "Scheduled Post",
    route: "/calendar",
    target: "[data-demo-id='calendar-event-demo']",
    narration: "Set a time and mark it scheduled.",
    action: () => {
      const el = document.querySelector(
        "[data-demo-id='calendar-event-demo']"
      ) as HTMLElement | null;
      el?.click();
      window.dispatchEvent(
        new CustomEvent("demo-calendar-schedule", {
          detail: { time: "10:00" },
        })
      );
    },
  },
  {
    id: "brand",
    title: "Brand Profile",
    route: "/settings",
    target: "[data-demo-id='brand-profile-form']",
    narration: "Fill brand profile details for Maya's cake shop.",
  },
  {
    id: "analytics",
    title: "Analytics",
    route: "/analytics",
    target: "[data-demo-id='analytics-kpi']",
    narration: "Review KPI highlights and best timing insights.",
  },
  {
    id: "messaging",
    title: "Messaging",
    route: "/messaging",
    target: "[data-demo-id='messaging-panel']",
    narration: "Reply to a customer inquiry quickly.",
  },
  {
    id: "wrap",
    title: "Wrap Up",
    route: "/dashboard",
    target: "[data-demo-id='demo-banner']",
    narration: "End of demo. Restart or exit when ready.",
  },
];
