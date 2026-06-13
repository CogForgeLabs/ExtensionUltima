// Page Watch — periodically checks a tab for some text and sends a notification when it
// appears (notifies on the transition to "found", not every cycle).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import type { Job, Scope, TriggerSpec } from '../../core/triggers/types';
import { findText } from './inject';

interface Config {
  scope: Scope;
  text: string;
  seconds?: number;
  randomizeToSeconds?: number;
  times?: string[];
}

let ctx: ModuleContext;
const lastFound = new Map<string, boolean>(); // key: `${jobId}:${tabId}`

const mod: ExtensionModule = {
  manifest: {
    id: 'page-watch',
    name: 'Page Watch',
    version: '0.1.0',
    description: 'Notify you when text appears on a page.',
    icon: '🔔',
    keywords: ['watch', 'notify', 'text', 'alert', 'monitor', 'appears', 'in stock', 'changes'],
    category: 'Monitoring',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['storage', 'log', 'tabs', 'triggers', 'scripting', 'notifications'],
  },

  init(c) {
    ctx = c;
    ctx.triggers.registerAction('check', runCheck);
    ctx.log.info('initialized');
  },

  commands: {
    async start(c: Config) {
      if (!c.text) throw new Error('Text to watch for is required.');
      const trigger: TriggerSpec = c.times?.length
        ? { kind: 'schedule', times: c.times }
        : { kind: 'interval', seconds: c.seconds ?? 60, randomizeToSeconds: c.randomizeToSeconds };
      const jobId = await ctx.triggers.schedule({
        action: 'check',
        trigger,
        scope: c.scope,
        payload: c,
        label: `watch for "${c.text}" ${scopeLabel(c.scope)}`,
      });
      return { jobId };
    },
    list() {
      return ctx.triggers.list().map((j) => ({ id: j.id, label: j.label ?? 'watch' }));
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

async function runCheck(job: Job): Promise<void> {
  const c = (job.payload ?? {}) as Config;
  if (!c.text) return;
  for (const tabId of await ctx.tabs.resolveScope(job.scope)) {
    const key = `${job.id}:${tabId}`;
    try {
      const found = await ctx.tabs.runFunc(tabId, findText, [c.text]);
      const wasFound = lastFound.get(key) ?? false;
      if (found && !wasFound) {
        await ctx.notify.show('Page Watch', `Found “${c.text}” on a watched page.`);
      }
      lastFound.set(key, Boolean(found));
    } catch {
      /* not injectable — ignore */
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
