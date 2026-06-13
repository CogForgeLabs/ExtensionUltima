import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface Img {
  src: string;
  w: number;
  h: number;
}

const panel: Panel = {
  async render(root, host) {
    const status = el('p', { className: 'muted', textContent: 'Loading images…' });
    const grid = el('div', { style: 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;max-height:240px;overflow:auto' });
    root.append(status, grid);

    const images = await host.call<Img[]>('collect');
    status.textContent = `${images.length} image(s).`;

    if (images.length) {
      const all = el('button', { className: 'primary', textContent: `Download all (${images.length})`, style: 'width:100%;margin:6px 0' });
      all.addEventListener('click', () => void host.call('downloadAll', { urls: images.map((i) => i.src) }));
      root.insertBefore(all, grid);
    }

    for (const img of images) {
      const cell = el('div', { style: 'cursor:pointer;border:1px solid #8883;border-radius:4px;overflow:hidden', title: `${img.w}×${img.h}` });
      cell.append(el('img', { src: img.src, style: 'width:100%;height:60px;object-fit:cover;display:block' }));
      cell.addEventListener('click', () => void host.call('download', { url: img.src }));
      grid.append(cell);
    }
  },
};

export default panel;
