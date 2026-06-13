import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';
import { actions, jobsList, timingControl } from '../../ui/popup/controls';

const panel: Panel = {
  async render(root, host) {
    const urls = el('textarea', { placeholder: 'One URL per line (https://…)', style: 'width:100%;height:90px' }) as HTMLTextAreaElement;
    const timing = timingControl(3600);
    const jobs = jobsList(host);

    const start = async () => {
      const list = urls.value
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);
      await host.call('start', { urls: list, ...timing.get() });
      urls.value = '';
      await jobs.refresh();
    };
    const stopAll = async () => {
      await host.call('stopAll');
      await jobs.refresh();
    };

    root.append(
      el('label', { textContent: 'URLs to open' }),
      urls,
      timing.node,
      actions(start, stopAll),
      jobs.node,
    );
    await jobs.refresh();
  },
};

export default panel;
