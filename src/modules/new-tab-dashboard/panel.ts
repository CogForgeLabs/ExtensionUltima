import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';
import browser from '../../core/browser';

const panel: Panel = {
  async render(root) {
    const open = el('button', { className: 'primary', textContent: 'Open dashboard', style: 'width:100%' });
    open.addEventListener('click', () => {
      window.open(browser.runtime.getURL('newtab.html'), '_blank');
    });
    root.append(
      el('p', { className: 'muted', textContent: 'A dashboard page with a clock, web search, today’s tracked time, and recent bookmarks. Opens on demand — it does not replace your browser’s new tab page.' }),
      open,
      el('p', { className: 'muted', style: 'font-size:11px;margin-top:8px', textContent: 'Want it as your actual new-tab page? Build with EU_NEWTAB=1 to opt in.' }),
    );
  },
};

export default panel;
