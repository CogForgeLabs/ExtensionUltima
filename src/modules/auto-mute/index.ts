// Auto Mute — automatically mutes tabs whose site you've added to the mute list, as they
// load. The list of domains is stored encrypted.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'auto-mute',
    name: 'Auto Mute',
    version: '0.1.0',
    description: 'Automatically mute noisy sites.',
    icon: '🔇',
    keywords: ['mute', 'sound', 'audio', 'silence', 'noisy', 'volume'],
    category: 'Tabs',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['storage', 'log', 'tabs'],
  },

  init(c) {
    ctx = c;
    ctx.tabs.onComplete(async (tabId, url) => {
      const d = domainOf(url);
      if (d && (await load()).includes(d)) await ctx.tabs.setMuted(tabId, true);
    });
    ctx.log.info('initialized');
  },

  commands: {
    async status() {
      const d = await load();
      return { active: d.length > 0, summary: `${d.length} muted site${d.length === 1 ? '' : 's'}` };
    },
    // Surface each muted site into the global Activity view, grouped by site (Rule 5).
    async activity() {
      return (await load()).map((d) => ({ id: d, label: `Muted · ${d}`, scope: { kind: 'domain', domain: d }, stoppable: true }));
    },
    async stopActivity(p: { id: string }) {
      await unmuteDomain(p.id);
      return { ok: true };
    },
    async list() {
      return await load();
    },
    async addCurrent() {
      const tab = await ctx.tabs.activeTab();
      const d = tab ? domainOf(tab.url) : '';
      if (!d) throw new Error('No site to mute.');
      const domains = await load();
      if (!domains.includes(d)) {
        domains.push(d);
        await ctx.storage.put('domains', domains);
      }
      // mute matching tabs already open
      for (const t of await ctx.tabs.allTabs()) {
        if (domainOf(t.url) === d) await ctx.tabs.setMuted(t.id, true);
      }
      return { domain: d };
    },
    async remove(p: { domain: string }) {
      await unmuteDomain(p.domain);
      return { ok: true };
    },
  },
};

async function unmuteDomain(domain: string): Promise<void> {
  await ctx.storage.put('domains', (await load()).filter((d) => d !== domain));
  for (const t of await ctx.tabs.allTabs()) {
    if (domainOf(t.url) === domain) await ctx.tabs.setMuted(t.id, false);
  }
}

async function load(): Promise<string[]> {
  return (await ctx.storage.get<string[]>('domains')) ?? [];
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export default mod;
