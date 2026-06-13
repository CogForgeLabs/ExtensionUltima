// Habit Tracker — daily check-ins with streaks, stored encrypted.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

interface Habit {
  id: string;
  name: string;
  days: string[]; // 'YYYY-MM-DD' check-ins
}

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    version: '0.1.0',
    description: 'Track daily habits and streaks.',
    icon: '✅',
    keywords: ['habit', 'streak', 'daily', 'tracker', 'routine', 'goal'],
    category: 'Focus',
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
      return (await load()).map((h) => ({ id: h.id, name: h.name, streak: streak(h.days), doneToday: h.days.includes(today()) }));
    },
    async add(p: { name: string }) {
      if (!p.name?.trim()) throw new Error('Name required.');
      const list = await load();
      list.push({ id: randomId(), name: p.name, days: [] });
      await save(list);
      return { ok: true };
    },
    async toggleToday(p: { id: string }) {
      const list = await load();
      const h = list.find((x) => x.id === p.id);
      if (h) {
        const t = today();
        h.days = h.days.includes(t) ? h.days.filter((d) => d !== t) : [...h.days, t];
        await save(list);
      }
      return { ok: true };
    },
    async remove(p: { id: string }) {
      await save((await load()).filter((h) => h.id !== p.id));
      return { ok: true };
    },
    async status() {
      const list = await load();
      const best = list.reduce((mx, h) => Math.max(mx, streak(h.days)), 0);
      return { active: list.length > 0, summary: list.length ? `${list.length} habit(s), best streak ${best}` : '' };
    },
  },
};

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function streak(days: string[]): number {
  const set = new Set(days);
  let n = 0;
  const d = new Date();
  // count back from today (allow today not yet done)
  if (!set.has(today())) d.setDate(d.getDate() - 1);
  for (;;) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (set.has(key)) {
      n++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return n;
}

async function load(): Promise<Habit[]> {
  return (await ctx.storage.get<Habit[]>('habits')) ?? [];
}
async function save(list: Habit[]): Promise<void> {
  await ctx.storage.put('habits', list);
}
function randomId(): string {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export default mod;
