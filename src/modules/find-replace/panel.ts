import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const query = el('input', { type: 'text', placeholder: 'Find…', style: 'width:100%' }) as HTMLInputElement;
    const repl = el('input', { type: 'text', placeholder: 'Replace with…', style: 'width:100%' }) as HTMLInputElement;
    const regex = el('input', { type: 'checkbox' }) as HTMLInputElement;
    const status = el('p', { className: 'muted' });

    const find = el('button', { className: 'primary', textContent: 'Find', style: 'flex:1' });
    find.addEventListener('click', async () => {
      const r = await host.call<{ count: number }>('find', { query: query.value, regex: regex.checked });
      status.textContent = `${r.count} match(es) highlighted.`;
    });
    const clear = el('button', { className: 'ghost', textContent: 'Clear' });
    clear.addEventListener('click', async () => {
      await host.call('clear');
      status.textContent = '';
    });
    const replaceBtn = el('button', { className: 'ghost', textContent: 'Replace all' });
    replaceBtn.addEventListener('click', async () => {
      const r = await host.call<{ count: number }>('replace', { query: query.value, repl: repl.value, regex: regex.checked });
      status.textContent = `${r.count} replaced.`;
    });

    root.append(
      query,
      el('div', { className: 'check', style: 'margin:6px 0' }, [regex, el('span', { textContent: 'Regular expression' })]),
      el('div', { className: 'row' }, [find, clear]),
      repl,
      el('div', { className: 'row', style: 'margin-top:6px' }, [replaceBtn]),
      status,
    );
  },
};

export default panel;
