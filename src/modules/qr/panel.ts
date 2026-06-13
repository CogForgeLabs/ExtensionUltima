import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';
import qrcode from 'qrcode-generator';

const panel: Panel = {
  async render(root, host) {
    const input = el('input', { type: 'text', value: host.activeTab?.url ?? '', placeholder: 'Text or URL', style: 'width:100%' }) as HTMLInputElement;
    const box = el('div', { style: 'display:flex;justify-content:center;margin:10px 0;min-height:200px' });

    const draw = (): void => {
      try {
        const qr = qrcode(0, 'M');
        qr.addData(input.value || ' ');
        qr.make();
        box.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
        const svg = box.querySelector('svg');
        if (svg) {
          svg.style.width = '200px';
          svg.style.height = '200px';
        }
      } catch {
        box.textContent = 'Too much data for one QR code.';
      }
    };

    const dl = el('button', { className: 'ghost', textContent: 'Download PNG' });
    dl.addEventListener('click', () => {
      try {
        const qr = qrcode(0, 'M');
        qr.addData(input.value || ' ');
        qr.make();
        const a = document.createElement('a');
        a.href = qr.createDataURL(6, 2);
        a.download = 'qr.png';
        a.click();
      } catch {
        /* ignore */
      }
    });

    input.addEventListener('input', draw);
    root.append(el('label', { textContent: 'Text or URL' }), input, box, el('div', { className: 'row' }, [dl]));
    draw();
  },
};

export default panel;
