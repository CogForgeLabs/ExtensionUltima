// Launcher popup: a global Activity manager (everything running, grouped by tab/site or
// module, with live countdowns, pause/resume, filter) on top, then search + pinned +
// most-used + all. Talks to the background broker only — never touches keys/storage.
import browser from '../../core/browser';
import { send, type ActiveTab, type ModuleDescriptor, type PanelHost } from './host';
import { panels } from './panels';
import { el } from './dom';

const $ = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
};

interface ActivityEntry {
  source: 'job' | 'config';
  uid: string;
  jobId?: string;
  moduleId: string;
  entryId?: string;
  moduleName: string;
  icon: string;
  label: string;
  scopeKind: 'tab' | 'url' | 'domain' | 'all-tabs' | 'window' | 'none';
  targetKey: string;
  targetLabel: string;
  nextFireAt: number | null;
  paused: boolean;
  pausable: boolean;
  stoppable: boolean;
}
interface ModuleStatus {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  summary: string;
}
interface LauncherData {
  modules: ModuleDescriptor[];
  pins: string[];
  usage: Record<string, number>;
  activity: ActivityEntry[];
  statuses: ModuleStatus[];
}

let descriptors: ModuleDescriptor[] = [];
let pins: string[] = [];
let usage: Record<string, number> = {};
let activity: ActivityEntry[] = [];
let statusById = new Map<string, ModuleStatus>();

// Activity view state (persisted across refreshes so the user's view is kept).
let activityMode: 'target' | 'module' = 'target';
let activityFilter = '';
let countdownTimer: ReturnType<typeof setInterval> | undefined;

// Currently-granted optional permissions (browser-global; shared across tools).
let grantedPerms = new Set<string>();
let grantedOrigins: string[] = [];

async function loadGranted(): Promise<void> {
  try {
    const g = await browser.permissions.getAll();
    grantedPerms = new Set(g.permissions ?? []);
    grantedOrigins = g.origins ?? [];
  } catch {
    grantedPerms = new Set();
    grantedOrigins = [];
  }
}

function ready(d: ModuleDescriptor): boolean {
  return (
    d.permissions.every((p) => grantedPerms.has(p)) &&
    d.origins.every((o) => grantedOrigins.includes(o) || grantedOrigins.includes('<all_urls>'))
  );
}

function setError(msg: string): void {
  $('error').textContent = msg;
}

function show(view: 'locked' | 'launcher' | 'panel'): void {
  $('lockedView').hidden = view !== 'locked';
  $('launcherView').hidden = view !== 'launcher';
  $('panelView').hidden = view !== 'panel';
  ($('lockBtn') as HTMLElement).hidden = view === 'locked';
  ($('permsBtn') as HTMLElement).hidden = view === 'locked';
}

async function boot(): Promise<void> {
  const s = await send<{ initialized: boolean; unlocked: boolean }>({ type: 'status' });
  if (s.unlocked) {
    await openLauncher();
  } else {
    $('status').textContent = s.initialized
      ? 'Locked — enter your master passphrase.'
      : 'First run — choose a master passphrase to initialize the encrypted vault.';
    show('locked');
  }
}

async function openLauncher(): Promise<void> {
  const data = await send<LauncherData>({ type: 'launcher' });
  descriptors = data.modules;
  pins = data.pins;
  usage = data.usage;
  activity = data.activity;
  statusById = new Map(data.statuses.map((s) => [s.id, s]));
  await loadGranted();
  show('launcher');
  renderActivity();
  renderList(($('search') as HTMLInputElement).value);
}

// --- Activity manager ---

function scopeIcon(kind: ActivityEntry['scopeKind']): string {
  return { tab: '📑', url: '🔗', domain: '🌐', 'all-tabs': '🌍', window: '🪟', none: '⚙️' }[kind] ?? '•';
}

