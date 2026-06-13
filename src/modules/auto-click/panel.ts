import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';
import { actions, jobsList, scopeControl, textField, timingControl } from '../../ui/popup/controls';

const panel: Panel = {
  async render(root, host) {
    const tab = host.activeTab;
    const scope = scopeControl(tab);
    const timing = timingControl(30);
    const selector = textField('Element to click (CSS selector)', 'e.g. button.refresh, #load-more');
    const jobs = jobsList(host);
    const error = el('p', { className: 'err' });

    const start = async () => {
      error.textContent = '';
      const s = scope.get();
      if (!s) return;
      if (!selector.input.value.trim()) {
        error.textContent = 'Enter a CSS selector.';
        return;
      }
      await host.call('start', { scope: s, selector: selector.input.value.trim(), ...timing.get() });
      await jobs.refresh();
    };
    const stopAll = async () => {
      await host.call('stopAll');
      await jobs.refresh();
    };

    root.append(
      el('p', { className: 'muted' }, ['Clicks the first matching element each cycle.']),
      scope.node,
      selector.node,
      timing.node,
      error,
      actions(start, stopAll),
      jobs.node,
    );
    await jobs.refresh();
  },
};

export default panel;
