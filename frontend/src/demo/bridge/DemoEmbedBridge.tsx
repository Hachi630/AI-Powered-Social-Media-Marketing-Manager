import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { demoActions } from "../actions/demoActions";
import { disableDemoMode, enableDemoMode, resetDemoMode } from "../demoMode";
import { isDemoEnvelope, PROTOCOL_VERSION, type DemoCmdEnvelope } from "./protocol";
import SpotlightOverlay from "./SpotlightOverlay";
import { waitForSelector } from "../utils/waitFor";
import styles from "./DemoEmbedBridge.module.css";

const randomId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isEmbedMode = () =>
  new URLSearchParams(window.location.search).get("embed") === "1";

export default function DemoEmbedBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const [spotlight, setSpotlight] = useState<{
    selector: string | null;
    title?: string;
    narration?: string;
  }>({ selector: null });

  const sessionId = useMemo(() => randomId(), []);
  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const post = useCallback((msg: unknown, origin: string) => {
    try {
      window.parent.postMessage(msg, origin);
    } catch {
      // ignore
    }
  }, []);

  const replyAck = useCallback(
    (env: DemoCmdEnvelope, origin: string, result?: unknown) => {
      post(
        { kind: "DEMO_ACK", version: PROTOCOL_VERSION, sessionId, id: env.id, result },
        origin
      );
    },
    [post, sessionId]
  );

  const replyErr = useCallback(
    (env: DemoCmdEnvelope, origin: string, code: string, message: string, details?: unknown) => {
      post(
        {
          kind: "DEMO_ERR",
          version: PROTOCOL_VERSION,
          sessionId,
          id: env.id,
          error: { code, message, details },
        },
        origin
      );
    },
    [post, sessionId]
  );

  useEffect(() => {
    if (!isEmbedMode()) return;
    enableDemoMode();
    const origin = window.location.origin;
    post({ kind: "DEMO_EMBED_READY", version: PROTOCOL_VERSION, sessionId }, origin);
  }, [post, sessionId]);

  useEffect(() => {
    if (!isEmbedMode()) return;

    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!isDemoEnvelope(data)) return;
      if (data.kind !== "DEMO_CMD") return;
      if (data.sessionId !== sessionId) return;

      const env = data;

      try {
        const cmd = env.cmd;

        if (cmd.type === "SET_DEMO_MODE") {
          if (cmd.reset) resetDemoMode();
          if (cmd.enabled) enableDemoMode();
          else disableDemoMode();
          replyAck(env, event.origin);
          return;
        }

        if (cmd.type === "RESET_DEMO_DATA") {
          resetDemoMode();
          replyAck(env, event.origin);
          return;
        }

        if (cmd.type === "NAVIGATE") {
          navigate(cmd.route);
          const start = Date.now();
          const timeoutMs = 10_000;
          while (Date.now() - start < timeoutMs) {
            if (locationRef.current.pathname === cmd.route) break;
            await new Promise((r) => setTimeout(r, 30));
          }
          replyAck(env, event.origin, { pathname: locationRef.current.pathname });
          return;
        }

        if (cmd.type === "WAIT_FOR") {
          await waitForSelector(cmd.selector, {
            timeoutMs: cmd.timeoutMs ?? 10_000,
            visible: cmd.visible ?? false,
          });
          replyAck(env, event.origin);
          return;
        }

        if (cmd.type === "RUN_ACTION") {
          const action = demoActions[cmd.action];
          if (!action) {
            replyErr(env, event.origin, "UNKNOWN_ACTION", `Unknown action: ${cmd.action}`);
            return;
          }
          const result = await action(cmd.payload);
          replyAck(env, event.origin, result);
          return;
        }

        if (cmd.type === "SPOTLIGHT") {
          setSpotlight({ selector: cmd.selector, title: cmd.title, narration: cmd.narration });
          replyAck(env, event.origin);
          return;
        }

        replyErr(env, event.origin, "UNKNOWN_COMMAND", `Unknown command: ${(cmd as any).type}`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Command failed";
        replyErr(env, event.origin, "CMD_FAILED", message, error);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [navigate, replyAck, replyErr, sessionId]);

  if (!isEmbedMode()) return null;

  return (
    <>
      <div className={styles.badge} data-demo-id="demo-banner">
        Demo Mode
      </div>
      <SpotlightOverlay
        selector={spotlight.selector}
        title={spotlight.title}
        narration={spotlight.narration}
      />
    </>
  );
}
