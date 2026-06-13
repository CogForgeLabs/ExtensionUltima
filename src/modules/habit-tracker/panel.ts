import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface HabitView {
  id: string;
  name: string;
  streak: number;
  doneToday: boolean;
}

const panel: Panel = {
  async render(root, host) {
    const name = el('input', { type: 'text', placeholder: 'New habit', style: 'flex:1' }) as HTMLInputElement;
    const add = el('button', { className: 'primary', textContent: 'Add' });
    const list = el('div', {});

    const refresh = async (): Promise<void> => {
      const items = await host.call<HabitView[]>('list');
      list.replaceChildren(el('h2', { textContent: 'Habits' }));
      if (!items.length) {
        list.append(el('p', { className: 'muted', textContent: 'No habits yet.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const h of items) {
        const check = el('button', { className: h.doneToday ? 'primary' : 'ghost', textContent: h.doneToday ? '✓ Today' : 'Mark today' });
        check.addEventListener('click', async () => {
          await host.call('toggleToday', { id: h.id });
          await refresh();
        });
        const del = el('button', { className: 'ghost', textContent: '🗑' });
        del.addEventListener('click', async () => {
          await host.call('remove', { id: h.id });
          await refresh();
        });
        ul.append(
          el('li', {}, [
            el('span', { className: 'label' }, [
              el('div', { style: 'font-weight:600', textContent: h.name }),
              el('div', { className: 'muted', style: 'font-size:11px', textContent: `🔥 ${h.streak} day streak` }),
            ]),
            check,
            del,
          ]),
        );
      }
      list.append(ul);
    };

    add.addEventListener('click', async () => {
      try {
        await host.call('add', { name: name.value });
        name.value = '';
        await refresh();
      } catch {
        /* ignore */
      }
    });

    root.append(el('div', { className: 'row' }, [name, add]), list);
    await refresh();
  },
};

export default panel;
