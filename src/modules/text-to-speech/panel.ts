import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const status = el('p', { className: 'muted', textContent: 'Reads text aloud using your system voice.' });

    const sel = el('button', { className: 'primary', textContent: 'Read selection', style: 'flex:1' });
    sel.addEventListener('click', async () => {
      const r = await host.call<{ state: string }>('read', { selectionOnly: true });
      if (r.state === 'empty') status.textContent = 'Select some text first (or use Read page).';
      else if (r.state === 'unsupported') status.textContent = 'Speech not available here.';
    });

    const page = el('button', { className: 'ghost', textContent: 'Read page' });
    page.addEventListener('click', () => void host.call('read', { selectionOnly: false }));

    const stop = el('button', { className: 'ghost', textContent: 'Stop' });
    stop.addEventListener('click', () => void host.call('stop'));

    root.append(status, el('div', { className: 'row' }, [sel, page, stop]));
  },
};

export default panel;
