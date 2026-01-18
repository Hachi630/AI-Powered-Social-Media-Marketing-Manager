export type WaitForOptions = {
  timeoutMs?: number;
  pollIntervalMs?: number;
  visible?: boolean;
};

const isVisible = (el: Element): boolean => {
  const htmlEl = el as HTMLElement;
  const style = window.getComputedStyle(htmlEl);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (Number(style.opacity) === 0) return false;
  const rect = htmlEl.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

export const waitForSelector = async (
  selector: string,
  { timeoutMs = 10_000, pollIntervalMs = 60, visible = false }: WaitForOptions = {}
): Promise<Element> => {
  const start = Date.now();

  const query = (): Element | null => {
    const el = document.querySelector(selector);
    if (!el) return null;
    if (!visible) return el;
    return isVisible(el) ? el : null;
  };

  const immediate = query();
  if (immediate) return immediate;

  return await new Promise<Element>((resolve, reject) => {
    let resolved = false;
    let finish = (fn: () => void) => {
      if (resolved) return;
      resolved = true;
      try {
        fn();
      } finally {
        observer.disconnect();
      }
    };

    const maybeResolve = () => {
      const el = query();
      if (el) finish(() => resolve(el));
      if (Date.now() - start > timeoutMs) {
        finish(() =>
          reject(
            new Error(
              `waitForSelector timeout after ${timeoutMs}ms: ${selector} (visible=${visible})`
            )
          )
        );
      }
    };

    const observer = new MutationObserver(() => maybeResolve());
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    const interval = window.setInterval(maybeResolve, pollIntervalMs);
    const cleanupInterval = () => window.clearInterval(interval);

    const originalFinish = finish;
    finish = (fn: () => void) => {
      cleanupInterval();
      originalFinish(fn);
    };

    maybeResolve();
  });
};
