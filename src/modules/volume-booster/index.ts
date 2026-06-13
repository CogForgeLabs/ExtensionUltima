// Volume Booster — amplify a tab's audio past 100% via Web Audio. Level remembered per site.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { setGain } from './inject';

type Levels = Record<string, number>;

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'volume-booster',
    name: 'Volume Booster',
    version: '0.1.0',
    description: 'Boost a tab’s volume beyond 100%.',
    icon: '🔊',
    keywords: ['volume', 'boost', 'louder', 'amplify', 'audio', 'gain'],
    category: 'Appearance',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'scripting', 'storage'],
  },

  init(c) {
    ctx = c;
    ctx.tabs.onComplete(async (tabId, url) => {
      const level = (await load())[domainOf(url)];
      if (level && level !== 1) {
        try {
          await ctx.tabs.runFunc(tabId, setGain, [level]);
        } catch {
          /* ignore */
        }
      }
    });
    ctx.log.info('initialized');
  },

  commands: {
    async setLevel(p: { level: number }) {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      const r = await ctx.tabs.runFunc(tab.id, setGain, [p.level]);
      const levels = await load();
      const d = domainOf(tab.url);
      if (d) {
        if (p.level === 1) delete levels[d];
        else levels[d] = p.level;
        await ctx.storage.put('levels', levels);
      }
      return { state: r ?? 'unknown' };
    },
    async status() {
      const n = Object.keys(await load()).length;
      return { active: n > 0, summary: n ? `${n} site(s) boosted` : '' };
    },
    async activity() {
      const levels = await load();
      return Object.keys(levels).map((domain) => ({
        id: domain,
        label: `${Math.round(levels[domain] * 100)}% · ${domain}`,
        scope: { kind: 'domain', domain },
        stoppable: true,
      }));
    },
    async stopActivity(p: { id: string }) {
      const levels = await load();
      delete levels[p.id];
      await ctx.storage.put('levels', levels);
      for (const t of await ctx.tabs.allTabs()) {
        if (domainOf(t.url) === p.id) {
          try {
            await ctx.tabs.runFunc(t.id, setGain, [1]);
          } catch {
            /* ignore */
          }
        }
      }
      return { ok: true };
    },
  },
};

async function load(): Promise<Levels> {
  return (await ctx.storage.get<Levels>('levels')) ?? {};
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export default mod;
