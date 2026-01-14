import { useEffect, useRef, useCallback } from 'react';

interface UseInactivityOptions {
  timeout: number; // Timeout in milliseconds (default: 15000 = 15 seconds)
  onInactive: () => void; // Callback when user becomes inactive
  enabled?: boolean; // Whether to enable inactivity detection
}

/**
 * Hook to detect user inactivity
 * Triggers callback after specified timeout of no user activity
 */
export function useInactivity({
  timeout = 15000,
  onInactive,
  enabled = true,
}: UseInactivityOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    lastActivityRef.current = Date.now();

    if (enabled) {
      timeoutRef.current = setTimeout(() => {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity >= timeout) {
          onInactive();
        }
      }, timeout);
    }
  }, [timeout, onInactive, enabled]);

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Reset timer on user activity
    const handleActivity = () => {
      resetTimer();
    };

    // Listen to various user activity events
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Start the timer
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, resetTimer]);

  return {
    resetTimer,
  };
}
