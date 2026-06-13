// Session Saver — save the current window's tabs as a named session (encrypted) and
// restore them later.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

interface Session {
  id: string;
  name: string;
  tabs: Array<{ url: string; title: string }>;
  savedAt: number;
}

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'session-saver',
    name: 'Session Saver',
    version: '0.1.0',
    description: 'Save and restore named sets of tabs (encrypted).',
    icon: '💾',
    keywords: ['session', 'tabs', 'save tabs', 'restore', 'workspace', 'window'],
    category: 'Tabs',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['storage', 'log', 'tabs'],
  },

  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },

  commands: {
    async status() {
      const n = (await load()).length;
      return { active: n > 0, summary: `${n} saved session${n === 1 ? '' : 's'}` };
    },
    async saveCurrent(p: { name: string }) {
      const tabs = (await ctx.tabs.currentWindowTabs())
        .filter((t) => /^https?:/.test(t.url))
        .map((t) => ({ url: t.url, title: t.title }));
      if (!tabs.length) throw new Error('No saveable tabs in this window.');
      const sessions = await load();
      sessions.push({ id: randomId(), name: p.name || `Session ${sessions.length + 1}`, tabs, savedAt: Date.now() });
      await ctx.storage.put('sessions', sessions);
      return { ok: true };
    },
    async list() {
      return (await load())
        .map((s) => ({ id: s.id, name: s.name, count: s.tabs.length, savedAt: s.savedAt }))
        .sort((a, b) => b.savedAt - a.savedAt);
    },
    async restore(p: { id: string }) {
      const session = (await load()).find((s) => s.id === p.id);
      if (!session) throw new Error('Session not found');
      for (const t of session.tabs) await ctx.tabs.openUrl(t.url, { active: false });
      return { ok: true, opened: session.tabs.length };
    },
    async remove(p: { id: string }) {
      await ctx.storage.put('sessions', (await load()).filter((s) => s.id !== p.id));
      return { ok: true };
    },
  },
};

async function load(): Promise<Session[]> {
  return (await ctx.storage.get<Session[]>('sessions')) ?? [];
}

function randomId(): string {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export default mod;
