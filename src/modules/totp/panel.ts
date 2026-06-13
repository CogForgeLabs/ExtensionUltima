import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface CodeView {
  id: string;
  label: string;
  issuer: string;
  code: string;
  period: number;
  remaining: number;
}

// Clear any timer from a previous panel mount.
function clearTimer(): void {
  const w = window as unknown as { __euTotpTimer?: ReturnType<typeof setInterval> };
  if (w.__euTotpTimer) clearInterval(w.__euTotpTimer);
}

const panel: Panel = {
  async render(root, host) {
    clearTimer();
    const codes = el('div', {});
    const formWrap = el('div', {});

    const renderCodes = async () => {
      const list = await host.call<CodeView[]>('list');
      codes.replaceChildren();
      if (!list.length) {
        codes.append(el('p', { className: 'muted', textContent: 'No accounts yet.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const a of list) {
        const codeEl = el('div', { style: 'font-size:20px;font-weight:700;letter-spacing:2px', textContent: a.code });
        const meta = el('span', { className: 'label' }, [
          el('div', { style: 'font-weight:600', textContent: a.issuer ? `${a.issuer} · ${a.label}` : a.label }),
          codeEl,
        ]);
        const remain = el('span', { className: 'muted', style: 'width:24px;text-align:right', textContent: String(a.remaining) });
        remain.dataset.period = String(a.period);
        const copy = el('button', { className: 'ghost', textContent: 'Copy' });
        copy.addEventListener('click', async () => {
          await navigator.clipboard.writeText(a.code);
          copy.textContent = '✓';
          setTimeout(() => (copy.textContent = 'Copy'), 900);
        });
        const del = el('button', { className: 'ghost', textContent: '🗑' });
        del.addEventListener('click', async () => {
          await host.call('remove', { id: a.id });
          await renderCodes();
        });
        ul.append(el('li', {}, [meta, remain, copy, del]));
      }
      codes.append(ul);

      // Countdown; refetch codes when a period rolls over.
      const w = window as unknown as { __euTotpTimer?: ReturnType<typeof setInterval> };
      w.__euTotpTimer = setInterval(() => {
        let rolled = false;
        for (const span of Array.from(ul.querySelectorAll<HTMLElement>('span[data-period]'))) {
          const period = Number(span.dataset.period) || 30;
          const remaining = period - (Math.floor(Date.now() / 1000) % period);
          span.textContent = String(remaining);
          if (remaining === period) rolled = true;
        }
        if (rolled) void renderCodes();
      }, 1000);
    };

    const showForm = () => {
      const label = el('input', { type: 'text', placeholder: 'Label (e.g. you@example.com)', style: 'width:100%' });
      const issuer = el('input', { type: 'text', placeholder: 'Issuer (e.g. GitHub)', style: 'width:100%' });
      const secret = el('input', { type: 'text', placeholder: 'Secret key (base32)', style: 'width:100%' });
      const error = el('p', { className: 'err' });
      const add = el('button', { className: 'primary', textContent: 'Add', style: 'flex:1' });
      add.addEventListener('click', async () => {
        error.textContent = '';
        try {
          await host.call('add', {
            label: (label as HTMLInputElement).value.trim(),
            issuer: (issuer as HTMLInputElement).value.trim() || undefined,
            secret: (secret as HTMLInputElement).value.trim(),
          });
          (label as HTMLInputElement).value = '';
          (issuer as HTMLInputElement).value = '';
          (secret as HTMLInputElement).value = '';
          await renderCodes();
        } catch (e) {
          error.textContent = e instanceof Error ? e.message : String(e);
        }
      });
      formWrap.replaceChildren(
        el('fieldset', {}, [el('legend', { textContent: 'Add account' }), issuer, label, secret, error, el('div', { className: 'row' }, [add])]),
      );
    };

    root.append(codes, formWrap);
    await renderCodes();
    showForm();
  },
};

export default panel;
