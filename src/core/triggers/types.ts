// Trigger framework — the reusable "how/when/where does this run" model shared by all
// modules. A Job binds an action (in a module) to a Trigger (when) and a Scope (where).

/** When an action fires. */
export type TriggerSpec =
  | { kind: 'manual' }
  | { kind: 'interval'; seconds: number; randomizeToSeconds?: number }
  | { kind: 'schedule'; times: string[] } // local 'HH:MM' times of day
  | { kind: 'at'; at: number }; // one-shot at an absolute epoch-ms time

/** Which tab(s) an action targets. */
export type Scope =
  | { kind: 'tab'; tabId: number }
  | { kind: 'url'; pattern: string } // browser match pattern, e.g. https://example.com/*
  | { kind: 'domain'; domain: string }
  | { kind: 'all-tabs' }
  | { kind: 'window'; windowId: number };

export interface Job {
  id: string;
  moduleId: string;
  action: string;
  trigger: TriggerSpec;
  scope: Scope;
  payload?: unknown;
  label?: string;
  createdAt: number;
  /** Absolute time (ms) the job should next fire. Persisted so timing survives worker
   * eviction — on resume we wait the remaining time, not a fresh full interval. */
  nextFireAt?: number;
  /** When true the job is kept but not fired until resumed. */
  paused?: boolean;
}

export type ActionHandler = (job: Job) => Promise<void> | void;
