import type { Panel } from '../../ui/popup/host';
import { send } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const list = el('div', {});
    const refresh = async (): Promise<void> => {
      const items = await host.call<Array<{ id: string; title: string; enabled: boolean }>>('all');
      list.replaceChildren();
      for (const it of items) {
        const cb = el('input', { type: 'checkbox' }) as HTMLInputElement;
        cb.checked = it.enabled;
        cb.addEventListener('change', async () => {
          await host.call('toggle', { id: it.id });
          await send({ type: 'rebuildMenus' });
        });
        list.append(el('div', { className: 'check' }, [cb, el('span', { textContent: it.title.replace('%s', 'selection') })]));
      }
    };
    root.append(el('p', { className: 'muted', textContent: 'Choose which actions appear in the right-click menu.' }), list);
    await refresh();
  },
};

export default panel;