function fmtRemaining(ms: number): string {
  if (ms < 1500) return 'now';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${Math.round(ms / 3_600_000)}h`;
}

function startCountdown(): void {
  if (countdownTimer) clearInterval(countdownTimer);
  const update = (): void => {
    const now = Date.now();
    for (const span of Array.from(document.querySelectorAll<HTMLElement>('#running .next'))) {
      if (span.dataset.paused === '1') {
        span.textContent = 'paused';
        continue;
      }
      const nf = Number(span.dataset.next);
      span.textContent = nf ? `next ${fmtRemaining(nf - now)}` : '';
    }
  };
  update();
  countdownTimer = setInterval(update, 1000);
}

async function stopEntry(e: ActivityEntry): Promise<void> {
  if (e.source === 'job') await send({ type: 'cancelJob', id: e.jobId });
  else await send({ type: 'module', id: e.moduleId, command: 'stopActivity', payload: { id: e.entryId } });
}

function renderActivity(): void {
  if (countdownTimer) clearInterval(countdownTimer);
  const root = $('running');
  root.replaceChildren();
  if (!activity.length) return;

  const wrap = document.createElement('div');
  wrap.className = 'running';

  // Header
  const head = document.createElement('div');
  head.className = 'rhead';
  const h = document.createElement('h2');
  h.textContent = `Active now (${activity.length})`;
  const stopAll = button('ghost', 'Stop all', async () => {
    for (const e of activity.filter((x) => x.stoppable)) await stopEntry(e);
    await openLauncher();
  });
  head.append(h, stopAll);

  // Toolbar: filter + group-by toggle
  const bar = document.createElement('div');
  bar.className = 'abar';
  const filter = document.createElement('input');
  filter.type = 'search';
  filter.placeholder = 'Filter…';
  filter.value = activityFilter;
  const groupsEl = document.createElement('div');
  groupsEl.className = 'groups';
  filter.addEventListener('input', () => {
    activityFilter = filter.value;
    renderGroups(groupsEl);
  });

  const seg = document.createElement('div');
  seg.className = 'seg';
  const byTarget = button('', 'Tab / Site', () => setMode('target'));
  const byModule = button('', 'Module', () => setMode('module'));
  const setMode = (m: 'target' | 'module'): void => {
    activityMode = m;
    byTarget.classList.toggle('on', m === 'target');
    byModule.classList.toggle('on', m === 'module');
    renderGroups(groupsEl);
  };
  byTarget.classList.toggle('on', activityMode === 'target');
  byModule.classList.toggle('on', activityMode === 'module');
  seg.append(byTarget, byModule);
  bar.append(filter, seg);

  renderGroups(groupsEl);

  wrap.append(head, bar, groupsEl);
  root.append(wrap);
  startCountdown();
}

function renderGroups(container: HTMLElement): void {
  container.replaceChildren();
  const f = activityFilter.trim().toLowerCase();
  const filtered = activity.filter(
    (e) => !f || `${e.label} ${e.moduleName} ${e.targetLabel}`.toLowerCase().includes(f),
  );
  if (!filtered.length) {
    container.append(muted('Nothing matches.'));
    return;
  }

  const groups = new Map<string, { label: string; items: ActivityEntry[] }>();
  for (const e of filtered) {
    const key = activityMode === 'target' ? e.targetKey : e.moduleId;
    const label = activityMode === 'target' ? `${scopeIcon(e.scopeKind)} ${e.targetLabel}` : `${e.icon} ${e.moduleName}`;
    const g = groups.get(key) ?? { label, items: [] };
    g.items.push(e);
    groups.set(key, g);
  }

  for (const g of groups.values()) {
    const details = document.createElement('details');
    details.className = 'group';
    details.open = true;

    const summary = document.createElement('summary');
    const title = document.createElement('span');
    title.textContent = g.label;
    const count = document.createElement('span');
    count.className = 'gcount';
    count.textContent = `(${g.items.length})`;
    const gstop = button('ghost gstop', 'Stop all', async (e) => {
      e?.preventDefault();
      for (const entry of g.items.filter((x) => x.stoppable)) await stopEntry(entry);
      await openLauncher();
    });
    summary.append(title, count, gstop);
    details.append(summary);

    for (const e of g.items) details.append(entryRow(e));
    container.append(details);
  }
}

function entryRow(e: ActivityEntry): HTMLElement {
  const row = document.createElement('div');
  row.className = 'jobrow';

  const lab = document.createElement('div');
  lab.className = 'jlabel';
  const main = document.createElement('div');
  main.className = 'jmain';
  main.textContent = `${e.icon} ${e.label}`;
  const sub = document.createElement('div');
  sub.className = 'jsub';
  sub.textContent = activityMode === 'target' ? e.moduleName : e.targetLabel;
  lab.append(main, sub);

  const next = document.createElement('span');
  next.className = 'next';
  next.dataset.next = e.nextFireAt != null ? String(e.nextFireAt) : '';
  next.dataset.paused = e.paused ? '1' : '0';
  row.append(lab, next);

  if (e.pausable) {
    const toggle = button('iconbtn', e.paused ? '▶' : '⏸', async () => {
      await send({ type: e.paused ? 'resumeJob' : 'pauseJob', id: e.jobId });
      await openLauncher();
    });
    toggle.title = e.paused ? 'Resume' : 'Pause';
    row.append(toggle);
  }

  if (e.stoppable) {
    const stop = button('iconbtn', '⏹', async () => {
      await stopEntry(e);
      await openLauncher();
    });
    stop.title = e.source === 'job' ? 'Stop' : 'Turn off';
    row.append(stop);
  }

  return row;
}

// --- Module list ---

function score(d: ModuleDescriptor, q: string): boolean {
  if (!q) return true;
  const hay = `${d.name} ${d.description} ${d.category} ${d.keywords.join(' ')}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((term) => hay.includes(term));
}

