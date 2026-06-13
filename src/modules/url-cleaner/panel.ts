import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const s = await host.call<{ enabled: boolean; params: string[] }>('get');
    const status = el('p', { className: 'muted', textContent: s.enabled ? 'On — tracking params are removed as pages load.' : 'Off.' });

    const toggle = el('button', { className: 'primary', textContent: s.enabled ? 'Turn off' : 'Turn on', style: 'width:100%' });
    toggle.addEventListener('click', async () => {
      const r = await host.call<{ enabled: boolean }>('toggle');
      toggle.textContent = r.enabled ? 'Turn off' : 'Turn on';
      status.textContent = r.enabled ? 'On — tracking params are removed as pages load.' : 'Off.';
    });

    root.append(
      status,
      toggle,
      el('label', { textContent: 'Stripped parameters', style: 'margin-top:10px' }),
      el('p', { className: 'muted', style: 'font-size:11px', textContent: s.params.join(', ') }),
    );
  },
};

export default panel;
