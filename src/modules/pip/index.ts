// Picture-in-Picture — pop the active tab's video into a floating window.
// PiP requires a user gesture in the page, so the action runs from the popup panel via
// `host.runInActiveTab` (which carries the click's gesture), not from the background.
// This is a momentary action with no ongoing state, so it surfaces nothing in the
// Activity dashboard (Rule 5: "needs nothing — confirmed").
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'pip',
    name: 'Picture-in-Picture',
    version: '0.1.0',
    description: 'Pop the current video into a floating window.',
    icon: '🖼️',
    keywords: ['pip', 'picture in picture', 'popout', 'pop out', 'float', 'mini player', 'video'],
    category: 'Appearance',
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
