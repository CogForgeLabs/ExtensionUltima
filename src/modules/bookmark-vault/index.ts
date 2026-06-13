// Bookmark Vault — private, encrypted bookmarks with tags and search, separate from the
// browser's own bookmarks.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

interface BM {
  id: string;
  title: string;
  url: string;
  tags: string[];
}

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'bookmark-vault',
    name: 'Bookmark Vault',
    version: '0.1.0',
    description: 'Private encrypted bookmarks with tags and search.',
    icon: '🔖',
    keywords: ['bookmark', 'vault', 'save', 'link', 'tags', 'private', 'favorites'],
    category: 'Security',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'storage'],
  },

  init(c) {
    ctx = c;
    ctx.log.info('initialized');
  },

  commands: {
    async list() {
      return await load();
    },
    async add(p: { title: string; url: string; tags: string[] }) {
      if (!p.url) throw new Error('URL required.');
      const items = await load();
      items.push({ id: randomId(), title: p.title || p.url, url: p.url, tags: p.tags ?? [] });
      await ctx.storage.put('items', items);
      return { ok: true };
    },
    async remove(p: { id: string }) {
      await ctx.storage.put('items', (await load()).filter((b) => b.id !== p.id));
      return { ok: true };
    },
    async status() {
      const n = (await load()).length;
      return { active: n > 0, summary: n ? `${n} bookmark(s)` : '' };
    },
  },
};

async function load(): Promise<BM[]> {
  return (await ctx.storage.get<BM[]>('items')) ?? [];
}

function randomId(): string {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export default mod;
