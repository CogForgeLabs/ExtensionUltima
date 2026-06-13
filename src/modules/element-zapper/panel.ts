import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

type Sites = Record<string, string[]>;

const panel: Panel = {
  async render(root, host) {
    const status = el('p', { className: 'muted', textContent: 'Click "Pick", then click an element on the page to hide it (Esc to cancel).' });
    const pick = el('button', { className: 'primary', textContent: 'Pick element to hide', style: 'width:100%' });
    pick.addEventListener('click', () => {
      // Fire and let the popup close — the picker runs in the page until you click.
      void host.call('pick');
      window.close();
    });

    const list = el('div', {});
    const refresh = async (): Promise<void> => {
      const sites = await host.call<Sites>('list');
      const domains = Object.keys(sites);
      list.replaceChildren(el('h2', { textContent: 'Sites with hidden elements' }));
      if (!domains.length) {
        list.append(el('p', { className: 'muted', textContent: 'None yet.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const d of domains) {
        const x = el('button', { className: 'ghost', textContent: 'Reset' });
        x.addEventListener('click', async () => {
          await host.call('clearSite', { domain: d });
          await refresh();
        });
        ul.append(el('li', {}, [el('span', { className: 'label', textContent: `${d} (${sites[d].length})` }), x]));
      }
      list.append(ul);
    };

    root.append(status, pick, list);
    await refresh();
  },
};

export default panel;
