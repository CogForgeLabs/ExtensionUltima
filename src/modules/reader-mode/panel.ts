import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const btn = el('button', { className: 'primary', textContent: 'Toggle Reader Mode', style: 'width:100%' });
    btn.addEventListener('click', async () => {
      await host.call('toggle');
      window.close();
    });
    root.append(
      el('p', { className: 'muted', textContent: 'Opens a clean reading view of the article on this page.' }),
      btn,
    );
  },
};

export default panel;
