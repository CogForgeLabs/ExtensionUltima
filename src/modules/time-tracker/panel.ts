import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface Row {
  domain: string;
  seconds: number;
}

function fmt(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${secs}s`;
}

const panel: Panel = {
  async render(root, host) {
    const list = el('div', {});
    const refresh = async (): Promise<void> => {
      const rows = await host.call<Row[]>('today');
      const total = rows.reduce((a, b) => a + b.seconds, 0);
      list.replaceChildren(el('h2', { textContent: `Today — ${fmt(total)} total` }));
      if (!rows.length) {
        list.append(el('p', { className: 'muted', textContent: 'No activity tracked yet.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const r of rows.slice(0, 25)) {
        ul.append(
          el('li', {}, [
            el('span', { className: 'label', style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap', textContent: r.domain }),
            el('span', { className: 'muted', textContent: fmt(r.seconds) }),
          ]),
        );
      }
      list.append(ul);
    };

    const reset = el('button', { className: 'ghost', textContent: 'Reset today' });
    reset.addEventListener('click', async () => {
      await host.call('reset');
      await refresh();
    });

    root.append(list, el('div', { className: 'row', style: 'margin-top:8px' }, [reset]));
    await refresh();
  },
};

export default panel;
