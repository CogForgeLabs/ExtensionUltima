// New-Tab Dashboard — replaces the browser's new tab page with a clock, search, today's
// tracked time, and recent bookmarks. The page itself is src/ui/newtab/; this module just
// represents it in the launcher.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'new-tab-dashboard',
    name: 'New-Tab Dashboard',
    version: '0.1.0',
    description: 'A custom new-tab page: clock, search, time, bookmarks.',
    icon: '🗂️',
    keywords: ['new tab', 'dashboard', 'start page', 'home', 'speed dial'],
    category: 'Power',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log'],
  },
  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },
};

export default mod;
