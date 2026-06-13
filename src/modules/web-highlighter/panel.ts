import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const status = el('p', { className: 'muted', textContent: 'Select text on the page, then highlight it. Highlights return when you revisit.' });

    const hl = el('button', { className: 'primary', textContent: 'Highlight selection', style: 'flex:1' });
    hl.addEventListener('click', async () => {
      const r = await host.call<{ added: boolean }>('highlight');
      status.textContent = r.added ? 'Highlighted ✓' : 'Select some text on the page first.';
    });

    const clear = el('button', { className: 'ghost', textContent: 'Clear page' });
    clear.addEventListener('click', async () => {
      await host.call('clearPage');
      status.textContent = 'Cleared this page’s highlights.';
    });

    root.append(status, el('div', { className: 'row' }, [hl, clear]));
  },
};

export default panel;
