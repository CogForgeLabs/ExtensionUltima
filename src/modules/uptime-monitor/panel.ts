import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface Monitor {
  url: string;
  up: boolean | null;
}

const panel: Panel = {
  async render(root, host) {
    const url = el('input', { type: 'text', placeholder: 'https://example.com', value: host.activeTab?.url ?? '', style: 'flex:1' }) as HTMLInputElement;
    const add = el('button', { className: 'primary', textContent: 'Monitor' });
    const list = el('div', {});

    const refresh = async (): Promise<void> => {
      const items = await host.call<Monitor[]>('list');
      list.replaceChildren(el('h2', { textContent: 'Monitored' }));
      if (!items.length) {
        list.append(el('p', { className: 'muted', textContent: 'Nothing monitored. Checks run every 5 minutes.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const m of items) {
        const dot = m.up === false ? '🔴' : m.up ? '🟢' : '⚪';
        const x = el('button', { className: 'ghost', textContent: 'Remove' });
        x.addEventListener('click', async () => {
          await host.call('remove', { url: m.url });
          await refresh();
        });
        ul.append(el('li', {}, [el('span', { className: 'label', textContent: `${dot} ${m.url}` }), x]));
      }
      list.append(ul);
    };

    add.addEventListener('click', async () => {
      try {
        await host.call('add', { url: url.value.trim() });
        await refresh();
      } catch {
        add.textContent = 'Bad URL';
        setTimeout(() => (add.textContent = 'Monitor'), 1200);
      }
    });

    root.append(el('div', { className: 'row' }, [url, add]), list);
    await refresh();
  },
};

export default panel;
