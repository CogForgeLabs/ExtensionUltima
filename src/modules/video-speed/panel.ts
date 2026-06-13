import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

const panel: Panel = {
  async render(root, host) {
    const status = el('p', { className: 'muted', textContent: 'Applies to videos/audio on the active tab, and sticks across videos.' });

    const apply = async (rate: number) => {
      const r = await host.call<{ applied: number }>('setSpeed', { rate });
      status.textContent = r.applied ? `Set ${rate}× on ${r.applied} player(s).` : 'No media found on this tab.';
    };

    const buttons = el(
      'div',
      { className: 'row', style: 'flex-wrap:wrap' },
      RATES.map((r) => {
        const b = el('button', { className: 'ghost', textContent: `${r}×` });
        b.addEventListener('click', () => void apply(r));
        return b;
      }),
    );

    const custom = el('input', { type: 'number', step: '0.1', min: '0.1', placeholder: 'e.g. 1.8', style: 'width:90px' }) as HTMLInputElement;
    const customBtn = el('button', { className: 'ghost', textContent: 'Set' });
    customBtn.addEventListener('click', () => {
      const r = Number(custom.value);
      if (r > 0) void apply(r);
    });

    root.append(
      status,
      el('label', { textContent: 'Playback speed' }),
      buttons,
      el('div', { className: 'row', style: 'margin-top:6px' }, [custom, customBtn]),
    );
  },
};

export default panel;
