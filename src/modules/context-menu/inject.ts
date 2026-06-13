// Injected into the page (each self-contained). Page-local actions for right-click menu items.
export function speakText(text: string): void {
  try {
    window.speechSynthesis.cancel();
    if (text) window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  } catch {
    /* ignore */
  }
}

export function highlightCurrent(): void {
  try {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && !sel.isCollapsed) {
      const m = document.createElement('mark');
      m.style.backgroundColor = '#fde047';
      sel.getRangeAt(0).surroundContents(m);
      sel.removeAllRanges();
    }
  } catch {
    /* ignore */
  }
}

export function cleanUrlNow(): void {
  try {
    const prefixes = ['utm_', 'fbclid', 'gclid', 'mc_eid', 'igshid', 'msclkid'];
    const u = new URL(location.href);
    let changed = false;
    for (const k of Array.from(u.searchParams.keys())) {
      if (prefixes.some((p) => k.toLowerCase().startsWith(p))) {
        u.searchParams.delete(k);
        changed = true;
      }
    }
    if (changed) history.replaceState(history.state, '', u.toString());
  } catch {
    /* ignore */
  }
}
