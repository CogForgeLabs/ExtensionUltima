// Cookie Cleaner — clear a site's cookies on demand, or auto-clear chosen sites on a timer.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

interface State {
  auto: string[];
  minutes: number;
}

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'cookie-cleaner',
    name: 'Cookie Cleaner',
    version: '0.1.0',
    description: 'Clear cookies for a site, or auto-clear sites on a schedule.',
    icon: '🍪',
    keywords: ['cookie', 'clear', 'privacy', 'delete', 'tracking', 'logout'],
    category: 'Privacy',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'storage', 'triggers', 'cookies'],
  },

  init(c) {
    ctx = c;
    ctx.triggers.registerAction('sweep', async () => {
      const s = await load();
      for (const d of s.auto) await ctx.cookies.removeForDomain(d);
      ctx.log.info(`auto-cleared ${s.auto.length} site(s)`);
    });
    ctx.log.info('initialized');
  },

  commands: {
    async clearCurrent() {
      const tab = await ctx.tabs.activeTab();
      const d = tab ? domainOf(tab.url) : '';
      if (!d) throw new Error('No site.');
      const removed = await ctx.cookies.removeForDomain(d);
      return { domain: d, removed };
    },
    async status() {
      const s = await load();
      return { active: s.auto.length > 0, summary: s.auto.length ? `auto-clear ${s.auto.length} site(s)` : '' };
    },
    async activity() {
      const s = await load();
      return s.auto.map((d) => ({ id: d, label: `Auto-clear cookies · ${d}`, scope: { kind: 'domain', domain: d }, stoppable: true }));
    },
    async stopActivity(p: { id: string }) {
      await removeAuto(p.id);
      return { ok: true };
    },
    async addCurrentAuto() {
      const tab = await ctx.tabs.activeTab();
      const d = tab ? domainOf(tab.url) : '';
      if (!d) throw new Error('No site.');
      const s = await load();
      if (!s.auto.includes(d)) {
        s.auto.push(d);
        await save(s);
        await ensureJob(s);
      }
      return { domain: d };
    },
    async list() {
      return await load();
    },
  },
};

async function removeAuto(domain: string): Promise<void> {
  const s = await load();
  s.auto = s.auto.filter((d) => d !== domain);
  await save(s);
  await ensureJob(s);
}

async function ensureJob(s: State): Promise<void> {
  const jobs = ctx.triggers.list();
  if (s.auto.length === 0) {
    for (const j of jobs) await ctx.triggers.cancel(j.id);
  } else if (!jobs.length) {
    await ctx.triggers.schedule({
      action: 'sweep',
      trigger: { kind: 'interval', seconds: Math.max(1, s.minutes) * 60 },
      scope: { kind: 'all-tabs' },
      label: `auto-clear cookies every ${s.minutes}m`,
    });
  }
}

async function load(): Promise<State> {
  return (await ctx.storage.get<State>('state')) ?? { auto: [], minutes: 30 };
}
async function save(s: State): Promise<void> {
  await ctx.storage.put('state', s);
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export default mod;
