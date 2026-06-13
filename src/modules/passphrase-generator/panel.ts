import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const panel: Panel = {
  async render(root, host) {
    const out = el('div', { style: 'font:16px monospace;word-break:break-all;padding:10px;border:1px solid #8883;border-radius:6px;min-height:24px' });
    const words = el('input', { type: 'number', min: '3', max: '12', value: '5', style: 'width:70px' }) as HTMLInputElement;
    const bits = el('span', { className: 'muted', style: 'font-size:11px' });

    const gen = async (): Promise<void> => {
      const r = await host.call<{ passphrase: string; bits: number }>('generate', { words: Number(words.value) || 5 });
      out.textContent = r.passphrase;
      bits.textContent = `~${r.bits} bits of entropy`;
    };

    const genBtn = el('button', { className: 'primary', textContent: 'Generate', style: 'flex:1' });
    genBtn.addEventListener('click', () => void gen());
    const copy = el('button', { className: 'ghost', textContent: 'Copy' });
    copy.addEventListener('click', async () => {
      if (out.textContent) await navigator.clipboard.writeText(out.textContent);
      copy.textContent = '✓';
      setTimeout(() => (copy.textContent = 'Copy'), 900);
    });

    root.append(
      out,
      bits,
      el('div', { className: 'row', style: 'margin-top:8px' }, [el('span', { className: 'muted', textContent: 'Words' }), words, genBtn, copy]),
    );
    await gen();
  },
};

export default panel;
