import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';
import { actions, jobsList, scopeControl, textField, timingControl } from '../../ui/popup/controls';

const panel: Panel = {
  async render(root, host) {
    const tab = host.activeTab;
    const scope = scopeControl(tab);
    const timing = timingControl(60);
    const click = textField('Optional: click element each cycle', 'CSS selector, e.g. button#stay');
    const jobs = jobsList(host);

    const start = async () => {
      const s = scope.get();
      if (!s) return;
      await host.call('start', { scope: s, ...timing.get(), clickSelector: click.input.value.trim() || undefined });
      await jobs.refresh();
    };
    const stopAll = async () => {
      await host.call('stopAll');
      await jobs.refresh();
    };

    root.append(
      el('p', { className: 'muted' }, ['Keeps the tab active so it doesn’t get logged out. No reloads.']),
      scope.node,
      timing.node,
      el('fieldset', {}, [el('legend', { textContent: 'Options' }), click.node]),
      actions(start, stopAll),
      jobs.node,
    );
    await jobs.refresh();
  },
};

export default panel;
