export type DemoAction = (payload: unknown) => Promise<unknown> | unknown;

const dispatch = (name: string, detail?: Record<string, unknown>) => {
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

const getPayload = (payload: unknown): Record<string, unknown> =>
  typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

export const demoActions: Record<string, DemoAction> = {
  "onboarding.gotoStep": (payload) => {
    const step = getPayload(payload).step as number | undefined;
    dispatch("demo-onboarding-step", { step });
  },
  "chat.sendMessage": (payload) => {
    const message = getPayload(payload).message as string | undefined;
    dispatch("elo-send-message", { message });
  },
  "chat.openImageModal": (payload) => {
    const prompt = getPayload(payload).prompt as string | undefined;
    dispatch("demo-open-image-modal", { prompt });
  },
  "chat.openPlanModal": () => {
    dispatch("demo-open-plan-modal");
  },
  "calendar.openDemoEvent": () => {
    (document.querySelector("[data-demo-id='calendar-event-demo']") as HTMLElement | null)?.click();
  },
  "calendar.schedule": (payload) => {
    const time = getPayload(payload).time as string | undefined;
    dispatch("demo-calendar-schedule", { time });
  },
};
