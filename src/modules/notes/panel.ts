import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface NoteMeta {
  id: string;
  title: string;
  updatedAt: number;
}

const panel: Panel = {
  async render(root, host) {
    const view = el('div', {});

    const showList = async () => {
      const notes = await host.call<NoteMeta[]>('list');
      view.replaceChildren(
        el('div', { className: 'row' }, [
          el('button', { className: 'primary', textContent: '+ New note', style: 'flex:1', onclick: () => void showEditor() }),
        ]),
      );
      if (!notes.length) {
        view.append(el('p', { className: 'muted', textContent: 'No notes yet.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const n of notes) {
        const open = el('span', { className: 'label', style: 'cursor:pointer', textContent: n.title });
        open.addEventListener('click', () => void showEditor(n.id));
        const del = el('button', { className: 'ghost', textContent: '🗑' });
        del.addEventListener('click', async () => {
          await host.call('remove', { id: n.id });
          await showList();
        });
        ul.append(el('li', {}, [open, del]));
      }
      view.append(ul);
    };

    const showEditor = async (id?: string) => {
      let note = { id: undefined as string | undefined, title: '', body: '' };
      if (id) {
        const existing = await host.call<{ id: string; title: string; body: string } | null>('get', { id });
        if (existing) note = existing;
      }
      const title = el('input', { type: 'text', value: note.title, placeholder: 'Title', style: 'width:100%' }) as HTMLInputElement;
      const body = el('textarea', { value: note.body, placeholder: 'Write something…', style: 'width:100%;height:160px;margin-top:6px' }) as HTMLTextAreaElement;
      const save = el('button', { className: 'primary', textContent: 'Save', style: 'flex:1' });
      save.addEventListener('click', async () => {
        await host.call('save', { note: { id: note.id, title: title.value.trim(), body: body.value } });
        await showList();
      });
      const cancel = el('button', { className: 'ghost', textContent: 'Cancel' });
      cancel.addEventListener('click', () => void showList());
      view.replaceChildren(title, body, el('div', { className: 'row', style: 'margin-top:8px' }, [save, cancel]));
    };

    root.append(view);
    await showList();
  },
};

export default panel;
