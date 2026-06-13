import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const tab = host.activeTab;
    const current = tab?.url ? await host.call<{ dark: boolean; css: string }>('getForUrl', { url: tab.url }) : { dark: false, css: '' };

    const darkChk = el('input', { type: 'checkbox' }) as HTMLInputElement;
    darkChk.checked = current.dark;
    const css = el('textarea', { value: current.css, placeholder: '/* optional custom CSS for this site */', style: 'width:100%;height:90px;margin-top:6px' }) as HTMLTextAreaElement;

    const save = el('button', { className: 'primary', textContent: 'Apply to this site', style: 'flex:1' });
    save.addEventListener('click', async () => {
      if (!tab?.url) return;
      await host.call('setForUrl', { url: tab.url, dark: darkChk.checked, css: css.value });
      save.textContent = 'Applied ✓';
      setTimeout(() => (save.textContent = 'Apply to this site'), 1000);
      await refresh();
    });

    const list = el('div', {});
    const refresh = async () => {
      const sites = await host.call<Array<{ domain: string; dark: boolean }>>('list');
      list.replaceChildren(el('h2', { textContent: 'Configured sites' }));
      if (!sites.length) {
        list.append(el('p', { className: 'muted', textContent: 'None yet.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const s of sites) {
        const del = el('button', { className: 'ghost', textContent: 'Reset' });
        del.addEventListener('click', async () => {
          await host.call('remove', { domain: s.domain });
          await refresh();
        });
        ul.append(el('li', {}, [el('span', { className: 'label', textContent: `${s.domain}${s.dark ? ' · dark' : ''}` }), del]));
      }
      list.append(ul);
    };

    root.append(
      el('p', { className: 'muted' }, [tab ? `Site: ${tab.url ? new URL(tab.url).hostname : '(none)'}` : 'No active tab.']),
      el('div', { className: 'check' }, [darkChk, el('span', { textContent: 'Force dark mode' })]),
      el('label', { textContent: 'Custom CSS (optional)' }),
      css,
      el('div', { className: 'row', style: 'margin-top:8px' }, [save]),
      list,
    );
    await refresh();
  },
};

export default panel;
