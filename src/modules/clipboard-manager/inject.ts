// Injected into the page (self-contained, isolated world). Captures copied text and sends it
// to the module to store in encrypted clipboard history.
export function installCopyCatcher(): void {
  const w = window as unknown as { __euClip?: boolean };
  if (w.__euClip) return;
  w.__euClip = true;
  document.addEventListener(
    'copy',
    () => {
      try {
        const t = document.getSelection()?.toString();
        if (t && t.trim()) {
          (globalThis as unknown as { chrome?: { runtime?: { sendMessage(m: unknown): void } } }).chrome?.runtime?.sendMessage({
            type: 'module',
            id: 'clipboard-manager',
            command: 'add',
            payload: { text: t },
          });
        }
      } catch {
        /* ignore */
      }
    },
    true,
  );
}
