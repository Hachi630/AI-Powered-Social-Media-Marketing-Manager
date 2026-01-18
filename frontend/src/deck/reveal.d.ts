interface RevealOptions {
  hash?: boolean;
  controls?: boolean;
  progress?: boolean;
  center?: boolean;
  transition?: string;
  backgroundTransition?: string;
  embedded?: boolean;
  width?: string | number;
  height?: string | number;
  margin?: number;
  minScale?: number;
  maxScale?: number;
}

interface RevealEvent {
  indexh: number;
  indexv?: number;
  previousSlide?: HTMLElement;
  currentSlide?: HTMLElement;
}

class Reveal {
  constructor(element: HTMLElement, options?: RevealOptions);
  initialize(): Promise<void>;
  destroy(): void;
  slide(index: number): void;
  next(): void;
  prev(): void;
  getIndices(): { h: number; v: number };
  on(event: 'slidechanged', callback: (event: RevealEvent) => void): void;
  off(event: 'slidechanged', callback: (event: RevealEvent) => void): void;
}

declare module 'reveal.js' {
  export default Reveal;
}

declare module 'reveal.js/js/reveal.js' {
  export default Reveal;
}
