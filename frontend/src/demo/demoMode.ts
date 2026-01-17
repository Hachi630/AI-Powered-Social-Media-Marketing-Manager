const DEMO_MODE_KEY = "melo_demo_mode";
const DEMO_PREV_TOKEN_KEY = "melo_demo_prev_token";
const DEMO_TOKEN_KEY = "melo_demo_token";

export const isDemoBuild = (): boolean =>
  import.meta.env.VITE_DEMO === "1";

export const isEmbedMode = (): boolean =>
  new URLSearchParams(window.location.search).get("embed") === "1";

export const isDeckPage = (): boolean =>
  window.location.pathname === "/deck";

export const isDemoMode = (): boolean =>
  isDemoBuild() &&
  !isDeckPage() &&
  (isEmbedMode() || localStorage.getItem(DEMO_MODE_KEY) === "true");

export const getDemoToken = (): string =>
  localStorage.getItem(DEMO_TOKEN_KEY) || "demo-token";

export const enableDemoMode = (): void => {
  if (!isDemoBuild()) return;
  const currentToken = localStorage.getItem("token");
  if (currentToken && currentToken !== getDemoToken()) {
    localStorage.setItem(DEMO_PREV_TOKEN_KEY, currentToken);
  }
  localStorage.setItem(DEMO_TOKEN_KEY, getDemoToken());
  localStorage.setItem("token", getDemoToken());
  localStorage.setItem(DEMO_MODE_KEY, "true");
};

export const disableDemoMode = (): void => {
  localStorage.removeItem(DEMO_MODE_KEY);
  const previousToken = localStorage.getItem(DEMO_PREV_TOKEN_KEY);
  if (previousToken) {
    localStorage.setItem("token", previousToken);
    localStorage.removeItem(DEMO_PREV_TOKEN_KEY);
  } else {
    localStorage.removeItem("token");
  }
  localStorage.removeItem(DEMO_TOKEN_KEY);
};

export const resetDemoMode = (): void => {
  localStorage.removeItem("melo_demo_onboarding_done");
  localStorage.removeItem("melo_demo_calendar_items");
  localStorage.removeItem("melo_demo_chat_conversations");
  localStorage.removeItem("melo_demo_contacts");
  localStorage.removeItem("melo_demo_conversations");
  localStorage.removeItem("melo_demo_brand_profile");
};
