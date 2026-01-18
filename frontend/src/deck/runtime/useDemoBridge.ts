import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PROTOCOL_VERSION,
  isDemoEnvelope,
  type DemoCommand,
  type DemoAckEnvelope,
  type DemoErrEnvelope,
  type DemoEmbedReady,
} from "../../demo/bridge/protocol";

type PendingEntry = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeoutId: number;
};

const randomId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export type DemoBridgeState = {
  ready: boolean;
  sessionId: string | null;
  lastError: string | null;
  clearError: () => void;
  send: (cmd: DemoCommand, timeoutMs?: number) => Promise<unknown>;
  resetSession: () => void;
};

export const useDemoBridge = (
  frameRef: React.RefObject<HTMLIFrameElement>
): DemoBridgeState => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const pending = useRef<Map<string, PendingEntry>>(new Map());
  const origin = useMemo(() => window.location.origin, []);

  const clearPending = useCallback((message: string) => {
    pending.current.forEach((entry) => {
      window.clearTimeout(entry.timeoutId);
      entry.reject(new Error(message));
    });
    pending.current.clear();
  }, []);

  const resetSession = useCallback(() => {
    setReady(false);
    setSessionId(null);
    clearPending("Session reset");
  }, [clearPending]);

  const clearError = useCallback(() => setLastError(null), []);

  const send = useCallback(
    (cmd: DemoCommand, timeoutMs = 12_000): Promise<unknown> => {
      if (!frameRef.current?.contentWindow) {
        return Promise.reject(new Error("Demo iframe not ready"));
      }
      if (!sessionId) {
        return Promise.reject(new Error("Demo session not ready"));
      }

      const id = randomId();
      const payload = {
        kind: "DEMO_CMD",
        version: PROTOCOL_VERSION,
        sessionId,
        id,
        cmd,
      };

      return new Promise((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          pending.current.delete(id);
          reject(new Error(`Command timeout: ${cmd.type}`));
        }, timeoutMs);

        pending.current.set(id, { resolve, reject, timeoutId });
        frameRef.current?.contentWindow?.postMessage(payload, origin);
      });
    },
    [frameRef, origin, sessionId]
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isDemoEnvelope(event.data)) return;

      const data = event.data;
      if (data.kind === "DEMO_EMBED_READY") {
        const readyMsg = data as DemoEmbedReady;
        setSessionId(readyMsg.sessionId);
        setReady(true);
        setLastError(null);
        clearPending("Session refreshed");
        return;
      }

      if (data.kind === "DEMO_ACK") {
        const ack = data as DemoAckEnvelope;
        const entry = pending.current.get(ack.id);
        if (!entry) return;
        window.clearTimeout(entry.timeoutId);
        pending.current.delete(ack.id);
        entry.resolve(ack.result);
        return;
      }

      if (data.kind === "DEMO_ERR") {
        const err = data as DemoErrEnvelope;
        const entry = pending.current.get(err.id);
        if (entry) {
          window.clearTimeout(entry.timeoutId);
          pending.current.delete(err.id);
          entry.reject(new Error(err.error?.message || "Command failed"));
        } else {
          setLastError(err.error?.message || "Command failed");
        }
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [clearPending, frameRef, origin]);

  return { ready, sessionId, lastError, clearError, send, resetSession };
};

