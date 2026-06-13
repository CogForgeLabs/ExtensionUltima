// Scheduler: fires jobs by absolute next-fire timestamp. Driven by two clocks:
//  - a setTimeout to the soonest job (precise, while the worker is alive), and
//  - a 30s keepalive/tick alarm in the background that calls tick() — so jobs still fire
//    (within ~30s) even after the service worker is evicted and resumed.
// Next-fire times are persisted in the encrypted store, so timing is preserved across
// eviction instead of resetting to a full interval.
import type { Core } from '../core';
import type { ActionHandler, Job, TriggerSpec } from './types';
import { randomId } from '../crypto/codec';

const STORE_NS = 'core:triggers';
const STORE_KEY = 'jobs';
const MAX_TIMEOUT = 2_147_483_000; // setTimeout ceiling
const FAR_FUTURE = Number.MAX_SAFE_INTEGER;

export class Scheduler {
  private jobs = new Map<string, Job>();
  private actions = new Map<string, ActionHandler>();
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly core: Core) {}

  registerAction(moduleId: string, name: string, handler: ActionHandler): void {
    this.actions.set(`${moduleId}:${name}`, handler);
  }

  /** Load persisted jobs, fill in any missing next-fire times, and (re)schedule. */
  async restore(): Promise<void> {
    const all = (await this.core.storageFor(STORE_NS).get<Job[]>(STORE_KEY)) ?? [];
    this.jobs = new Map(all.map((j) => [j.id, j]));
    const now = Date.now();
    for (const j of this.jobs.values()) {
      if (j.nextFireAt == null) j.nextFireAt = now + (nextDelayMs(j.trigger) ?? FAR_FUTURE);
    }
    await this.persist();
    this.reschedule();
    if (this.jobs.size) this.core.log.info(`restored ${this.jobs.size} scheduled job(s)`);
  }

  private async persist(): Promise<void> {
    await this.core.storageFor(STORE_NS).put(STORE_KEY, [...this.jobs.values()]);
  }

  async add(job: Job): Promise<void> {
    job.nextFireAt = Date.now() + (nextDelayMs(job.trigger) ?? FAR_FUTURE);
    this.jobs.set(job.id, job);
    await this.persist();
    this.reschedule();
  }

  async cancel(jobId: string): Promise<void> {
    this.jobs.delete(jobId);
    await this.persist();
    this.reschedule();
  }

  async pause(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || job.paused) return;
    job.paused = true;
    await this.persist();
    this.reschedule();
  }

  async resume(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || !job.paused) return;
    job.paused = false;
    job.nextFireAt = Date.now() + (nextDelayMs(job.trigger) ?? FAR_FUTURE);
    await this.persist();
    this.reschedule();
  }

  list(moduleId: string): Job[] {
    return [...this.jobs.values()].filter((j) => j.moduleId === moduleId);
  }

  /** Every job across all modules (for the global Activity view). */
  all(): Job[] {
    return [...this.jobs.values()];
  }

  /** Cancel the in-memory timer (jobs stay persisted). Called on lock. */
  suspend(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  async fireNow(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      await this.fireJob(job);
      this.reschedule();
    }
  }

  /** Fire every job that is due, then reschedule. Called by the timer and the alarm tick. */
  async tick(): Promise<void> {
    const now = Date.now();
    const due = [...this.jobs.values()].filter((j) => !j.paused && (j.nextFireAt ?? FAR_FUTURE) <= now);
    for (const job of due) await this.fireJob(job);
    this.reschedule();
  }

  private async fireJob(job: Job): Promise<void> {
    try {
      const handler = this.actions.get(`${job.moduleId}:${job.action}`);
      if (handler) await handler(job);
    } catch (e) {
      this.core.log.error(`job '${job.id}' failed`, e instanceof Error ? e.message : String(e));
    } finally {
      if (this.jobs.has(job.id)) {
        if (job.trigger.kind === 'at') {
          // One-shot: remove after firing.
          this.jobs.delete(job.id);
          await this.persist();
        } else {
          const next = nextDelayMs(job.trigger);
          job.nextFireAt = next == null ? FAR_FUTURE : Date.now() + next; // manual → never auto-refire
          await this.persist();
        }
      }
    }
  }

  private reschedule(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    let soonest = FAR_FUTURE;
    for (const j of this.jobs.values()) {
      if (j.paused) continue;
      soonest = Math.min(soonest, j.nextFireAt ?? FAR_FUTURE);
    }
    if (soonest === FAR_FUTURE) return;
    const delay = Math.max(0, Math.min(soonest - Date.now(), MAX_TIMEOUT));
    this.timer = setTimeout(() => void this.tick(), delay);
  }
}

function nextDelayMs(t: TriggerSpec): number | null {
  if (t.kind === 'interval') {
    const base = t.seconds * 1000;
    if (t.randomizeToSeconds && t.randomizeToSeconds > t.seconds) {
      return base + Math.random() * (t.randomizeToSeconds * 1000 - base);
    }
    return base;
  }
  if (t.kind === 'schedule') return msUntilNextTime(t.times);
  if (t.kind === 'at') return Math.max(0, t.at - Date.now());
  return null; // manual
}

function msUntilNextTime(times: string[]): number | null {
  let best = Infinity;
  const now = new Date();
  for (const hhmm of times) {
    const [h, m] = hhmm.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) continue;
    const next = new Date(now);
    next.setHours(h, m, 0, 0);
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
    best = Math.min(best, next.getTime() - now.getTime());
  }
  return Number.isFinite(best) ? best : null;
}

/**
 * Per-module facade over the Scheduler, bound to one module id so a module can only
 * manage its own jobs (least privilege). Handed to modules as `ctx.triggers`.
 */
export class TriggerService {
  constructor(
    private readonly scheduler: Scheduler,
    private readonly moduleId: string,
  ) {}

  registerAction(name: string, handler: ActionHandler): void {
    this.scheduler.registerAction(this.moduleId, name, handler);
  }

  async schedule(input: {
    action: string;
    trigger: TriggerSpec;
    scope: Job['scope'];
    payload?: unknown;
    label?: string;
  }): Promise<string> {
    const job: Job = {
      id: randomId(),
      moduleId: this.moduleId,
      action: input.action,
      trigger: input.trigger,
      scope: input.scope,
      payload: input.payload,
      label: input.label,
      createdAt: Date.now(),
    };
    await this.scheduler.add(job);
    return job.id;
  }

  async cancel(jobId: string): Promise<void> {
    await this.scheduler.cancel(jobId);
  }

  list(): Job[] {
    return this.scheduler.list(this.moduleId);
  }

  async run(jobId: string): Promise<void> {
    await this.scheduler.fireNow(jobId);
  }
}
