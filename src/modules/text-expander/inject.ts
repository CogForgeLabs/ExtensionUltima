// Injected into the page (self-contained). Expands typed triggers into saved snippets in
// inputs, textareas, and contenteditable fields.
export function installExpander(snippets: Record<string, string>): void {
  const w = window as unknown as { __euSnips?: Record<string, string>; __euExp?: boolean };
  w.__euSnips = snippets;
  if (w.__euExp) return;
  w.__euExp = true;

  document.addEventListener(
    'input',
    (e) => {
      const snips = w.__euSnips ?? {};
      const triggers = Object.keys(snips);
      if (!triggers.length) return;
      const el = e.target as HTMLElement | null;
      if (!el) return;

      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const v = el.value;
        for (const t of triggers) {
          if (v.endsWith(t)) {
            el.value = v.slice(0, -t.length) + snips[t];
            el.dispatchEvent(new Event('input', { bubbles: true }));
            break;
          }
        }
      } else if (el.isContentEditable) {
        const text = el.innerText;
        for (const t of triggers) {
          if (text.endsWith(t)) {
            el.innerText = text.slice(0, -t.length) + snips[t];
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
            break;
          }
        }
      }
    },
    true,
  );
}
