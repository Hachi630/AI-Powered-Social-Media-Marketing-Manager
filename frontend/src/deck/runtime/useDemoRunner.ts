import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DemoStep, DemoTask } from "../../demo/script/demoScript";
import type { DemoCommand } from "../../demo/bridge/protocol";

export type RunnerStatus = "idle" | "running" | "paused" | "error";

export type DeckApi = {
  skipTo: (options: { slideIndex: number; stepIndex: number }) => void;
  stepForward: () => void;
  stepBackward: () => void;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type DemoRunnerState = {
  stepIndex: number;
  status: RunnerStatus;
  lastError: string | null;
  setStepIndex: (index: number) => void;
  start: () => void;
  pause: () => void;
  restart: () => void;
  next: () => void;
  prev: () => void;
  runCurrentStep: () => void;
  runFromStep: (index: number) => void;
};

type UseDemoRunnerOptions = {
  steps: DemoStep[];
  ready: boolean;
  send: (cmd: DemoCommand, timeoutMs?: number) => Promise<unknown>;
  deckApi: DeckApi | null;
  onStepChange?: (index: number) => void;
};

export const useDemoRunner = ({
  steps,
  ready,
  send,
  deckApi,
  onStepChange,
}: UseDemoRunnerOptions): DemoRunnerState => {
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<RunnerStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const runningRef = useRef(false);
  const stepsCount = steps.length;

  const safeStepIndex = useMemo(
    () => Math.max(0, Math.min(stepIndex, stepsCount - 1)),
    [stepIndex, stepsCount]
  );

  useEffect(() => {
    if (stepIndex !== safeStepIndex) {
      setStepIndex(safeStepIndex);
    }
  }, [safeStepIndex, stepIndex]);

  const runTask = useCallback(
    async (task: DemoTask, step: DemoStep) => {
      if (task.type === "sleep") {
        await sleep(task.ms);
        return;
      }

      if (task.type === "spotlight") {
        await send({
          type: "SPOTLIGHT",
          selector: task.selector,
          title: task.title ?? step.title,
          narration: task.narration ?? step.narration,
        });
        return;
      }

      if (task.type === "setDemoMode") {
        await send({
          type: "SET_DEMO_MODE",
          enabled: task.enabled,
          reset: task.reset,
        });
        return;
      }

      if (task.type === "resetDemoData") {
        await send({ type: "RESET_DEMO_DATA" });
        return;
      }

      if (task.type === "navigate") {
        await send({ type: "NAVIGATE", route: task.route });
        return;
      }

      if (task.type === "waitFor") {
        await send({
          type: "WAIT_FOR",
          selector: task.selector,
          visible: task.visible,
          timeoutMs: task.timeoutMs,
        });
        return;
      }

      if (task.type === "action") {
        await send({
          type: "RUN_ACTION",
          action: task.name,
          payload: task.payload,
        });
      }
    },
    [send]
  );

  const runStep = useCallback(
    async (index: number) => {
      const step = steps[index];
      if (!step) return;
      for (const task of step.tasks || []) {
        if (!runningRef.current) return;
        await runTask(task, step);
      }
    },
    [runTask, steps]
  );

  const runFromStep = useCallback(
    async (index: number) => {
      if (!ready) return;
      runningRef.current = true;
      setStatus("running");
      setLastError(null);
      for (let i = index; i < steps.length; i += 1) {
        if (!runningRef.current) break;
        setStepIndex(i);
        onStepChange?.(i);
        deckApi?.skipTo({ slideIndex: i, stepIndex: 0 });
        try {
          await runStep(i);
        } catch (error: unknown) {
          runningRef.current = false;
          setStatus("error");
          setLastError(error instanceof Error ? error.message : "Demo step failed");
          return;
        }
      }
      runningRef.current = false;
      setStatus("idle");
    },
    [deckApi, onStepChange, ready, runStep, steps]
  );

  const runCurrentStep = useCallback(() => {
    if (!ready) return;
    runningRef.current = true;
    setStatus("running");
    setLastError(null);
    runStep(stepIndex)
      .then(() => {
        runningRef.current = false;
        setStatus("idle");
      })
      .catch((error: unknown) => {
        runningRef.current = false;
        setStatus("error");
        setLastError(error instanceof Error ? error.message : "Demo step failed");
      });
  }, [ready, runStep, stepIndex]);

  const start = useCallback(() => {
    if (!ready) return;
    runFromStep(stepIndex);
  }, [ready, runFromStep, stepIndex]);

  const pause = useCallback(() => {
    runningRef.current = false;
    setStatus("paused");
  }, []);

  const restart = useCallback(() => {
    if (!ready) return;
    setStepIndex(0);
    runFromStep(0);
  }, [ready, runFromStep]);

  const next = useCallback(() => {
    const nextIndex = Math.min(stepIndex + 1, steps.length - 1);
    runningRef.current = false;
    setStatus("paused");
    setStepIndex(nextIndex);
    onStepChange?.(nextIndex);
    deckApi?.skipTo({ slideIndex: nextIndex, stepIndex: 0 });
  }, [deckApi, onStepChange, stepIndex, steps.length]);

  const prev = useCallback(() => {
    const prevIndex = Math.max(stepIndex - 1, 0);
    runningRef.current = false;
    setStatus("paused");
    setStepIndex(prevIndex);
    onStepChange?.(prevIndex);
    deckApi?.skipTo({ slideIndex: prevIndex, stepIndex: 0 });
  }, [deckApi, onStepChange, stepIndex]);

  return {
    stepIndex,
    status,
    lastError,
    setStepIndex,
    start,
    pause,
    restart,
    next,
    prev,
    runCurrentStep,
    runFromStep,
  };
};
