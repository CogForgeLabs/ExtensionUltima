import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';
import { armPiP, togglePiP } from './inject';

const panel: Panel = {
  async render(root, host) {
    const status = el('p', { className: 'muted', textContent: 'Pops the active tab’s video into a floating window.' });
    const btn = el('button', { className: 'primary', textContent: 'Toggle Picture-in-Picture', style: 'width:100%' });

    btn.addEventListener('click', async () => {
      // Run directly from the popup so the click counts as a user gesture for PiP.
      const r = (await host.runInActiveTab(togglePiP, [])) as string | undefined;
      if (r === 'no-video') status.textContent = 'No video found on this tab.';
      else if (r === 'unsupported') status.textContent = 'Picture-in-Picture not available here.';
      else if (r === 'ok') status.textContent = 'Picture-in-Picture started.';
      else if (r === 'exit') status.textContent = 'Picture-in-Picture closed.';
      else if (r === 'denied') {
        // The page wouldn't accept the popup gesture — arm a one-shot page click.
        await host.runInActiveTab(armPiP, []);
        status.textContent = 'Click anywhere on the page once to start Picture-in-Picture.';
      }
    });

    root.append(status, btn);
  },
};

export default panel;
