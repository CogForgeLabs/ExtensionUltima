// Element Zapper — click to hide annoying page elements; remembered per site and reapplied
// on every load. Selectors are stored encrypted.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { hideBySelectors, pickElement } from './inject';

type Sites = Record<string, string[]>; // domain -> selectors

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'element-zapper',
    name: 'Element Zapper',
    version: '0.1.0',
    description: 'Click to hide page elements (banners, junk), remembered per site.',
    icon: '🚫',
    keywords: ['hide', 'element', 'zapper', 'block', 'remove', 'cleaner', 'declutter'],
    category: 'Page',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'scripting', 'storage'],
  },

  init(c) {
    ctx = c;
    ctx.tabs.onComplete(async (tabId, url) => {
      const sels = (await load())[domainOf(url)];
      if (sels?.length) {
        try {
          await ctx.tabs.runFunc(tabId, hideBySelectors, [sels]);
        } catch {
          /* not injectable — ignore */
        }
      }
    });
    ctx.log.info('initialized');
  },

  commands: {
    async status() {
      const n = Object.keys(await load()).length;
      return { active: n > 0, summary: `${n} site${n === 1 ? '' : 's'} with hidden elements` };
    },
    async activity() {
      const sites = await load();
      return Object.keys(sites).map((domain) => ({
        id: domain,
        label: `${sites[domain].length} hidden · ${domain}`,
        scope: { kind: 'domain', domain },
        stoppable: true,
      }));
    },
    async stopActivity(p: { id: string }) {
      await clearSite(p.id);
      return { ok: true };
    },
    async pick() {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      const sel = await ctx.tabs.runFunc(tab.id, pickElement, []);
      if (!sel) return { picked: null };
      const d = domainOf(tab.url);
      if (d) {
        const sites = await load();
        sites[d] = [...(sites[d] ?? []), sel];
        await ctx.storage.put('sites', sites);
      }
      return { picked: sel };
    },
    async clearSite(p: { domain: string }) {
      await clearSite(p.domain);
      return { ok: true };
    },
    async list() {
      return await load();
    },
  },
};

async function clearSite(domain: string): Promise<void> {
  const sites = await load();
  delete sites[domain];
  await ctx.storage.put('sites', sites);
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

async function load(): Promise<Sites> {
  return (await ctx.storage.get<Sites>('sites')) ?? {};
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export default mod;