function activeCount(moduleId: string): number {
  return activity.filter((e) => e.moduleId === moduleId).length;
}

function renderList(query: string): void {
  const list = $('list');
  list.innerHTML = '';
  const matches = descriptors.filter((d) => score(d, query));

  const pinned = matches.filter((d) => pins.includes(d.id));
  const frequent = matches
    .filter((d) => !pins.includes(d.id) && (usage[d.id] ?? 0) > 0)
    .sort((a, b) => (usage[b.id] ?? 0) - (usage[a.id] ?? 0));
  const rest = matches.filter((d) => !pins.includes(d.id) && !(usage[d.id] ?? 0));

  if (pinned.length) list.appendChild(section('Pinned', pinned));
  if (frequent.length) list.appendChild(section('Most used', frequent));
  if (rest.length) list.appendChild(section(query ? 'Results' : 'All extensions', rest));
  if (!matches.length) list.appendChild(muted('No matching extensions.'));
}

function section(title: string, items: ModuleDescriptor[]): HTMLElement {
  const wrap = document.createElement('div');
  const h = document.createElement('h2');
  h.textContent = title;
  wrap.appendChild(h);
  const ul = document.createElement('ul');
  for (const d of items) ul.appendChild(itemEl(d));
  wrap.appendChild(ul);
  return wrap;
}

function itemEl(d: ModuleDescriptor): HTMLElement {
  const li = document.createElement('li');
  li.className = 'item';
  li.tabIndex = 0;

  const ico = document.createElement('span');
  ico.className = 'ico';
  ico.textContent = d.icon;

  const meta = document.createElement('div');
  meta.className = 'meta';
  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = d.name;

  const active = activeCount(d.id);
  const status = statusById.get(d.id);
  if (!ready(d)) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.style.background = '#6b7280';
    badge.textContent = '🔒 enable';
    name.appendChild(badge);
  } else if (active) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = `${active} active`;
    name.appendChild(badge);
  } else if (status?.active) {
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.title = status.summary;
    name.appendChild(dot);
  }

  const desc = document.createElement('div');
  desc.className = 'desc';
  desc.textContent = status && status.summary ? status.summary : d.description;
  meta.append(name, desc);

  const pin = document.createElement('button');
  pin.className = 'pin' + (pins.includes(d.id) ? ' on' : '');
  pin.textContent = '📌';
  pin.title = pins.includes(d.id) ? 'Unpin' : 'Pin';
  pin.addEventListener('click', async (e) => {
    e.stopPropagation();
    const res = await send<{ pins: string[] }>({ type: 'togglePin', id: d.id });
    pins = res.pins;
    renderList(($('search') as HTMLInputElement).value);
  });

  li.append(ico, meta, pin);
  const open = () => void openModule(d);
  li.addEventListener('click', open);
  li.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') open();
  });
  return li;
}

async function openModule(d: ModuleDescriptor): Promise<void> {
  setError('');
  if (!ready(d)) {
    renderEnable(d);
    return;
  }
  await send({ type: 'recordLaunch', id: d.id });
  usage[d.id] = (usage[d.id] ?? 0) + 1;

  const panel = panels[d.id];
  if (!d.hasPanel || !panel) {
    await openLauncher();
    return;
  }

  $('panelTitle').textContent = `${d.icon} ${d.name}`;
  const root = $('panelRoot');
  root.innerHTML = '';
  show('panel');

  const activeTab = await getActiveTab();
  const host: PanelHost = {
    descriptor: d,
    activeTab,
    call: async <T,>(command: string, payload?: unknown) => {
      const res = await send<{ result: T }>({ type: 'module', id: d.id, command, payload });
      return res.result;
    },
    runInActiveTab: async (func, args) => {
      if (!activeTab) return undefined;
      try {
        // Called from the popup so the user gesture propagates to gesture-gated page APIs.
        const results = await browser.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: func as (...a: unknown[]) => unknown,
          args: args as unknown[],
        });
        return results?.[0]?.result;
      } catch {
        return undefined;
      }
    },
    back: () => void openLauncher(),
  };
  await panel.render(root, host);
}

