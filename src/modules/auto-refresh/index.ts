// Auto Refresh — reloads tabs automatically on an interval (with optional random range) or
// at scheduled times. Optional cache-bypass and scroll-position memory. Settings persist
// per URL through the encrypted store (Rule 2).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import type { Job, Scope, TriggerSpec } from '../../core/triggers/types';
import { restoreScroll, saveScroll } from './inject';

interface Config {
  scope: Scope;
  seconds?: number;
  randomizeToSeconds?: number;
  times?: string[];
  bypassCache?: boolean;
  rememberScroll?: boolean;
}

let ctx: ModuleContext;
const pendingScroll = new Map<number, number>();

const mod: ExtensionModule = {
  manifest: {
    id: 'auto-refresh',
    name: 'Auto Refresh',
    version: '0.1.0',
    description: 'Reload tabs automatically on a timer or schedule.',
    icon: '🔄',
    keywords: ['refresh', 'reload', 'auto refresh', 'timer', 'interval', 'cache', 'reload page'],
    category: 'Automation',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['storage', 'log', 'tabs', 'triggers', 'scripting'],
  },

  init(c) {
    ctx = c;
    ctx.triggers.registerAction('refresh', runRefresh);
    ctx.tabs.onComplete(async (tabId) => {
      const y = pendingScroll.get(tabId);
      if (y == null) return;
      pendingScroll.delete(tabId);
      try {
        await ctx.tabs.runFunc(tabId, restoreScroll, [y]);
      } catch {
        /* not injectable — ignore */
      }
    });
    ctx.log.info('initialized');
  },

  commands: {
    async start(c: Config) {
      const trigger = triggerFrom(c);
      if (c.scope.kind === 'url') await ctx.storage.put(`pref:${c.scope.pattern}`, c);
      const jobId = await ctx.triggers.schedule({
        action: 'refresh',
        trigger,
        scope: c.scope,
        payload: c,
        label: describe(c, trigger),
      });
      return { jobId };
    },
    list() {
      return ctx.triggers.list().map((j) => ({ id: j.id, label: j.label ?? 'refresh' }));
    },
    async recall(p: { url: string }) {
      return (await ctx.storage.get<Config>(`pref:${p.url}`)) ?? null;
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

function triggerFrom(c: Config): TriggerSpec {
  return c.times?.length
    ? { kind: 'schedule', times: c.times }
    : { kind: 'interval', seconds: c.seconds ?? 60, randomizeToSeconds: c.randomizeToSeconds };
}

async function runRefresh(job: Job): Promise<void> {
  const c = (job.payload ?? {}) as Config;
  for (const tabId of await ctx.tabs.resolveScope(job.scope)) {
    try {
      if (c.rememberScroll) {
        try {
          const y = await ctx.tabs.runFunc(tabId, saveScroll, []);
          if (typeof y === 'number') pendingScroll.set(tabId, y);
        } catch {
          /* ignore */
        }
      }
      await ctx.tabs.reload(tabId, Boolean(c.bypassCache));
    } catch {
      ctx.log.warn(`reload failed for tab ${tabId}`);
    }
  }
}

function describe(c: Config, t: TriggerSpec): string {
  return `refresh ${scopeLabel(c.scope)} ${timeLabel(t)}`;
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

function timeLabel(t: TriggerSpec): string {
  if (t.kind === 'schedule') return `at ${t.times.join(', ')}`;
  if (t.kind === 'interval')
    return t.randomizeToSeconds ? `every ${t.seconds}–${t.randomizeToSeconds}s` : `every ${t.seconds}s`;
  return 'manually';
}

export default mod;
