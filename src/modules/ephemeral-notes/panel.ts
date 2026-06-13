import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface Note {
  id: string;
  text: string;
  expiresAt: number;
}

function fmtLeft(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60_000));
  if (m < 60) return `${m}m left`;
  return `${Math.round(m / 60)}h left`;
}

const panel: Panel = {
  async render(root, host) {
    const text = el('textarea', { placeholder: 'Note text…', style: 'width:100%;height:70px' }) as HTMLTextAreaElement;
    const minutes = el('input', { type: 'number', min: '1', value: '60', style: 'width:80px' }) as HTMLInputElement;
    const add = el('button', { className: 'primary', textContent: 'Add', style: 'flex:1' });
    const list = el('div', {});

    const refresh = async (): Promise<void> => {
      const notes = await host.call<Note[]>('list');
      list.replaceChildren(el('h2', { textContent: 'Notes' }));
      if (!notes.length) {
        list.append(el('p', { className: 'muted', textContent: 'No active notes.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const n of notes) {
        const del = el('button', { className: 'ghost', textContent: '🗑' });
        del.addEventListener('click', async () => {
          await host.call('remove', { id: n.id });
          await refresh();
        });
        ul.append(
          el('li', {}, [
            el('span', { className: 'label' }, [
              el('div', { style: 'font-size:12px;white-space:pre-wrap', textContent: n.text }),
              el('div', { className: 'muted', style: 'font-size:10px', textContent: fmtLeft(n.expiresAt - Date.now()) }),
            ]),
            del,
          ]),
        );
      }
      list.append(ul);
    };

    add.addEventListener('click', async () => {
      try {
        await host.call('add', { text: text.value, minutes: Number(minutes.value) || 60 });
        text.value = '';
        await refresh();
      } catch {
        /* empty */
      }
    });

    root.append(
      text,
      el('div', { className: 'row', style: 'margin-top:6px' }, [el('span', { className: 'muted', textContent: 'Expires in (min)' }), minutes, add]),
      list,
    );
    await refresh();
  },
};

export default panel;
