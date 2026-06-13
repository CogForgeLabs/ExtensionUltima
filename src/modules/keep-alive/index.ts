// Keep Alive — periodically simulates light activity on a tab (and optionally clicks a
// "stay signed in" element) so sessions don't time out. Never reloads the page.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import type { Job, Scope, TriggerSpec } from '../../core/triggers/types';
import { clickKeepAlive, jiggle } from './inject';

interface Config {
  scope: Scope;
  seconds?: number;
  randomizeToSeconds?: number;
  times?: string[];
  clickSelector?: string;
}

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'keep-alive',
    name: 'Keep Alive',
    version: '0.1.0',
    description: 'Keep a tab active so sessions don’t time out — no reloading.',
    icon: '☕',
    keywords: ['keep alive', 'session', 'idle', 'logout', 'stay signed in', 'timeout', 'active'],
    category: 'Automation',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['storage', 'log', 'tabs', 'triggers', 'scripting'],
  },

  init(c) {
    ctx = c;
    ctx.triggers.registerAction('ping', runPing);
    ctx.log.info('initialized');
  },

  commands: {
    async start(c: Config) {
      const trigger: TriggerSpec = c.times?.length
        ? { kind: 'schedule', times: c.times }
        : { kind: 'interval', seconds: c.seconds ?? 60, randomizeToSeconds: c.randomizeToSeconds };
      const jobId = await ctx.triggers.schedule({
        action: 'ping',
        trigger,
        scope: c.scope,
        payload: c,
        label: `keep-alive ${scopeLabel(c.scope)} every ${c.seconds ?? 60}s`,
      });
      return { jobId };
    },
    list() {
      return ctx.triggers.list().map((j) => ({ id: j.id, label: j.label ?? 'keep-alive' }));
    },
    async stop(p: { jobId: string }) {
      await ctx.triggers.cancel(p.jobId);
      return { ok: true };
    },
    async stopAll() {
      for (const j of ctx.triggers.list()) await ctx.triggers.cancel(j.id);
      return { ok: true };
    },
  },
};

async function runPing(job: Job): Promise<void> {
  const c = (job.payload ?? {}) as Config;
  for (const tabId of await ctx.tabs.resolveScope(job.scope)) {
    try {
      await ctx.tabs.runFunc(tabId, jiggle, []);
      if (c.clickSelector) await ctx.tabs.runFunc(tabId, clickKeepAlive, [c.clickSelector]);
    } catch {
      ctx.log.warn(`keep-alive failed for tab ${tabId}`);
    }
  }
}

function scopeLabel(s: Scope): string {
  switch (s.kind) {
    case 'tab':
      return 'this tab';
    case 'url':
      return s.pattern;
    case 'domain':
      return s.domain;
    case 'all-tabs':
      return 'all tabs';
    case 'window':
      return 'this window';
  }
}

export default mod;
