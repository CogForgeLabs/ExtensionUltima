import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface State {
  auto: string[];
  minutes: number;
}

const panel: Panel = {
  async render(root, host) {
    const status = el('p', { className: 'muted' });
    const clearBtn = el('button', { className: 'primary', textContent: 'Clear cookies for this site', style: 'flex:1' });
    clearBtn.addEventListener('click', async () => {
      const r = await host.call<{ domain: string; removed: number }>('clearCurrent');
      status.textContent = `Removed ${r.removed} cookie(s) for ${r.domain}.`;
    });

    const autoBtn = el('button', { className: 'ghost', textContent: 'Auto-clear this site' });
    const list = el('div', {});

    const refresh = async (): Promise<void> => {
      const s = await host.call<State>('list');
      list.replaceChildren(el('h2', { textContent: `Auto-clear (every ${s.minutes}m)` }));
      if (!s.auto.length) {
        list.append(el('p', { className: 'muted', textContent: 'No sites set to auto-clear.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const d of s.auto) {
        const x = el('button', { className: 'ghost', textContent: 'Remove' });
        x.addEventListener('click', async () => {
          await host.call('stopActivity', { id: d });
          await refresh();
        });
        ul.append(el('li', {}, [el('span', { className: 'label', textContent: d }), x]));
      }
      list.append(ul);
    };

    autoBtn.addEventListener('click', async () => {
      try {
        await host.call('addCurrentAuto');
        await refresh();
      } catch {
        status.textContent = 'No site to add.';
      }
    });

    root.append(status, el('div', { className: 'row' }, [clearBtn]), el('div', { className: 'row', style: 'margin-top:6px' }, [autoBtn]), list);
    await refresh();
  },
};

export default panel;
