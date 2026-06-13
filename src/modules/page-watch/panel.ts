import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';
import { actions, jobsList, scopeControl, textField, timingControl } from '../../ui/popup/controls';

const panel: Panel = {
  async render(root, host) {
    const tab = host.activeTab;
    const scope = scopeControl(tab);
    const timing = timingControl(60);
    const watch = textField('Notify when this text appears', 'e.g. In stock, Your turn');
    const jobs = jobsList(host);
    const error = el('p', { className: 'err' });

    const start = async () => {
      error.textContent = '';
      const s = scope.get();
      if (!s) return;
      if (!watch.input.value.trim()) {
        error.textContent = 'Enter the text to watch for.';
        return;
      }
      await host.call('start', { scope: s, text: watch.input.value.trim(), ...timing.get() });
      await jobs.refresh();
    };
    const stopAll = async () => {
      await host.call('stopAll');
      await jobs.refresh();
    };

    root.append(
      el('p', { className: 'muted' }, ['Sends a notification when the text shows up on the page.']),
      scope.node,
      watch.node,
      timing.node,
      error,
      actions(start, stopAll),
      jobs.node,
    );
    await jobs.refresh();
  },
};

export default panel;
