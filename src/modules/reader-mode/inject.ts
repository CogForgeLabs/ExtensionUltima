// Injected into the page (self-contained). Toggles a clean reading overlay built from the
// page's main content.
export function toggleReader(): string {
  const id = 'eu-reader';
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
    return 'off';
  }

  const src = document.querySelector('article, main, [role="main"]') as HTMLElement | null;

  const wrap = document.createElement('div');
  wrap.id = id;
  wrap.style.cssText =
    'position:fixed;inset:0;overflow:auto;background:#fbfbf8;color:#1a1a1a;z-index:2147483647;padding:48px 20px';

  const inner = document.createElement('div');
  inner.style.cssText = 'max-width:680px;margin:0 auto;font:18px/1.7 Georgia,"Times New Roman",serif';
  if (src) {
    inner.innerHTML = src.innerHTML;
  } else {
    const ps = Array.from(document.querySelectorAll('p'))
      .map((p) => p.textContent || '')
      .filter((t) => t.length > 40);
    inner.textContent = ps.join('\n\n');
  }

  const close = document.createElement('button');
  close.textContent = '✕ Close';
  close.style.cssText = 'position:fixed;top:12px;right:16px;font:14px system-ui;padding:6px 10px;cursor:pointer;border:1px solid #ccc;border-radius:6px;background:#fff';
  close.onclick = () => wrap.remove();

  wrap.append(close, inner);
  document.documentElement.appendChild(wrap);
  // innerHTML doesn't execute scripts, but strip frames/scripts for cleanliness.
  wrap.querySelectorAll('script, iframe, video, ins').forEach((n) => n.remove());
  return 'on';
}

/** Force the reader overlay off (idempotent). */
export function closeReader(): void {
  document.getElementById('eu-reader')?.remove();
}
