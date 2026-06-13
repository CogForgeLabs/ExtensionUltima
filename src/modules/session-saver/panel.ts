import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface SessionView {
  id: string;
  name: string;
  count: number;
  savedAt: number;
}

const panel: Panel = {
  async render(root, host) {
    const name = el('input', { type: 'text', placeholder: 'Session name', style: 'flex:1' }) as HTMLInputElement;
    const save = el('button', { className: 'primary', textContent: 'Save current window' });
    const list = el('div', {});

    const refresh = async () => {
      const sessions = await host.call<SessionView[]>('list');
      list.replaceChildren(el('h2', { textContent: 'Saved sessions' }));
      if (!sessions.length) {
        list.append(el('p', { className: 'muted', textContent: 'No saved sessions.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const s of sessions) {
        const restore = el('button', { className: 'ghost', textContent: 'Restore' });
        restore.addEventListener('click', () => void host.call('restore', { id: s.id }));
        const del = el('button', { className: 'ghost', textContent: '🗑' });
        del.addEventListener('click', async () => {
          await host.call('remove', { id: s.id });
          await refresh();
        });
        ul.append(
          el('li', {}, [el('span', { className: 'label', textContent: `${s.name} (${s.count} tabs)` }), restore, del]),
        );
      }
      list.append(ul);
    };

    save.addEventListener('click', async () => {
      try {
        await host.call('saveCurrent', { name: name.value.trim() });
        name.value = '';
        await refresh();
      } catch {
        save.textContent = 'Nothing to save';
        setTimeout(() => (save.textContent = 'Save current window'), 1200);
      }
    });

    root.append(el('div', { className: 'row' }, [name, save]), list);
    await refresh();
  },
};

export default panel;
