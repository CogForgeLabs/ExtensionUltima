import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const status = el('p', { className: 'muted', textContent: 'Opens this page in a private window (allow the extension in incognito first).' });
    const btn = el('button', { className: 'primary', textContent: 'Open this page in private', style: 'width:100%' });
    btn.addEventListener('click', async () => {
      try {
        await host.call('openCurrent');
        window.close();
      } catch {
        status.textContent = 'No page to open, or incognito not allowed for this extension.';
      }
    });
    root.append(status, btn);
  },
};

export default panel;
