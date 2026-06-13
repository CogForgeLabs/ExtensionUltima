import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface BM {
  id: string;
  title: string;
  url: string;
  tags: string[];
}

const panel: Panel = {
  async render(root, host) {
    const tab = host.activeTab;
    const title = el('input', { type: 'text', placeholder: 'Title', value: tab?.title ?? '', style: 'width:100%' }) as HTMLInputElement;
    const url = el('input', { type: 'text', placeholder: 'URL', value: tab?.url ?? '', style: 'width:100%' }) as HTMLInputElement;
    const tags = el('input', { type: 'text', placeholder: 'tags (comma separated)', style: 'width:100%' }) as HTMLInputElement;
    const add = el('button', { className: 'primary', textContent: 'Save bookmark', style: 'width:100%' });
    const search = el('input', { type: 'search', placeholder: 'Search bookmarks…', style: 'width:100%' }) as HTMLInputElement;
    const list = el('div', {});

    let items: BM[] = [];
    const draw = (): void => {
      const q = search.value.toLowerCase();
      list.replaceChildren();
      const ul = el('ul', { className: 'jobs' });
      for (const b of items.filter((x) => !q || `${x.title} ${x.url} ${x.tags.join(' ')}`.toLowerCase().includes(q))) {
        const open = el('span', { className: 'label', style: 'cursor:pointer;min-width:0' }, [
          el('div', { style: 'font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', textContent: b.title }),
          el('div', { className: 'muted', style: 'font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', textContent: b.tags.length ? b.tags.join(', ') : b.url }),
        ]);
        open.addEventListener('click', () => window.open(b.url, '_blank'));
        const del = el('button', { className: 'ghost', textContent: '🗑' });
        del.addEventListener('click', async () => {
          await host.call('remove', { id: b.id });
          await refresh();
        });
        ul.append(el('li', {}, [open, del]));
      }
      list.append(ul);
    };
    const refresh = async (): Promise<void> => {
      items = await host.call<BM[]>('list');
      draw();
    };

    add.addEventListener('click', async () => {
      await host.call('add', {
        title: title.value.trim(),
        url: url.value.trim(),
        tags: tags.value.split(',').map((t) => t.trim()).filter(Boolean),
      });
      tags.value = '';
      await refresh();
    });
    search.addEventListener('input', draw);

    root.append(
      el('fieldset', {}, [el('legend', { textContent: 'Add' }), title, url, tags, add]),
      search,
      list,
    );
    await refresh();
  },
};

export default panel;
