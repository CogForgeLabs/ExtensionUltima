import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface Status {
  running: boolean;
  state: { phase: 'work' | 'break'; workMin: number; breakMin: number } | null;
}

const panel: Panel = {
  async render(root, host) {
    const work = el('input', { type: 'number', value: '25', min: '1', style: 'width:70px' }) as HTMLInputElement;
    const brk = el('input', { type: 'number', value: '5', min: '1', style: 'width:70px' }) as HTMLInputElement;
    const status = el('p', { className: 'muted' });

    const refresh = async () => {
      const s = await host.call<Status>('state');
      if (s.running && s.state) {
        status.textContent = `Running — currently in ${s.state.phase} (${s.state.workMin}m / ${s.state.breakMin}m).`;
      } else {
        status.textContent = 'Not running.';
      }
    };

    const start = el('button', { className: 'primary', textContent: 'Start', style: 'flex:1' });
    start.addEventListener('click', async () => {
      await host.call('start', { workMin: Number(work.value) || 25, breakMin: Number(brk.value) || 5 });
      await refresh();
    });
    const stop = el('button', { className: 'ghost', textContent: 'Stop' });
    stop.addEventListener('click', async () => {
      await host.call('stop');
      await refresh();
    });

    root.append(
      el('div', { className: 'row' }, [el('span', { textContent: 'Focus (min)' }), work, el('span', { textContent: 'Break (min)' }), brk]),
      el('div', { className: 'row', style: 'margin-top:8px' }, [start, stop]),
      status,
    );
    await refresh();
  },
};

export default panel;
