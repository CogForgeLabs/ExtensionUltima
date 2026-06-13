import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const STRENGTH = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
const COLORS = ['#dc2626', '#f97316', '#eab308', '#84cc16', '#22c55e'];

const panel: Panel = {
  async render(root, host) {
    const input = el('input', { type: 'password', placeholder: 'Password to check', style: 'width:100%' }) as HTMLInputElement;
    const result = el('div', { style: 'margin-top:8px' });
    const check = el('button', { className: 'primary', textContent: 'Check', style: 'flex:1' });

    check.addEventListener('click', async () => {
      result.replaceChildren(el('p', { className: 'muted', textContent: 'Checking…' }));
      const r = await host.call<{ count: number; strength: number }>('check', { password: input.value });
      const bar = el('div', { style: `height:6px;border-radius:4px;background:${COLORS[r.strength]};width:${(r.strength + 1) * 20}%` });
      const lines: Array<Node | string> = [
        el('div', { style: 'font-size:12px;margin-bottom:4px', textContent: `Strength: ${STRENGTH[r.strength]}` }),
        el('div', { style: 'background:#8882;border-radius:4px;overflow:hidden' }, [bar]),
      ];
      if (r.count === -1) {
        lines.push(el('p', { className: 'muted', style: 'margin-top:8px', textContent: 'Breach lookup failed (offline?). Strength shown above.' }));
      } else if (r.count > 0) {
        lines.push(el('p', { style: 'color:#dc2626;margin-top:8px', textContent: `⚠ Found in ${r.count.toLocaleString()} breaches — do not use it.` }));
      } else {
        lines.push(el('p', { style: 'color:#22c55e;margin-top:8px', textContent: '✓ Not found in known breaches.' }));
      }
      result.replaceChildren(...lines);
    });

    root.append(
      el('p', { className: 'muted', textContent: 'Only a partial hash is sent (k-anonymity) — your password never leaves the device.' }),
      input,
      el('div', { className: 'row', style: 'margin-top:6px' }, [check]),
      result,
    );
  },
};

export default panel;
