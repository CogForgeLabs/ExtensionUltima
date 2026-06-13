// Image Downloader — list images on the page and download them.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { collectImages } from './inject';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'image-downloader',
    name: 'Image Downloader',
    version: '0.1.0',
    description: 'Grab and download images from the page.',
    icon: '🖼️',
    keywords: ['image', 'download', 'save', 'photos', 'media', 'grab'],
    category: 'Utilities',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'scripting'],
    extraPermissions: ['downloads'],
  },
  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },
  commands: {
    async collect() {
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      return (await ctx.tabs.runFunc(tab.id, collectImages, [])) ?? [];
    },
    async download(p: { url: string }) {
      await ctx.tabs.download(p.url);
      return { ok: true };
    },
    async downloadAll(p: { urls: string[] }) {
      for (const u of p.urls) await ctx.tabs.download(u);
      return { count: p.urls.length };
    },
  },
};

export default mod;
