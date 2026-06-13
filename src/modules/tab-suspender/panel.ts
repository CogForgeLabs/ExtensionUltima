import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';
import { jobsList } from '../../ui/popup/controls';

const panel: Panel = {
  async render(root, host) {
    const minutes = el('input', { type: 'number', value: '30', min: '1', style: 'width:80px' }) as HTMLInputElement;
    const jobs = jobsList(host);

    const start = el('button', { className: 'primary', textContent: 'Enable', style: 'flex:1' });
    start.addEventListener('click', async () => {
      await host.call('start', { minutes: Number(minutes.value) || 30 });
      await jobs.refresh();
    });
    const stop = el('button', { className: 'ghost', textContent: 'Disable' });
    stop.addEventListener('click', async () => {
      await host.call('stopAll');
      await jobs.refresh();
    });

    root.append(
      el('p', { className: 'muted' }, ['Discards tabs you haven’t used in a while (keeps active, audible, and pinned tabs).']),
      el('div', { className: 'row' }, [el('span', { textContent: 'Idle for (minutes)' }), minutes]),
      el('div', { className: 'row', style: 'margin-top:8px' }, [start, stop]),
      jobs.node,
    );
    await jobs.refresh();
  },
};

export default panel;
