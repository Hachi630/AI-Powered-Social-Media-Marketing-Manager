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
      // Mark onboarding as completed and enable Live2D widget
      localStorage.setItem("melo_demo_onboarding_done", "true");
      localStorage.setItem("melo_demo_onboarding_completed", "true");

      // Enable ELO in app settings
      const settingsKey = "melo_app_settings";
      try {
        const savedSettings = localStorage.getItem(settingsKey);
        let settings = savedSettings ? JSON.parse(savedSettings) : {};
        settings.enableElo = true;
        localStorage.setItem(settingsKey, JSON.stringify(settings));
      } catch (error) {
        console.error("Failed to update ELO settings:", error);
      }

      // Trigger a custom event to update the user state
      window.dispatchEvent(new CustomEvent("demo-onboarding-completed"));
      // Trigger a custom event to reload app settings
      window.dispatchEvent(new CustomEvent("demo-settings-updated"));

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
    action: () => {
      // Navigate to February 2026
      setTimeout(() => {
        // Find the right arrow button to go to next month
        const buttons = document.querySelectorAll('button[type="button"]');
        let nextButton: HTMLElement | null = null;

        // Look for the button with RightOutlined icon
        buttons.forEach((btn) => {
          const hasRightIcon = btn.querySelector('.anticon-right');
          if (hasRightIcon) {
            nextButton = btn as HTMLElement;
          }
        });

        if (nextButton) {
          nextButton.click();
          console.log('[Demo] Navigated to February 2026');
        } else {
          console.warn('[Demo] Could not find next month button');
        }
      }, 500);
    },
  },
  {
    id: "schedule",
    title: "Scheduled Post",
    route: "/calendar",
    target: "[data-demo-id='calendar-time-picker']",
    narration: "Set a time and mark it scheduled.",
    action: () => {
      // Click the first calendar event to open the detail modal
      setTimeout(() => {
        const firstEvent = document.querySelector(
          "[data-demo-id='calendar-event-demo']"
        ) as HTMLElement | null;
        firstEvent?.click();
      }, 500);
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
    narration: "Review KPI highlights and best timing insights.",
  },
  {
    id: "messaging",
    title: "Messaging",
    route: "/messaging",
    target: "[data-demo-id='messaging-panel']",
    narration: "Send promotional messages to customers quickly.",
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    route: "/dashboard",
    target: "[data-demo-id='chat-input']",
    narration: "Ask me anything! I can guide you through the system features.",
  },
  {
    id: "wrap",
    title: "Wrap Up",
    route: "/dashboard",
    narration: "Demo complete. Thank you for trying Melo!",
  },
];
