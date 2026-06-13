import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface T {
  id: number;
  title: string;
  url: string;
}

const panel: Panel = {
  async render(root, host) {
    const search = el('input', { type: 'search', placeholder: 'Search tabs…', style: 'width:100%' }) as HTMLInputElement;
    const list = el('div', { className: 'groups', style: 'margin-top:6px' });
    let tabs = await host.call<T[]>('list');

    const draw = (): void => {
      const q = search.value.toLowerCase();
      list.replaceChildren();
      const ul = el('ul', { className: 'jobs' });
      for (const t of tabs.filter((x) => !q || `${x.title} ${x.url}`.toLowerCase().includes(q))) {
        const open = el('span', { className: 'label', style: 'cursor:pointer;min-width:0' }, [
          el('div', { style: 'font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', textContent: t.title || t.url }),
          el('div', { className: 'muted', style: 'font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', textContent: t.url }),
        ]);
        open.addEventListener('click', async () => {
          await host.call('activate', { id: t.id });
          window.close();
        });
        const x = el('button', { className: 'ghost', textContent: '✕' });
        x.addEventListener('click', async () => {
          await host.call('close', { id: t.id });
          tabs = await host.call<T[]>('list');
          draw();
        });
        ul.append(el('li', {}, [open, x]));
      }
      list.append(ul);
    };

    search.addEventListener('input', draw);
    root.append(search, list);
    draw();
    search.focus();
  },
};

export default panel;
