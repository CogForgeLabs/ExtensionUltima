// Injected into the page (self-contained). Covers a blocked page with an overlay and pauses
// any media, rather than navigating away (avoids breaking history/back).
export function blockOverlay(domain: string): void {
  if (document.getElementById('eu-block')) return;
  const d = document.createElement('div');
  d.id = 'eu-block';
  d.style.cssText =
    'position:fixed;inset:0;background:#0f1115;color:#e5e7eb;display:flex;flex-direction:column;' +
    'align-items:center;justify-content:center;z-index:2147483647;font:16px system-ui;text-align:center;gap:6px';
  d.innerHTML = '<div style="font-size:54px">⛔</div><h1 style="margin:0">Blocked</h1><p style="opacity:.7;max-width:280px"></p>';
  const p = d.querySelector('p');
  if (p) p.textContent = `${domain} is blocked by Focus Mode.`;
  document.documentElement.appendChild(d);
  try {
    document.querySelectorAll('video,audio').forEach((m) => (m as HTMLMediaElement).pause());
  } catch {
    /* ignore */
  }
  try {
    document.title = 'Blocked';
  } catch {
    /* ignore */
  }
}
