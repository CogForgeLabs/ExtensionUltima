// Tab Suspender — unloads tabs that have been inactive for a while to free memory.
// Tracks last-active time per tab and discards idle ones on a sweep (skipping the active,
// audible, or pinned tabs).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import type { Job } from '../../core/triggers/types';

interface Config {
  minutes: number;
}

let ctx: ModuleContext;
const lastActive = new Map<number, number>();

const mod: ExtensionModule = {
  manifest: {
    id: 'tab-suspender',
    name: 'Tab Suspender',
    version: '0.1.0',
    description: 'Unload inactive tabs to free memory.',
    icon: '😴',
    keywords: ['suspend', 'discard', 'memory', 'ram', 'unload', 'idle tabs', 'performance'],
    category: 'Tabs',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['storage', 'log', 'tabs', 'triggers'],
  },

  init(c) {
    ctx = c;
    ctx.tabs.onActivated((tabId) => lastActive.set(tabId, Date.now()));
    ctx.triggers.registerAction('sweep', runSweep);
    ctx.log.info('initialized');
  },

  commands: {
    async start(p: { minutes: number }) {
      const minutes = Math.max(1, p.minutes || 30);
      // single sweep job, runs every minute
      for (const j of ctx.triggers.list()) await ctx.triggers.cancel(j.id);
      const jobId = await ctx.triggers.schedule({
        action: 'sweep',
        trigger: { kind: 'interval', seconds: 60 },
        scope: { kind: 'all-tabs' },
        payload: { minutes } as Config,
        label: `suspend tabs idle > ${minutes}m`,
      });
      return { jobId };
    },
    list() {
      return ctx.triggers.list().map((j) => ({ id: j.id, label: j.label ?? 'suspend' }));
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

async function runSweep(job: Job): Promise<void> {
  const { minutes } = (job.payload ?? { minutes: 30 }) as Config;
  const cutoff = Date.now() - minutes * 60_000;
  for (const tab of await ctx.tabs.allTabs()) {
    if (tab.active || tab.audible || tab.pinned || tab.discarded) continue;
    const last = lastActive.get(tab.id) ?? Date.now(); // unseen tabs get a grace period
    if (last < cutoff) await ctx.tabs.discard(tab.id);
  }
}

export default mod;
