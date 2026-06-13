import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const trigger = el('input', { type: 'text', placeholder: 'Trigger (e.g. ;sig)', style: 'width:100%' }) as HTMLInputElement;
    const text = el('textarea', { placeholder: 'Expands to…', style: 'width:100%;height:60px' }) as HTMLTextAreaElement;
    const add = el('button', { className: 'primary', textContent: 'Add snippet', style: 'width:100%' });
    const list = el('div', {});

    const refresh = async (): Promise<void> => {
      const s = await host.call<Record<string, string>>('list');
      const keys = Object.keys(s);
      list.replaceChildren(el('h2', { textContent: 'Snippets' }));
      if (!keys.length) {
        list.append(el('p', { className: 'muted', textContent: 'None yet.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const k of keys) {
        const del = el('button', { className: 'ghost', textContent: '🗑' });
        del.addEventListener('click', async () => {
          await host.call('remove', { trigger: k });
          await refresh();
        });
        ul.append(el('li', {}, [el('span', { className: 'label', textContent: `${k} → ${s[k].slice(0, 30)}` }), del]));
      }
      list.append(ul);
    };

    add.addEventListener('click', async () => {
      try {
        await host.call('add', { trigger: trigger.value.trim(), text: text.value });
        trigger.value = '';
        text.value = '';
        await refresh();
      } catch {
        /* ignore */
      }
    });

    root.append(trigger, text, add, list);
    await refresh();
  },
};

export default panel;
