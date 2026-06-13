import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const urls = await host.call<string[]>('urls');
    const area = el('textarea', { style: 'width:100%;height:90px', value: urls.join('\n') }) as HTMLTextAreaElement;

    const copy = el('button', { className: 'primary', textContent: 'Copy all', style: 'flex:1' });
    copy.addEventListener('click', async () => {
      await navigator.clipboard.writeText(area.value);
      copy.textContent = 'Copied ✓';
      setTimeout(() => (copy.textContent = 'Copy all'), 1000);
    });

    const open = el('button', { className: 'ghost', textContent: 'Open list' });
    open.addEventListener('click', async () => {
      await host.call('open', { urls: area.value.split('\n').map((u) => u.trim()).filter(Boolean) });
    });

    root.append(
      el('p', { className: 'muted', textContent: 'Current window’s tabs. Edit and Copy, or paste a list and Open.' }),
      area,
      el('div', { className: 'row', style: 'margin-top:6px' }, [copy, open]),
    );
  },
};

export default panel;
