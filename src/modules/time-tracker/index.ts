// Time Tracker — accumulates active-tab time per site, per day, stored encrypted.
// Approximate (counts the focused tab; doesn't subtract idle), but useful for awareness.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

type DayTotals = Record<string, number>; // domain -> seconds

let ctx: ModuleContext;
let current: { domain: string; since: number } | null = null;

const mod: ExtensionModule = {
  manifest: {
    id: 'time-tracker',
    name: 'Time Tracker',
    version: '0.1.0',
    description: 'See how long you spend on each site (encrypted, on-device).',
    icon: '⏱️',
    keywords: ['time', 'track', 'usage', 'stats', 'productivity', 'screen time'],
    category: 'Focus',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'storage'],
  },

  init(c) {
    ctx = c;
    const sync = async (): Promise<void> => {
      const tab = await ctx.tabs.activeTab();
      await switchTo(tab ? domainOf(tab.url) : '');
    };
    ctx.tabs.onActivated(() => void sync());
    ctx.tabs.onComplete(() => void sync());
    void sync();
    ctx.log.info('initialized');
  },

  commands: {
    async status() {
      const totals = await flushAndLoad();
      const total = Object.values(totals).reduce((a, b) => a + b, 0);
      return { active: total > 0, summary: total > 0 ? `${fmtDur(total)} today` : '' };
    },
    async today() {
      const totals = await flushAndLoad();
      return Object.entries(totals)
        .map(([domain, seconds]) => ({ domain, seconds }))
        .sort((a, b) => b.seconds - a.seconds);
    },
    async reset() {
      current = null;
      await ctx.storage.delete(todayKey());
      return { ok: true };
    },
  },
};

async function switchTo(domain: string): Promise<void> {
  await flush();
  current = domain ? { domain, since: Date.now() } : null;
}

async function flush(): Promise<void> {
  if (!current) return;
  const secs = Math.round((Date.now() - current.since) / 1000);
  current.since = Date.now();
  if (secs <= 0) return;
  const key = todayKey();
  const totals = (await ctx.storage.get<DayTotals>(key)) ?? {};
  totals[current.domain] = (totals[current.domain] ?? 0) + secs;
  await ctx.storage.put(key, totals);
}

async function flushAndLoad(): Promise<DayTotals> {
  await flush();
  return (await ctx.storage.get<DayTotals>(todayKey())) ?? {};
}

function todayKey(): string {
  const d = new Date();
  return `day:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDur(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${secs}s`;
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export default mod;
