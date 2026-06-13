// Scheduled Opener — opens a set of URLs on an interval or at scheduled times of day.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import type { Job, TriggerSpec } from '../../core/triggers/types';

interface Config {
  urls: string[];
  seconds?: number;
  randomizeToSeconds?: number;
  times?: string[];
}

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'scheduled-opener',
    name: 'Scheduled Opener',
    version: '0.1.0',
    description: 'Open a set of URLs on a timer or at set times.',
    icon: '⏰',
    keywords: ['open', 'schedule', 'url', 'launch', 'timer', 'daily', 'routine'],
    category: 'Automation',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['storage', 'log', 'tabs', 'triggers'],
  },

  init(c) {
    ctx = c;
    ctx.triggers.registerAction('open', runOpen);
    ctx.log.info('initialized');
  },

  commands: {
    async start(c: Config) {
      const urls = (c.urls ?? []).filter((u) => /^https?:\/\//.test(u));
      if (!urls.length) throw new Error('Add at least one http(s) URL.');
      const trigger: TriggerSpec = c.times?.length
        ? { kind: 'schedule', times: c.times }
        : { kind: 'interval', seconds: c.seconds ?? 3600, randomizeToSeconds: c.randomizeToSeconds };
      const jobId = await ctx.triggers.schedule({
        action: 'open',
        trigger,
        scope: { kind: 'all-tabs' },
        payload: { ...c, urls },
        label: `open ${urls.length} URL(s)`,
      });
      return { jobId };
    },
    list() {
      return ctx.triggers.list().map((j) => ({ id: j.id, label: j.label ?? 'open' }));
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

async function runOpen(job: Job): Promise<void> {
  const c = (job.payload ?? { urls: [] }) as Config;
  for (const url of c.urls) await ctx.tabs.openUrl(url, { active: false });
}

export default mod;