function renderEnable(d: ModuleDescriptor): void {
  $('panelTitle').textContent = `${d.icon} ${d.name}`;
  const root = $('panelRoot');
  root.innerHTML = '';
  show('panel');

  const items = [...d.permissions];
  if (d.origins.length) items.push('access to the websites you use it on');

  const ul = document.createElement('ul');
  ul.className = 'jobs';
  for (const p of items) ul.append(Object.assign(document.createElement('li'), { textContent: `• ${p}` }));

  const grant = button('primary', `Enable ${d.name}`, async () => {
    try {
      const ok = await browser.permissions.request({ permissions: d.permissions, origins: d.origins } as Parameters<typeof browser.permissions.request>[0]);
      if (!ok) {
        setError('Permission was declined.');
        return;
      }
      await loadGranted();
      await send({ type: 'rebuildMenus' }).catch(() => undefined);
      void openModule(d);
    } catch {
      setError('Could not request permission.');
    }
  });
  grant.style.cssText = 'width:100%;margin-top:8px';

  root.append(
    muted('This tool needs your permission to run:'),
    ul,
    grant,
    muted('Granted once and shared — any other tool that needs the same permission won’t ask again.'),
  );
}

async function renderPermissions(): Promise<void> {
  await loadGranted();
  $('panelTitle').textContent = '🔐 Permissions';
  const root = $('panelRoot');
  root.innerHTML = '';
  show('panel');

  const optional = ['tabs', 'scripting', 'notifications', 'cookies', 'sessions', 'downloads', 'contextMenus'];
  const rows = optional.filter((p) => grantedPerms.has(p));
  const hasHost = grantedOrigins.includes('<all_urls>');
  if (!rows.length && !hasHost) {
    root.append(muted('No optional permissions granted yet. Tools ask for what they need as you enable them.'));
    return;
  }
  root.append(muted('These are shared by every tool that uses them. Revoking one affects all of them.'));
  const ul = document.createElement('ul');
  ul.className = 'jobs';
  const addRow = (label: string, revoke: () => Promise<void>): void => {
    const rm = button('ghost', 'Revoke', async () => {
      try {
        await revoke();
      } catch {
        /* ignore */
      }
      await renderPermissions();
    });
    ul.append(el('li', {}, [el('span', { className: 'label', textContent: label }), rm]));
  };
  for (const p of rows) addRow(p, async () => void (await browser.permissions.remove({ permissions: [p] } as Parameters<typeof browser.permissions.remove>[0])));
  if (hasHost) addRow('website access (<all_urls>)', async () => void (await browser.permissions.remove({ origins: ['<all_urls>'] })));
  root.append(ul);
}

async function getActiveTab(): Promise<ActiveTab | null> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return null;
    return { id: tab.id, url: tab.url ?? '', title: tab.title ?? '' };
  } catch {
    return null;
  }
}

// --- helpers ---

function button(className: string, text: string, onClick: (e?: Event) => void): HTMLButtonElement {
  const b = document.createElement('button');
  if (className) b.className = className;
  b.textContent = text;
  b.addEventListener('click', onClick);
  return b;
}

function muted(text: string): HTMLElement {
  const p = document.createElement('p');
  p.className = 'muted';
  p.textContent = text;
  return p;
}

// --- wiring ---
$('unlockBtn').addEventListener('click', async () => {
  setError('');
  const input = $('pass') as HTMLInputElement;
  const passphrase = input.value;
  if (!passphrase) {
    setError('Enter a passphrase.');
    return;
  }
  try {
    await send({ type: 'unlock', passphrase });
    input.value = '';
    await openLauncher();
  } catch (e) {
    setError(e instanceof Error ? e.message : String(e));
  }
});

$('pass').addEventListener('keydown', (e) => {
  if ((e as KeyboardEvent).key === 'Enter') ($('unlockBtn') as HTMLButtonElement).click();
});

$('lockBtn').addEventListener('click', async () => {
  if (countdownTimer) clearInterval(countdownTimer);
  await send({ type: 'lock' });
  show('locked');
  $('status').textContent = 'Locked — enter your master passphrase.';
});

$('backBtn').addEventListener('click', () => void openLauncher());

$('permsBtn').addEventListener('click', () => void renderPermissions());

$('search').addEventListener('input', (e) => {
  renderList((e.target as HTMLInputElement).value);
});

void boot();
