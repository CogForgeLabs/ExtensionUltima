// Site Blocker / Focus Mode — covers blocked sites with an overlay as they load, optionally
// only during a daily focus window. Blocked domains are stored encrypted.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { blockOverlay } from './inject';

interface Settings {
  domains: string[];
  from?: string; // 'HH:MM'
  to?: string; // 'HH:MM'
}

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'site-blocker',
    name: 'Site Blocker',
    version: '0.1.0',
    description: 'Block distracting sites, optionally on a daily schedule.',
    icon: '⛔',
    keywords: ['block', 'focus', 'distraction', 'site block', 'productivity', 'blocklist'],
    category: 'Focus',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'scripting', 'storage'],
  },

  init(c) {
    ctx = c;
    ctx.tabs.onComplete(async (tabId, url) => {
      const s = await load();
      const d = domainOf(url);
      if (d && s.domains.includes(d) && inWindow(s)) {
        try {
          await ctx.tabs.runFunc(tabId, blockOverlay, [d]);
        } catch {
          /* not injectable — ignore */
        }
      }
    });
    ctx.log.info('initialized');
  },

  commands: {
    async status() {
      const s = await load();
      return { active: s.domains.length > 0, summary: `${s.domains.length} blocked site${s.domains.length === 1 ? '' : 's'}` };
    },
    async activity() {
      const s = await load();
      return s.domains.map((d) => ({ id: d, label: `Blocked · ${d}`, scope: { kind: 'domain', domain: d }, stoppable: true }));
    },
    async stopActivity(p: { id: string }) {
      await removeDomain(p.id);
      return { ok: true };
    },
    async addCurrent() {
      const tab = await ctx.tabs.activeTab();
      const d = tab ? domainOf(tab.url) : '';
      if (!d) throw new Error('No site to block.');
      const s = await load();
      if (!s.domains.includes(d)) {
        s.domains.push(d);
        await save(s);
      }
      // apply immediately to matching open tabs
      for (const t of await ctx.tabs.allTabs()) {
        if (domainOf(t.url) === d && inWindow(s)) {
          try {
            await ctx.tabs.runFunc(t.id, blockOverlay, [d]);
          } catch {
            /* ignore */
          }
        }
      }
      return { domain: d };
    },
    async remove(p: { domain: string }) {
      await removeDomain(p.domain);
      return { ok: true };
    },
    async list() {
      return await load();
    },
    async setWindow(p: { from?: string; to?: string }) {
      const s = await load();
      s.from = p.from || undefined;
      s.to = p.to || undefined;
      await save(s);
      return { ok: true };
    },
  },
};

async function removeDomain(domain: string): Promise<void> {
  const s = await load();
  s.domains = s.domains.filter((d) => d !== domain);
  await save(s);
  // clear overlay on matching open tabs by reloading them
  for (const t of await ctx.tabs.allTabs()) {
    if (domainOf(t.url) === domain) {
      try {
        await ctx.tabs.reload(t.id);
      } catch {
        /* ignore */
      }
    }
  }
}

async function load(): Promise<Settings> {
  return (await ctx.storage.get<Settings>('settings')) ?? { domains: [] };
}
async function save(s: Settings): Promise<void> {
  await ctx.storage.put('settings', s);
}

function inWindow(s: Settings): boolean {
  if (!s.from || !s.to) return true;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [fh, fm] = s.from.split(':').map(Number);
  const [th, tm] = s.to.split(':').map(Number);
  const from = fh * 60 + fm;
  const to = th * 60 + tm;
  return from <= to ? cur >= from && cur < to : cur >= from || cur < to; // handle overnight
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export default mod;
