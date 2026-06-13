// Secure Notes — a simple encrypted scratchpad. Everything lives in the vault (Rule 2).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

interface Note {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
}

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'notes',
    name: 'Secure Notes',
    version: '0.1.0',
    description: 'Private encrypted notes and scratchpad.',
    icon: '📝',
    keywords: ['notes', 'scratchpad', 'memo', 'todo', 'secure', 'private', 'text'],
    category: 'Security',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['storage', 'log'],
  },

  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },

  commands: {
    async status() {
      const n = (await load()).length;
      return { active: n > 0, summary: `${n} note${n === 1 ? '' : 's'}` };
    },
    async list() {
      return (await load())
        .map(({ id, title, updatedAt }) => ({ id, title, updatedAt }))
        .sort((a, b) => b.updatedAt - a.updatedAt);
    },
    async get(p: { id: string }) {
      return (await load()).find((n) => n.id === p.id) ?? null;
    },
    async save(p: { note: { id?: string; title: string; body: string } }) {
      const notes = await load();
      const n = p.note;
      if (n.id) {
        const i = notes.findIndex((x) => x.id === n.id);
        if (i >= 0) notes[i] = { ...notes[i], title: n.title, body: n.body, updatedAt: Date.now() };
      } else {
        notes.push({ id: randomId(), title: n.title || 'Untitled', body: n.body, updatedAt: Date.now() });
      }
      await ctx.storage.put('notes', notes);
      return { ok: true };
    },
    async remove(p: { id: string }) {
      await ctx.storage.put('notes', (await load()).filter((n) => n.id !== p.id));
      return { ok: true };
    },
  },
};

async function load(): Promise<Note[]> {
  return (await ctx.storage.get<Note[]>('notes')) ?? [];
}

function randomId(): string {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export default mod;
