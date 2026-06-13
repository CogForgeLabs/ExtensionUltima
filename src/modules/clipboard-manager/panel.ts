import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface Entry {
  id: string;
  text: string;
  at: number;
}

const panel: Panel = {
  async render(root, host) {
    const list = el('div', {});
    const refresh = async (): Promise<void> => {
      const items = await host.call<Entry[]>('list');
      list.replaceChildren();
      if (!items.length) {
        list.append(el('p', { className: 'muted', textContent: 'Copy text on a page and it shows up here.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const e of items) {
        const copy = el('span', { className: 'label', style: 'cursor:pointer;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', textContent: e.text });
        copy.addEventListener('click', async () => {
          await navigator.clipboard.writeText(e.text);
          copy.textContent = 'Copied ✓';
          setTimeout(() => void refresh(), 700);
        });
        const del = el('button', { className: 'ghost', textContent: '🗑' });
        del.addEventListener('click', async () => {
          await host.call('remove', { id: e.id });
          await refresh();
        });
        ul.append(el('li', {}, [copy, del]));
      }
      list.append(ul);
    };

    const clear = el('button', { className: 'ghost', textContent: 'Clear all' });
    clear.addEventListener('click', async () => {
      await host.call('clear');
      await refresh();
    });

    root.append(el('p', { className: 'muted', textContent: 'Click an item to copy it again.' }), list, el('div', { className: 'row', style: 'margin-top:8px' }, [clear]));
    await refresh();
  },
};

export default panel;
