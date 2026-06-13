import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface Settings {
  domains: string[];
  from?: string;
  to?: string;
}

const panel: Panel = {
  async render(root, host) {
    const addBtn = el('button', { className: 'primary', textContent: 'Block this site', style: 'flex:1' });
    const from = el('input', { type: 'time', style: 'width:110px' }) as HTMLInputElement;
    const to = el('input', { type: 'time', style: 'width:110px' }) as HTMLInputElement;
    const list = el('div', {});

    const refresh = async (): Promise<void> => {
      const s = await host.call<Settings>('list');
      from.value = s.from ?? '';
      to.value = s.to ?? '';
      list.replaceChildren(el('h2', { textContent: 'Blocked sites' }));
      if (!s.domains.length) {
        list.append(el('p', { className: 'muted', textContent: 'None yet.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const d of s.domains) {
        const x = el('button', { className: 'ghost', textContent: 'Unblock' });
        x.addEventListener('click', async () => {
          await host.call('remove', { domain: d });
          await refresh();
        });
        ul.append(el('li', {}, [el('span', { className: 'label', textContent: d }), x]));
      }
      list.append(ul);
    };

    addBtn.addEventListener('click', async () => {
      try {
        await host.call('addCurrent');
        await refresh();
      } catch {
        addBtn.textContent = 'No site';
        setTimeout(() => (addBtn.textContent = 'Block this site'), 1200);
      }
    });

    const saveWindow = el('button', { className: 'ghost', textContent: 'Save window' });
    saveWindow.addEventListener('click', async () => {
      await host.call('setWindow', { from: from.value, to: to.value });
      await refresh();
    });

    root.append(
      el('div', { className: 'row' }, [addBtn]),
      el('fieldset', {}, [
        el('legend', { textContent: 'Only block during (optional)' }),
        el('div', { className: 'row' }, [from, el('span', { className: 'muted', textContent: 'to' }), to, saveWindow]),
      ]),
      list,
    );
    await refresh();
  },
};

export default panel;
