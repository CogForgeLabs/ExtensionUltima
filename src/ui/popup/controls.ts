// Reusable panel controls (scope picker, timing, checkboxes, fields, active-jobs list) so
// each module panel is small and consistent. Modules import these from the popup layer.
import { el } from './dom';
import type { ActiveTab, PanelHost } from './host';
import type { Scope } from '../../core/triggers/types';

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export interface ScopeControl {
  node: HTMLElement;
  get(): Scope | null;
}

export function scopeControl(tab: ActiveTab | null): ScopeControl {
  const domain = tab ? domainOf(tab.url) : '';
  const sel = el('select', {}, [
    el('option', { value: 'tab', textContent: 'This tab' }),
    el('option', { value: 'url', textContent: 'This exact URL' }),
    el('option', { value: 'domain', textContent: `This site (${domain || 'domain'})` }),
    el('option', { value: 'all-tabs', textContent: 'All open tabs' }),
  ]) as HTMLSelectElement;
  const node = el('div', {}, [el('label', { textContent: 'Run on' }), sel]);
  return {
    node,
    get(): Scope | null {
      switch (sel.value) {
        case 'tab':
          return tab ? { kind: 'tab', tabId: tab.id } : null;
        case 'url':
          return tab ? { kind: 'url', pattern: tab.url } : null;
        case 'domain':
          return domain ? { kind: 'domain', domain } : null;
        default:
          return { kind: 'all-tabs' };
      }
    },
  };
}

export interface Timing {
  seconds?: number;
  randomizeToSeconds?: number;
  times?: string[];
}

export interface TimingControl {
  node: HTMLElement;
  get(): Timing;
  set(t: Timing): void;
}

export function timingControl(defaultSeconds = 60): TimingControl {
  const seconds = el('input', { type: 'number', value: String(defaultSeconds), min: '1', style: 'width:80px' }) as HTMLInputElement;
  const randomTo = el('input', { type: 'number', placeholder: 'max', min: '1', style: 'width:80px' }) as HTMLInputElement;
  const times = el('input', { type: 'text', placeholder: 'e.g. 09:00, 17:30', style: 'width:100%' }) as HTMLInputElement;
  const node = el('fieldset', {}, [
    el('legend', { textContent: 'Timing' }),
    el('label', { textContent: 'Every (seconds)' }),
    el('div', { className: 'row' }, [
      seconds,
      el('span', { className: 'muted', textContent: 'to' }),
      randomTo,
      el('span', { className: 'muted', textContent: 'random (optional)' }),
    ]),
    el('label', { textContent: 'Or at times of day (overrides interval)' }),
    times,
  ]);
  return {
    node,
    get(): Timing {
      const t = times.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        seconds: Number(seconds.value) || defaultSeconds,
        randomizeToSeconds: randomTo.value ? Number(randomTo.value) : undefined,
        times: t.length ? t : undefined,
      };
    },
    set(v: Timing): void {
      if (v.seconds != null) seconds.value = String(v.seconds);
      if (v.randomizeToSeconds != null) randomTo.value = String(v.randomizeToSeconds);
      if (v.times) times.value = v.times.join(', ');
    },
  };
}

export function checkbox(labelText: string): { node: HTMLElement; input: HTMLInputElement } {
  const input = el('input', { type: 'checkbox' }) as HTMLInputElement;
  const node = el('div', { className: 'check' }, [input, el('span', { textContent: labelText })]);
  return { node, input };
}

export function textField(labelText: string, placeholder = ''): { node: HTMLElement; input: HTMLInputElement } {
  const input = el('input', { type: 'text', placeholder, style: 'width:100%' }) as HTMLInputElement;
  const node = el('div', {}, [el('label', { textContent: labelText }), input]);
  return { node, input };
}

interface JobView {
  id: string;
  label: string;
}

export interface JobsList {
  node: HTMLElement;
  refresh(): Promise<void>;
}

export function jobsList(host: PanelHost): JobsList {
  const ul = el('ul', { className: 'jobs' });
  const node = el('div', {}, [el('h2', { textContent: 'Active automations' }), ul]);
  async function refresh(): Promise<void> {
    const jobs = await host.call<JobView[]>('list');
    ul.innerHTML = '';
    if (!jobs.length) {
      ul.append(el('p', { className: 'muted', textContent: 'None running.' }));
      return;
    }
    for (const j of jobs) {
      const stop = el('button', { className: 'ghost', textContent: 'Stop' });
      stop.addEventListener('click', async () => {
        await host.call('stop', { jobId: j.id });
        await refresh();
      });
      ul.append(el('li', {}, [el('span', { className: 'label', textContent: j.label }), stop]));
    }
  }
  return { node, refresh };
}

/** Standard footer with a Start button (and optional Stop all) wired to handlers. */
export function actions(onStart: () => Promise<void>, onStopAll: () => Promise<void>): HTMLElement {
  const start = el('button', { className: 'primary', textContent: 'Start', style: 'flex:1' }) as HTMLButtonElement;
  const stopAll = el('button', { className: 'ghost', textContent: 'Stop all' }) as HTMLButtonElement;
  start.addEventListener('click', async () => {
    await onStart();
    start.textContent = 'Started ✓';
    setTimeout(() => (start.textContent = 'Start'), 1200);
  });
  stopAll.addEventListener('click', onStopAll);
  return el('div', { className: 'row', style: 'margin-top:8px' }, [start, stopAll]);
}
