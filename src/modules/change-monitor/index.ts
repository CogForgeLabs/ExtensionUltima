// Change Monitor — watches a page (or a specific element) and notifies when its content
// changes. Great for price drops, stock/"in stock", status pages, etc. Stores only a hash
// of the content, encrypted.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import type { Job, Scope, TriggerSpec } from '../../core/triggers/types';
import { getText } from './inject';

interface Config {
  scope: Scope;
  selector?: string;
  seconds?: number;
  randomizeToSeconds?: number;
  times?: string[];
}

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'change-monitor',
    name: 'Change Monitor',
    version: '0.1.0',
    description: 'Get notified when a page or element changes (price, stock, status…).',
    icon: '👁️',
    keywords: ['change', 'monitor', 'price', 'stock', 'watch', 'diff', 'notify', 'tracker'],
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
      const trigger: TriggerSpec = c.times?.length
        ? { kind: 'schedule', times: c.times }
        : { kind: 'interval', seconds: c.seconds ?? 300, randomizeToSeconds: c.randomizeToSeconds };
      const jobId = await ctx.triggers.schedule({
        action: 'check',
        trigger,
        scope: c.scope,
        payload: c,
        label: `watch ${c.selector ? `"${c.selector}"` : 'page'} for changes`,
      });
      return { jobId };
    },
    list() {
      return ctx.triggers.list().map((j) => ({ id: j.id, label: j.label ?? 'watch' }));
    },
    async stop(p: { jobId: string }) {
      await ctx.triggers.cancel(p.jobId);
      await ctx.storage.delete(`last:${p.jobId}`);
      return { ok: true };
    },
    async stopAll() {
      for (const j of ctx.triggers.list()) {
        await ctx.triggers.cancel(j.id);
        await ctx.storage.delete(`last:${j.id}`);
      }
      return { ok: true };
    },
  },
};

async function runCheck(job: Job): Promise<void> {
  const c = (job.payload ?? {}) as Config;
  for (const tabId of await ctx.tabs.resolveScope(job.scope)) {
    try {
      const text = await ctx.tabs.runFunc(tabId, getText, [c.selector ?? '']);
      if (typeof text !== 'string') continue;
      const key = `last:${job.id}`;
      const current = hash(text);
      const previous = await ctx.storage.get<string>(key);
      if (previous != null && previous !== current) {
        await ctx.notify.show('Change Monitor', 'A watched page just changed.');
      }
      await ctx.storage.put(key, current);
    } catch {
      /* not injectable — ignore */
    }
  }
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

export default mod;
