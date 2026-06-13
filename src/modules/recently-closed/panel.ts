import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface Closed {
  sessionId: string;
  title: string;
  url: string;
}

const panel: Panel = {
  async render(root, host) {
    const list = el('div', {});
    const refresh = async (): Promise<void> => {
      const items = await host.call<Closed[]>('list');
      list.replaceChildren();
      if (!items.length) {
        list.append(el('p', { className: 'muted', textContent: 'Nothing recently closed.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const c of items) {
        const open = el('span', { className: 'label', style: 'cursor:pointer;min-width:0' }, [
          el('div', { style: 'font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', textContent: c.title || c.url }),
          el('div', { className: 'muted', style: 'font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', textContent: c.url }),
        ]);
        open.addEventListener('click', async () => {
          await host.call('restore', { sessionId: c.sessionId });
          window.close();
        });
        ul.append(el('li', {}, [open]));
      }
      list.append(ul);
    };
    root.append(list);
    await refresh();
  },
};

export default panel;
