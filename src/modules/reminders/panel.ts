import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const message = el('input', { type: 'text', placeholder: 'Remind me to…', style: 'width:100%' }) as HTMLInputElement;
    const mode = el('select', {}, [
      el('option', { value: 'in', textContent: 'In N minutes' }),
      el('option', { value: 'every', textContent: 'Every N minutes' }),
      el('option', { value: 'at', textContent: 'At time of day' }),
    ]) as HTMLSelectElement;
    const minutes = el('input', { type: 'number', min: '1', value: '10', style: 'width:80px' }) as HTMLInputElement;
    const time = el('input', { type: 'time', style: 'width:120px' }) as HTMLInputElement;
    const add = el('button', { className: 'primary', textContent: 'Add reminder', style: 'width:100%' });
    const list = el('div', {});

    const syncInputs = (): void => {
      minutes.style.display = mode.value === 'at' ? 'none' : '';
      time.style.display = mode.value === 'at' ? '' : 'none';
    };
    mode.addEventListener('change', syncInputs);
    syncInputs();

    const refresh = async (): Promise<void> => {
      const items = await host.call<Array<{ id: string; label: string }>>('list');
      list.replaceChildren(el('h2', { textContent: 'Scheduled' }));
      if (!items.length) {
        list.append(el('p', { className: 'muted', textContent: 'None.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const r of items) {
        const x = el('button', { className: 'ghost', textContent: 'Cancel' });
        x.addEventListener('click', async () => {
          await host.call('cancel', { id: r.id });
          await refresh();
        });
        ul.append(el('li', {}, [el('span', { className: 'label', textContent: r.label }), x]));
      }
      list.append(ul);
    };

    add.addEventListener('click', async () => {
      try {
        await host.call('add', { message: message.value, mode: mode.value, minutes: Number(minutes.value) || 10, time: time.value });
        message.value = '';
        await refresh();
      } catch {
        /* ignore */
      }
    });

    root.append(message, el('div', { className: 'row', style: 'margin:6px 0' }, [mode, minutes, time]), add, list);
    await refresh();
  },
};

export default panel;
