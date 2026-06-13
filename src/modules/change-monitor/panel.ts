import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';
import { actions, jobsList, scopeControl, textField, timingControl } from '../../ui/popup/controls';

const panel: Panel = {
  async render(root, host) {
    const tab = host.activeTab;
    const scope = scopeControl(tab);
    const selector = textField('Element to watch (optional CSS selector)', 'blank = whole page');
    const timing = timingControl(300);
    const jobs = jobsList(host);

    const start = async () => {
      const s = scope.get();
      if (!s) return;
      await host.call('start', { scope: s, selector: selector.input.value.trim() || undefined, ...timing.get() });
      await jobs.refresh();
    };
    const stopAll = async () => {
      await host.call('stopAll');
      await jobs.refresh();
    };

    root.append(
      el('p', { className: 'muted' }, ['Notifies you when the page (or a chosen element) changes.']),
      scope.node,
      selector.node,
      timing.node,
      actions(start, stopAll),
      jobs.node,
    );
    await jobs.refresh();
  },
};

export default panel;
