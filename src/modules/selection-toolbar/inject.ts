// Injected into the page (self-contained). Shows a small toolbar above text selections.
export function installToolbar(): void {
  const w = window as unknown as { __euSelBar?: boolean };
  if (w.__euSelBar) return;
  w.__euSelBar = true;

  const bar = document.createElement('div');
  bar.style.cssText =
    'position:absolute;z-index:2147483647;display:none;gap:4px;background:#111;color:#fff;border-radius:6px;padding:4px;font:12px system-ui;box-shadow:0 2px 8px #0005';
  const hide = (): void => {
    bar.style.display = 'none';
  };
  const getText = (): string => window.getSelection()?.toString() ?? '';
  const mk = (labelText: string, fn: () => void): HTMLButtonElement => {
    const b = document.createElement('button');
    b.textContent = labelText;
    b.style.cssText = 'background:#333;color:#fff;border:0;border-radius:4px;padding:3px 7px;cursor:pointer';
    b.onmousedown = (e) => e.preventDefault(); // keep selection
    b.onclick = fn;
    return b;
  };

  bar.append(
    mk('Copy', () => {
      void navigator.clipboard.writeText(getText()).catch(() => {});
      hide();
    }),
    mk('Search', () => {
      window.open('https://www.google.com/search?q=' + encodeURIComponent(getText()), '_blank');
      hide();
    }),
    mk('Speak', () => {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(getText()));
      } catch {
        /* ignore */
      }
      hide();
    }),
    mk('Highlight', () => {
      try {
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          const m = document.createElement('mark');
          m.style.backgroundColor = '#fde047';
          sel.getRangeAt(0).surroundContents(m);
          sel.removeAllRanges();
        }
      } catch {
        /* ignore */
      }
      hide();
    }),
  );
  document.documentElement.appendChild(bar);

  document.addEventListener('mouseup', () => {
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (text && sel && sel.rangeCount) {
        const r = sel.getRangeAt(0).getBoundingClientRect();
        bar.style.left = `${window.scrollX + r.left}px`;
        bar.style.top = `${window.scrollY + r.top - 38}px`;
        bar.style.display = 'flex';
      } else {
        hide();
      }
    }, 10);
  });
  document.addEventListener('scroll', hide, true);
}
