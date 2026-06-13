// Hotkeys — map the browser's 4 ExtensionUltima shortcut slots to tool actions. The
// background listens for the command and dispatches the mapped action (see background/index.ts).
// Assign actual keys at the browser's keyboard-shortcuts page (e.g. chrome://extensions/shortcuts).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

// Curated, no-argument actions that are safe to trigger from a global shortcut.
const ACTIONS: Record<string, { moduleId: string; command: string; payload?: unknown; label: string }> = {
  reader: { moduleId: 'reader-mode', command: 'toggle', label: 'Toggle Reader Mode' },
  tts: { moduleId: 'text-to-speech', command: 'read', payload: { selectionOnly: false }, label: 'Read page aloud' },
  merge: { moduleId: 'merge-windows', command: 'merge', label: 'Merge all windows' },
  incognito: { moduleId: 'incognito-opener', command: 'openCurrent', label: 'Open page in private' },
  urlclean: { moduleId: 'url-cleaner', command: 'toggle', label: 'Toggle URL Cleaner' },
  selbar: { moduleId: 'selection-toolbar', command: 'toggle', label: 'Toggle Selection Toolbar' },
  snooze: { moduleId: 'snooze-tab', command: 'snooze', payload: { minutes: 30 }, label: 'Snooze tab 30 min' },
};

type Mapping = Record<string, string>; // slot ('eu-1'…) -> action key

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'hotkeys',
    name: 'Hotkeys',
    version: '0.1.0',
    description: 'Run tools with keyboard shortcuts.',
    icon: '⌨️',
    keywords: ['hotkey', 'shortcut', 'keyboard', 'keys', 'bind', 'command'],
    category: 'Power',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'storage'],
  },
  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },
  commands: {
    actions() {
      return Object.entries(ACTIONS).map(([key, a]) => ({ key, label: a.label }));
    },
    async mapping() {
      return await load();
    },
    async setSlot(p: { slot: string; actionKey: string }) {
      const m = await load();
      if (p.actionKey) m[p.slot] = p.actionKey;
      else delete m[p.slot];
      await ctx.storage.put('mapping', m);
      return { ok: true };
    },
    async resolve(p: { command: string }) {
      const m = await load();
      const a = m[p.command] ? ACTIONS[m[p.command]] : null;
      return a ? { moduleId: a.moduleId, command: a.command, payload: a.payload } : null;
    },
  },
};

async function load(): Promise<Mapping> {
  return (await ctx.storage.get<Mapping>('mapping')) ?? {};
}

export default mod;
