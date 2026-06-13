import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const speed = el('input', { type: 'range', min: '1', max: '20', value: '3', style: 'width:100%' }) as HTMLInputElement;
    const start = el('button', { className: 'primary', textContent: 'Start', style: 'flex:1' });
    start.addEventListener('click', () => void host.call('start', { speed: Number(speed.value) }));
    const stop = el('button', { className: 'ghost', textContent: 'Stop' });
    stop.addEventListener('click', () => void host.call('stop'));

    root.append(
      el('p', { className: 'muted', textContent: 'Auto-scrolls the active tab. Adjust speed and press Start.' }),
      el('label', { textContent: 'Speed' }),
      speed,
      el('div', { className: 'row', style: 'margin-top:8px' }, [start, stop]),
    );
  },
};

export default panel;
