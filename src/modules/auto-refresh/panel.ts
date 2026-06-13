import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';
import { actions, checkbox, jobsList, scopeControl, timingControl } from '../../ui/popup/controls';

const panel: Panel = {
  async render(root, host) {
    const tab = host.activeTab;
    const scope = scopeControl(tab);
    const timing = timingControl(60);
    const bypass = checkbox('Bypass cache on reload');
    const scroll = checkbox('Remember & restore scroll position');
    const jobs = jobsList(host);

    const start = async () => {
      const s = scope.get();
      if (!s) return;
      await host.call('start', { scope: s, ...timing.get(), bypassCache: bypass.input.checked, rememberScroll: scroll.input.checked });
      await jobs.refresh();
    };
    const stopAll = async () => {
      await host.call('stopAll');
      await jobs.refresh();
    };

    root.append(
      el('p', { className: 'muted' }, [tab ? `Active tab: ${tab.url || '(no url)'}` : 'No active tab.']),
      scope.node,
      timing.node,
      el('fieldset', {}, [el('legend', { textContent: 'Options' }), bypass.node, scroll.node]),
      actions(start, stopAll),
      jobs.node,
    );

    if (tab?.url) {
      const saved = await host.call<{ bypassCache?: boolean; rememberScroll?: boolean; seconds?: number; randomizeToSeconds?: number; times?: string[] } | null>('recall', { url: tab.url });
      if (saved) {
        timing.set(saved);
        bypass.input.checked = Boolean(saved.bypassCache);
        scroll.input.checked = Boolean(saved.rememberScroll);
      }
    }
    await jobs.refresh();
  },
};

export default panel;
