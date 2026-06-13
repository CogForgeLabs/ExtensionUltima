// Video Speed — sets playback speed for media on the page (and toggles Picture-in-Picture).
// The chosen speed is remembered per site and reapplied on load.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { applyVideoSpeed } from './inject';

type Rates = Record<string, number>;

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'video-speed',
    name: 'Video Speed',
    version: '0.1.0',
    description: 'Control video/audio playback speed, remembered per site.',
    icon: '⏩',
    keywords: ['video', 'speed', 'playback', 'fast', 'slow', 'media', 'rate'],
    category: 'Appearance',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['storage', 'log', 'tabs', 'scripting'],
  },

  init(c) {
    ctx = c;
    ctx.tabs.onComplete(async (tabId, url) => {
      const rate = (await load())[domainOf(url)];
      if (rate && rate !== 1) {
        try {
          await ctx.tabs.runFunc(tabId, applyVideoSpeed, [rate]);
        } catch {
          /* ignore */
        }
      }
    });
    ctx.log.info('initialized');
  },

  commands: {
    async status() {
      const n = Object.keys(await load()).length;
      return { active: n > 0, summary: `${n} site${n === 1 ? '' : 's'} remembered` };
    },
    // Surface each remembered site into the global Activity view, grouped by site (Rule 5).
    async activity() {
      const rates = await load();
      return Object.keys(rates).map((domain) => ({
        id: domain,
        label: `${rates[domain]}× · ${domain}`,
        scope: { kind: 'domain', domain },
        stoppable: true,
      }));
    },
    async stopActivity(p: { id: string }) {
      const rates = await load();
      delete rates[p.id];
      await ctx.storage.put('rates', rates);
      for (const t of await ctx.tabs.allTabs()) {
        if (domainOf(t.url) === p.id) {
          try {
            await ctx.tabs.runFunc(t.id, applyVideoSpeed, [1]);
          } catch {
            /* ignore */
          }
        }
      }
      return { ok: true };
    },
    async setSpeed(p: { rate: number }) {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      const count = await ctx.tabs.runFunc(tab.id, applyVideoSpeed, [p.rate]);
      const rates = await load();
      const d = domainOf(tab.url);
      if (d) {
        rates[d] = p.rate;
        await ctx.storage.put('rates', rates);
      }
      return { applied: count ?? 0 };
    },
    // Note: PiP is triggered from the popup (panel) so it carries a user gesture — see panel.ts.
  },
};

async function load(): Promise<Rates> {
  return (await ctx.storage.get<Rates>('rates')) ?? {};
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export default mod;
