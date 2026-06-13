import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const status = el('p', { className: 'muted', textContent: 'Captures the visible area of the current tab.' });
    const preview = el('div', { style: 'margin-top:8px' });

    const capture = el('button', { className: 'primary', textContent: 'Capture visible area', style: 'width:100%' });
    capture.addEventListener('click', async () => {
      const r = await host.call<{ dataUrl: string | null }>('capture');
      if (!r.dataUrl) {
        status.textContent = 'Could not capture this tab.';
        return;
      }
      status.textContent = 'Captured. Saving…';
      const a = document.createElement('a');
      a.href = r.dataUrl;
      a.download = `screenshot-${Date.now()}.png`;
      a.click();
      const img = el('img', { src: r.dataUrl, style: 'width:100%;border:1px solid #8883;border-radius:6px' });
      preview.replaceChildren(img);
      status.textContent = 'Saved to your downloads.';
    });

    root.append(status, capture, preview);
  },
};

export default panel;
