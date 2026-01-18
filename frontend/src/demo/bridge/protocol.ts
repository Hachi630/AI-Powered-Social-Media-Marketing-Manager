export type DemoProtocolVersion = 1;

export type DemoEmbedReady = {
  kind: "DEMO_EMBED_READY";
  version: DemoProtocolVersion;
  sessionId: string;
};

export type DemoCmdEnvelope = {
  kind: "DEMO_CMD";
  version: DemoProtocolVersion;
  sessionId: string;
  id: string;
  cmd: DemoCommand;
};

export type DemoAckEnvelope = {
  kind: "DEMO_ACK";
  version: DemoProtocolVersion;
  sessionId: string;
  id: string;
  result?: unknown;
};

export type DemoErrEnvelope = {
  kind: "DEMO_ERR";
  version: DemoProtocolVersion;
  sessionId: string;
  id: string;
  error: { code: string; message: string; details?: unknown };
};

export type DemoEnvelope =
  | DemoEmbedReady
  | DemoCmdEnvelope
  | DemoAckEnvelope
  | DemoErrEnvelope;

export type DemoCommand =
  | { type: "NAVIGATE"; route: string }
  | { type: "SET_DEMO_MODE"; enabled: boolean; reset?: boolean }
  | { type: "RESET_DEMO_DATA" }
  | { type: "RUN_ACTION"; action: string; payload?: unknown }
  | { type: "WAIT_FOR"; selector: string; visible?: boolean; timeoutMs?: number }
  | { type: "SPOTLIGHT"; selector: string | null; title?: string; narration?: string };

export const PROTOCOL_VERSION: DemoProtocolVersion = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isDemoEnvelope = (value: unknown): value is DemoEnvelope => {
  if (!isRecord(value)) return false;
  if (value.version !== PROTOCOL_VERSION) return false;
  if (typeof value.kind !== "string") return false;
  if (typeof value.sessionId !== "string") return false;
  if (value.kind === "DEMO_EMBED_READY") return true;

  if (typeof value.id !== "string") return false;
  if (value.kind === "DEMO_CMD") return isRecord(value.cmd) && typeof value.cmd.type === "string";
  if (value.kind === "DEMO_ACK") return true;
  if (value.kind === "DEMO_ERR") return isRecord(value.error) && typeof value.error.message === "string";
  return false;
};

