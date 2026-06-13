// New-tab dashboard page. Talks to the background broker like the popup does.
import { send } from '../popup/host';

const $ = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
};

function tickClock(): void {
  const now = new Date();
  $('clock').textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  $('date').textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

($('search') as HTMLFormElement).addEventListener('submit', (e) => {
  e.preventDefault();
  const q = ($('q') as HTMLInputElement).value.trim();
  if (q) location.href = 'https://www.google.com/search?q=' + encodeURIComponent(q);
});

async function moduleCall<T>(id: string, command: string, payload?: unknown): Promise<T | null> {
  try {
    const res = await send<{ result: T }>({ type: 'module', id, command, payload });
    return res.result;
  } catch {
    return null;
  }
}

async function loadDashboard(): Promise<void> {
  // Today's tracked time
  const today = await moduleCall<Array<{ domain: string; seconds: number }>>('time-tracker', 'today');
  if (today) {
    const total = today.reduce((a, b) => a + b.seconds, 0);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    $('time').textContent = total ? `${h ? `${h}h ` : ''}${m}m across ${today.length} site(s)` : 'No activity yet.';
  }
  // Recent bookmarks
  const bms = await moduleCall<Array<{ title: string; url: string }>>('bookmark-vault', 'list');
  const box = $('bookmarks');
  box.replaceChildren();
  if (bms && bms.length) {
    for (const b of bms.slice(0, 8)) {
      const a = document.createElement('a');
      a.href = b.url;
      a.textContent = b.title;
      box.appendChild(a);
    }
  } else {
    box.append(Object.assign(document.createElement('div'), { className: 'muted', textContent: 'No bookmarks yet.' }));
  }
}

async function refresh(): Promise<void> {
  const s = await send<{ initialized: boolean; unlocked: boolean }>({ type: 'status' });
  $('lock').hidden = s.unlocked;
  $('cards').hidden = !s.unlocked;
  if (s.unlocked) await loadDashboard();
}

$('unlock').addEventListener('click', async () => {
  const input = $('pass') as HTMLInputElement;
  if (!input.value) return;
  try {
    await send({ type: 'unlock', passphrase: input.value });
    input.value = '';
    await refresh();
  } catch {
    input.value = '';
    input.placeholder = 'Incorrect — try again';
  }
});

tickClock();
setInterval(tickClock, 1000);
void refresh();
