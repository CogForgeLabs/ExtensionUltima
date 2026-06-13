import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const list = el('div', {});
    const addBtn = el('button', { className: 'primary', textContent: 'Mute this site', style: 'flex:1' });

    const refresh = async () => {
      const domains = await host.call<string[]>('list');
      list.replaceChildren(el('h2', { textContent: 'Muted sites' }));
      if (!domains.length) {
        list.append(el('p', { className: 'muted', textContent: 'No muted sites.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const d of domains) {
        const del = el('button', { className: 'ghost', textContent: 'Unmute' });
        del.addEventListener('click', async () => {
          await host.call('remove', { domain: d });
          await refresh();
        });
        ul.append(el('li', {}, [el('span', { className: 'label', textContent: d }), del]));
      }
      list.append(ul);
    };

    addBtn.addEventListener('click', async () => {
      try {
        await host.call('addCurrent');
        await refresh();
      } catch {
        addBtn.textContent = 'No site to mute';
        setTimeout(() => (addBtn.textContent = 'Mute this site'), 1200);
      }
    });

    root.append(el('div', { className: 'row' }, [addBtn]), list);
    await refresh();
  },
};

export default panel;
