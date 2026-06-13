// Injected into the page (self-contained). Highlights the current selection and can restore
// saved highlights by text match.
export function highlightSelection(color: string): string | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const text = sel.toString().trim();
  if (!text) return null;
  try {
    const range = sel.getRangeAt(0);
    const mark = document.createElement('mark');
    mark.style.backgroundColor = color;
    mark.style.color = 'inherit';
    range.surroundContents(mark);
    sel.removeAllRanges();
  } catch {
    return null; // selection spanned multiple elements — skip
  }
  return text;
}

export function restoreHighlights(texts: string[], color: string): number {
  let n = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  for (const t of texts) {
    for (const tn of nodes) {
      const idx = tn.nodeValue ? tn.nodeValue.indexOf(t) : -1;
      if (idx >= 0 && tn.parentElement && tn.parentElement.tagName !== 'MARK') {
        try {
          const range = document.createRange();
          range.setStart(tn, idx);
          range.setEnd(tn, idx + t.length);
          const mark = document.createElement('mark');
          mark.style.backgroundColor = color;
          range.surroundContents(mark);
          n++;
        } catch {
          /* skip */
        }
        break;
      }
    }
  }
  return n;
}

export function clearHighlights(): void {
  document.querySelectorAll('mark').forEach((m) => {
    const parent = m.parentNode;
    if (!parent) return;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
  });
}
