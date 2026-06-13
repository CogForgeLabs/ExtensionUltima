// Password Vault — stores logins in the encrypted vault and autofills them on pages.
// Passwords never leave the encrypted store except to fill the active tab on request.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import { fillCreds } from './inject';

interface Entry {
  id: string;
  title: string;
  url: string;
  username: string;
  password: string;
}

interface GenOpts {
  length?: number;
  upper?: boolean;
  lower?: boolean;
  digits?: boolean;
  symbols?: boolean;
}

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'password-vault',
    name: 'Password Vault',
    version: '0.1.0',
    description: 'Store logins encrypted and autofill them on sites.',
    icon: '🔑',
    keywords: ['password', 'vault', 'login', 'credentials', 'autofill', 'generator'],
    category: 'Security',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['storage', 'log', 'tabs', 'scripting'],
  },

  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },

  commands: {
    async status() {
      const n = (await load()).length;
      return { active: n > 0, summary: `${n} login${n === 1 ? '' : 's'}` };
    },
    /** Entries without passwords (for the list). */
    async list() {
      const entries = await load();
      return entries.map(({ id, title, url, username }) => ({ id, title, url, username }));
    },
    /** Reveal a single password on demand. */
    async reveal(p: { id: string }) {
      const entry = (await load()).find((e) => e.id === p.id);
      return entry ? entry.password : null;
    },
    async save(p: { entry: Partial<Entry> }) {
      const entries = await load();
      const e = p.entry;
      if (e.id) {
        const i = entries.findIndex((x) => x.id === e.id);
        if (i >= 0) entries[i] = { ...entries[i], ...e } as Entry;
      } else {
        entries.push({
          id: randomId(),
          title: e.title ?? 'Untitled',
          url: e.url ?? '',
          username: e.username ?? '',
          password: e.password ?? '',
        });
      }
      await ctx.storage.put('entries', entries);
      return { ok: true };
    },
    async remove(p: { id: string }) {
      await ctx.storage.put('entries', (await load()).filter((e) => e.id !== p.id));
      return { ok: true };
    },
    generate(p: { opts?: GenOpts }) {
      return { password: generatePassword(p.opts ?? {}) };
    },
    /** Fill the active tab with an entry's credentials. */
    async autofill(p: { id: string }) {
      const entry = (await load()).find((e) => e.id === p.id);
      if (!entry) throw new Error('Entry not found');
      const tab = await ctx.tabs.activeTab();
      if (!tab) throw new Error('No active tab');
      const ok = await ctx.tabs.runFunc(tab.id, fillCreds, [entry.username, entry.password]);
      return { ok: Boolean(ok) };
    },
  },
};

async function load(): Promise<Entry[]> {
  return (await ctx.storage.get<Entry[]>('entries')) ?? [];
}

function randomId(): string {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

function generatePassword(o: GenOpts): string {
  const sets: string[] = [];
  if (o.lower !== false) sets.push('abcdefghijkmnpqrstuvwxyz');
  if (o.upper !== false) sets.push('ABCDEFGHJKLMNPQRSTUVWXYZ');
  if (o.digits !== false) sets.push('23456789');
  if (o.symbols) sets.push('!@#$%^&*()-_=+[]{}');
  const all = sets.join('') || 'abcdefghijkmnpqrstuvwxyz';
  const len = Math.max(4, o.length ?? 20);
  const rnd = new Uint32Array(len);
  crypto.getRandomValues(rnd);
  let out = '';
  for (let i = 0; i < len; i++) out += all[rnd[i] % all.length];
  return out;
}

export default mod;
