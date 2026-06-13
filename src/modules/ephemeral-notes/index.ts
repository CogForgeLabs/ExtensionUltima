// Ephemeral Notes — encrypted notes that self-destruct after a set time. Expired notes are
// purged whenever the list is read.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

interface Note {
  id: string;
  text: string;
  expiresAt: number;
}

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'ephemeral-notes',
    name: 'Ephemeral Notes',
    version: '0.1.0',
    description: 'Encrypted notes that self-destruct after a timer.',
    icon: '💨',
    keywords: ['ephemeral', 'self destruct', 'temporary', 'note', 'expire', 'secret'],
    category: 'Privacy',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'storage'],
  },

  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },

  commands: {
    async add(p: { text: string; minutes: number }) {
      if (!p.text?.trim()) throw new Error('Empty note.');
      const notes = await purge();
      notes.push({ id: randomId(), text: p.text, expiresAt: Date.now() + Math.max(1, p.minutes) * 60_000 });
      await ctx.storage.put('notes', notes);
      return { ok: true };
    },
    async list() {
      return (await purge()).map((n) => ({ id: n.id, text: n.text, expiresAt: n.expiresAt }));
    },
    async remove(p: { id: string }) {
      await ctx.storage.put('notes', (await purge()).filter((n) => n.id !== p.id));
      return { ok: true };
    },
    async status() {
      const n = (await purge()).length;
      return { active: n > 0, summary: n ? `${n} ephemeral note(s)` : '' };
    },
  },
};

async function purge(): Promise<Note[]> {
  const notes = (await ctx.storage.get<Note[]>('notes')) ?? [];
  const alive = notes.filter((n) => n.expiresAt > Date.now());
  if (alive.length !== notes.length) await ctx.storage.put('notes', alive);
  return alive;
}

function randomId(): string {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export default mod;
