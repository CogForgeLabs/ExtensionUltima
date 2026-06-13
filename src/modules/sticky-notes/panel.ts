import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const add = el('button', { className: 'primary', textContent: 'Add sticky note to this page', style: 'width:100%' });
    add.addEventListener('click', async () => {
      await host.call('add');
      window.close();
    });
    root.append(
      el('p', { className: 'muted', textContent: 'Adds a draggable note to the current page. Edit it inline; it returns when you revisit. Manage all from the Activity dashboard.' }),
      add,
    );
  },
};

export default panel;
