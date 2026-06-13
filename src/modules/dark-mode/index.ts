// Dark Mode — applies a dark filter and/or custom CSS per site, reapplied on every load.
// Per-domain settings are stored encrypted.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

interface SiteSetting {
  dark: boolean;
  css: string;
}

type Sites = Record<string, SiteSetting>;

const DARK_CSS =
  'html{filter:invert(1) hue-rotate(180deg) !important;background:#111 !important}' +
  'img,picture,video,canvas,iframe,[style*="background-image"]{filter:invert(1) hue-rotate(180deg) !important}';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'dark-mode',
    name: 'Dark Mode',
    version: '0.1.0',
    description: 'Force dark mode or custom CSS on any site.',
    icon: '🌙',
    keywords: ['dark', 'dark mode', 'theme', 'css', 'night', 'custom style'],
    category: 'Appearance',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['storage', 'log', 'tabs', 'scripting'],
  },

  init(c) {
    ctx = c;
    ctx.tabs.onComplete(async (tabId, url) => {
      const setting = (await load())[domainOf(url)];
      if (setting) await applyTo(tabId, setting);
    });
    ctx.log.info('initialized');
  },

  commands: {
    async status() {
      const n = Object.keys(await load()).length;
      return { active: n > 0, summary: `${n} site${n === 1 ? '' : 's'} styled` };
    },
    // Surface each styled site into the global Activity view, grouped by site (Rule 5).
    async activity() {
      const sites = await load();
      return Object.keys(sites).map((domain) => ({
        id: domain,
        label: `${sites[domain].dark ? 'Dark' : 'CSS'} · ${domain}`,
        scope: { kind: 'domain', domain },
        stoppable: true,
      }));
    },
    async stopActivity(p: { id: string }) {
      await removeDomain(p.id);
      return { ok: true };
    },
    async getForUrl(p: { url: string }) {
      return (await load())[domainOf(p.url)] ?? { dark: false, css: '' };
    },
    async setForUrl(p: { url: string; dark: boolean; css: string }) {
      const domain = domainOf(p.url);
      if (!domain) throw new Error('No site.');
      const sites = await load();
      sites[domain] = { dark: p.dark, css: p.css };
      await ctx.storage.put('sites', sites);
      // apply to all open tabs of that domain
      for (const t of await ctx.tabs.allTabs()) {
        if (domainOf(t.url) === domain) {
          await ctx.tabs.removeCSS(t.id, DARK_CSS);
          await applyTo(t.id, sites[domain]);
        }
      }
      return { ok: true };
    },
    async list() {
      const sites = await load();
      return Object.keys(sites).map((domain) => ({ domain, ...sites[domain] }));
    },
    async remove(p: { domain: string }) {
      await removeDomain(p.domain);
      return { ok: true };
    },
  },
};

async function removeDomain(domain: string): Promise<void> {
  const sites = await load();
  delete sites[domain];
  await ctx.storage.put('sites', sites);
  for (const t of await ctx.tabs.allTabs()) {
    if (domainOf(t.url) === domain) await ctx.tabs.removeCSS(t.id, DARK_CSS);
  }
}

async function applyTo(tabId: number, setting: SiteSetting): Promise<void> {
  try {
    if (setting.dark) await ctx.tabs.insertCSS(tabId, DARK_CSS);
    if (setting.css) await ctx.tabs.insertCSS(tabId, setting.css);
  } catch {
    /* not injectable — ignore */
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
