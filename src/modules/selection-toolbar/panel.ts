import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const s = await host.call<{ enabled: boolean }>('get');
    const btn = el('button', { className: 'primary', textContent: s.enabled ? 'Turn off' : 'Turn on', style: 'width:100%' });
    const status = el('p', { className: 'muted', textContent: s.enabled ? 'On — select text on a page to see the toolbar.' : 'Off.' });
    btn.addEventListener('click', async () => {
      const r = await host.call<{ enabled: boolean }>('toggle');
      btn.textContent = r.enabled ? 'Turn off' : 'Turn on';
      status.textContent = r.enabled ? 'On — select text on a page to see the toolbar.' : 'Off.';
    });
    root.append(status, btn, el('p', { className: 'muted', style: 'font-size:11px;margin-top:8px', textContent: 'Already-open tabs take effect after a reload.' }));
  },
};

export default panel;
