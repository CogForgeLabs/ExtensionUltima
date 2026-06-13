// Auto Click — clicks an element matching a CSS selector on an interval or schedule.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import type { Job, Scope, TriggerSpec } from '../../core/triggers/types';
import { autoClick } from './inject';

interface Config {
  scope: Scope;
  selector: string;
  seconds?: number;
  randomizeToSeconds?: number;
  times?: string[];
}

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'auto-click',
    name: 'Auto Click',
    version: '0.1.0',
    description: 'Click a button or element automatically on a timer.',
    icon: '🖱️',
    keywords: ['click', 'auto click', 'button', 'press', 'clicker', 'tap'],
    category: 'Automation',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['storage', 'log', 'tabs', 'triggers', 'scripting'],
  },

  init(c) {
    ctx = c;
    ctx.triggers.registerAction('click', runClick);
    ctx.log.info('initialized');
  },

  commands: {
    async start(c: Config) {
      if (!c.selector) throw new Error('A CSS selector is required.');
      const trigger: TriggerSpec = c.times?.length
        ? { kind: 'schedule', times: c.times }
        : { kind: 'interval', seconds: c.seconds ?? 30, randomizeToSeconds: c.randomizeToSeconds };
      const jobId = await ctx.triggers.schedule({
        action: 'click',
        trigger,
        scope: c.scope,
        payload: c,
        label: `click "${c.selector}" ${scopeLabel(c.scope)}`,
      });
      return { jobId };
    },
    list() {
      return ctx.triggers.list().map((j) => ({ id: j.id, label: j.label ?? 'click' }));
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

async function runClick(job: Job): Promise<void> {
  const c = (job.payload ?? {}) as Config;
  if (!c.selector) return;
  for (const tabId of await ctx.tabs.resolveScope(job.scope)) {
    try {
      await ctx.tabs.runFunc(tabId, autoClick, [c.selector]);
    } catch {
      ctx.log.warn(`auto-click failed for tab ${tabId}`);
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
