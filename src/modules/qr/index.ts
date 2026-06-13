// QR Code — generate a QR for the current page URL or any text, fully offline.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'qr',
    name: 'QR Code',
    version: '0.1.0',
    description: 'Make a QR code for this page or any text (offline).',
    icon: '🔳',
    keywords: ['qr', 'qr code', 'barcode', 'share', 'link', 'mobile'],
    category: 'Utilities',
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
