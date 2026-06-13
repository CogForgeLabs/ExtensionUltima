// Uptime Monitor — periodically checks URLs for reachability and notifies on up/down changes.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';

interface Monitor {
  url: string;
  up: boolean | null;
}

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'uptime-monitor',
    name: 'Uptime Monitor',
    version: '0.1.0',
    description: 'Watch sites and get alerted when they go down or come back.',
    icon: '📡',
    keywords: ['uptime', 'monitor', 'down', 'status', 'ping', 'availability'],
    category: 'Monitoring',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'triggers', 'notifications', 'storage'],
    hostAccess: true, // fetches monitored URLs
  },

  init(c) {
    ctx = c;
    ctx.triggers.registerAction('check', sweep);
    ctx.log.info('initialized');
  },

  commands: {
    async add(p: { url: string }) {
      if (!/^https?:\/\//.test(p.url)) throw new Error('Enter an http(s) URL.');
      const list = await load();
      if (!list.some((m) => m.url === p.url)) {
        list.push({ url: p.url, up: null });
        await save(list);
        await ensureJob(list);
      }
      return { ok: true };
    },
    async remove(p: { url: string }) {
      const list = (await load()).filter((m) => m.url !== p.url);
      await save(list);
      await ensureJob(list);
      return { ok: true };
    },
    async list() {
      return await load();
    },
    async status() {
      const list = await load();
      const down = list.filter((m) => m.up === false).length;
      return { active: list.length > 0, summary: list.length ? `${list.length} monitored${down ? `, ${down} down` : ''}` : '' };
    },
    async activity() {
      return (await load()).map((m) => ({
        id: m.url,
        label: `${m.up === false ? '🔴' : m.up ? '🟢' : '⚪'} ${hostOf(m.url)}`,
        scope: { kind: 'url', pattern: m.url },
        stoppable: true,
      }));
    },
    async stopActivity(p: { id: string }) {
      const list = (await load()).filter((m) => m.url !== p.id);
      await save(list);
      await ensureJob(list);
      return { ok: true };
    },
  },
};

async function sweep(): Promise<void> {
  const list = await load();
  let changed = false;
  for (const m of list) {
    let up: boolean;
    try {
      await fetch(m.url, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
      up = true;
    } catch {
      up = false;
    }
    if (m.up !== null && m.up !== up) {
      await ctx.notify.show('Uptime Monitor', `${hostOf(m.url)} is ${up ? 'back up 🟢' : 'down 🔴'}`);
    }
    if (m.up !== up) {
      m.up = up;
      changed = true;
    }
  }
  if (changed) await save(list);
}

async function ensureJob(list: Monitor[]): Promise<void> {
  const jobs = ctx.triggers.list();
  if (!list.length) {
    for (const j of jobs) await ctx.triggers.cancel(j.id);
  } else if (!jobs.length) {
    await ctx.triggers.schedule({ action: 'check', trigger: { kind: 'interval', seconds: 300 }, scope: { kind: 'all-tabs' }, label: 'check monitored sites every 5m' });
  }
}

async function load(): Promise<Monitor[]> {
  return (await ctx.storage.get<Monitor[]>('monitors')) ?? [];
}
async function save(list: Monitor[]): Promise<void> {
  await ctx.storage.put('monitors', list);
}
function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default mod;
