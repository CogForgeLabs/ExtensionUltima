// URL Cleaner — strips tracking parameters (utm_*, fbclid, gclid, …) from URLs as pages load.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { cleanUrl } from './inject';

interface Settings {
  enabled: boolean;
  params: string[];
}

const DEFAULT_PARAMS = [
  'utm_*', 'fbclid', 'gclid', 'gclsrc', 'dclid', 'msclkid', 'mc_eid', 'mc_cid',
  'igshid', 'ref_src', '_hsenc', '_hsmi', 'vero_id', 'oly_enc_id', 'yclid', 'wickedid',
];

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'url-cleaner',
    name: 'URL Cleaner',
    version: '0.1.0',
    description: 'Strip tracking parameters from URLs automatically.',
    icon: '🧹',
    keywords: ['url', 'clean', 'tracking', 'utm', 'privacy', 'params', 'links'],
    category: 'Privacy',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'scripting', 'storage'],
  },

  init(c) {
    ctx = c;
    ctx.tabs.onComplete(async (tabId) => {
      const s = await load();
      if (!s.enabled) return;
      try {
        await ctx.tabs.runFunc(tabId, cleanUrl, [s.params]);
      } catch {
        /* not injectable — ignore */
      }
    });
    ctx.log.info('initialized');
  },

  commands: {
    async status() {
      const s = await load();
      return { active: s.enabled, summary: s.enabled ? 'cleaning URLs' : 'off' };
    },
    async activity() {
      const s = await load();
      return s.enabled ? [{ id: 'enabled', label: 'URL Cleaner — stripping tracking params', stoppable: true }] : [];
    },
    async stopActivity() {
      const s = await load();
      s.enabled = false;
      await ctx.storage.put('settings', s);
      return { ok: true };
    },
    async toggle() {
      const s = await load();
      s.enabled = !s.enabled;
      await ctx.storage.put('settings', s);
      return { enabled: s.enabled };
    },
    async get() {
      return await load();
    },
  },
};

async function load(): Promise<Settings> {
  return (await ctx.storage.get<Settings>('settings')) ?? { enabled: true, params: DEFAULT_PARAMS };
}

export default mod;
