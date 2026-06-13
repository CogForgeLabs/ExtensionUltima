import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const btn = el('button', { className: 'primary', textContent: 'Merge all windows', style: 'width:100%' });
    btn.addEventListener('click', async () => {
      await host.call('merge');
      btn.textContent = 'Merged ✓';
      setTimeout(() => (btn.textContent = 'Merge all windows'), 1200);
    });
    root.append(el('p', { className: 'muted', textContent: 'Moves tabs from every window into this one.' }), btn);
  },
};

export default panel;
