// Screenshot — capture the visible area of the active tab. The popup turns the returned data
// URL into a download (no downloads permission needed).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'screenshot',
    name: 'Screenshot',
    version: '0.1.0',
    description: 'Capture the visible part of the page.',
    icon: '📸',
    keywords: ['screenshot', 'capture', 'image', 'snap', 'save page'],
    category: 'Utilities',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs'],
  },

  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },

  commands: {
    async capture() {
      const dataUrl = await ctx.tabs.captureVisible();
      return { dataUrl };
    },
  },
};

export default mod;
