// Injected into the page (self-contained). An element picker + a hide-by-selector applier.

/** Start an interactive picker. Resolves with a CSS selector for the clicked element (which
 *  it also hides), or null if the user pressed Escape. */
export function pickElement(): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    let last: HTMLElement | null = null;
    let lastOutline = '';

    const selectorFor = (start: HTMLElement): string => {
      const parts: string[] = [];
      let e: HTMLElement | null = start;
      while (e && e.nodeType === 1 && parts.length < 5) {
        if (e.id) {
          parts.unshift('#' + CSS.escape(e.id));
          break;
        }
        let part = e.tagName.toLowerCase();
        if (e.classList.length) {
          part += '.' + Array.from(e.classList).slice(0, 2).map((c) => CSS.escape(c)).join('.');
        }
        const parent: HTMLElement | null = e.parentElement;
        if (parent) {
          const sibs = Array.from(parent.children).filter((c) => c.tagName === e!.tagName);
          if (sibs.length > 1) part += `:nth-of-type(${sibs.indexOf(e) + 1})`;
        }
        parts.unshift(part);
        e = e.parentElement;
      }
      return parts.join(' > ');
    };

    const over = (ev: Event): void => {
      const t = ev.target as HTMLElement;
      if (last) last.style.outline = lastOutline;
      last = t;
      lastOutline = t.style.outline;
      t.style.outline = '2px solid #ef4444';
    };
    const cleanup = (): void => {
      document.removeEventListener('mouseover', over, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey, true);
      if (last) last.style.outline = lastOutline;
    };
    const onClick = (ev: Event): void => {
      ev.preventDefault();
      ev.stopPropagation();
      cleanup();
      const t = ev.target as HTMLElement;
      const sel = selectorFor(t);
      try {
        t.style.setProperty('display', 'none', 'important');
      } catch {
        /* ignore */
      }
      resolve(sel);
    };
    const onKey = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape') {
        cleanup();
        resolve(null);
      }
    };

    document.addEventListener('mouseover', over, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey, true);
  });
}

export function hideBySelectors(selectors: string[]): number {
  let n = 0;
  for (const s of selectors) {
    try {
      document.querySelectorAll(s).forEach((el) => {
        (el as HTMLElement).style.setProperty('display', 'none', 'important');
        n++;
      });
    } catch {
      /* invalid selector — skip */
    }
  }
  return n;
}
