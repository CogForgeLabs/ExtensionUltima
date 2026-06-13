import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root) {
    root.append(
      el('p', { className: 'muted', textContent: 'In the address bar, type:' }),
      el('div', { style: 'font:13px monospace;padding:8px;border:1px solid #8883;border-radius:6px;margin:6px 0', textContent: 'eu  then Space  then your search or URL' }),
      el('p', { className: 'muted', style: 'font-size:11px', textContent: 'Enter a search term to search the web, or a domain to open it directly.' }),
    );
  },
};

export default panel;
