import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const LEVELS = [1, 1.5, 2, 3, 4];

const panel: Panel = {
  async render(root, host) {
    const status = el('p', { className: 'muted', textContent: 'Boosts audio on the active tab. 100% is normal.' });

    const apply = async (level: number) => {
      const r = await host.call<{ state: string }>('setLevel', { level });
      if (r.state === 'no-media') status.textContent = 'No audio/video on this tab.';
      else if (r.state === 'unsupported') status.textContent = 'Web Audio not available here.';
      else status.textContent = `Volume set to ${Math.round(level * 100)}%.`;
    };

    const buttons = el(
      'div',
      { className: 'row', style: 'flex-wrap:wrap' },
      LEVELS.map((l) => {
        const b = el('button', { className: 'ghost', textContent: `${Math.round(l * 100)}%` });
        b.addEventListener('click', () => void apply(l));
        return b;
      }),
    );

    root.append(status, el('label', { textContent: 'Volume' }), buttons);
  },
};

export default panel;
