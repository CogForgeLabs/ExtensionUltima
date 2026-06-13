import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const PRESETS = [15, 30, 60, 180, 480];

function label(m: number): string {
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${m / 60}h`;
  return `${m / 1440}d`;
}

const panel: Panel = {
  async render(root, host) {
    const status = el('p', { className: 'muted', textContent: 'Closes this tab and reopens it after the chosen time.' });

    const row = el(
      'div',
      { className: 'row', style: 'flex-wrap:wrap' },
      PRESETS.map((m) => {
        const b = el('button', { className: 'ghost', textContent: label(m) });
        b.addEventListener('click', async () => {
          await host.call('snooze', { minutes: m });
          window.close();
        });
        return b;
      }),
    );

    const custom = el('input', { type: 'number', min: '1', placeholder: 'minutes', style: 'width:90px' }) as HTMLInputElement;
    const go = el('button', { className: 'primary', textContent: 'Snooze' });
    go.addEventListener('click', async () => {
      const m = Number(custom.value);
      if (m > 0) {
        await host.call('snooze', { minutes: m });
        window.close();
      }
    });

    root.append(status, el('label', { textContent: 'Reopen in…' }), row, el('div', { className: 'row', style: 'margin-top:6px' }, [custom, go]));
  },
};

export default panel;
