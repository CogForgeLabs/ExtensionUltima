// Injected into the page (must be self-contained — no imports/closures).

/** Simulate light activity to defeat idle timeouts, without reloading. */
export function jiggle(): void {
  window.dispatchEvent(new Event('mousemove'));
  document.dispatchEvent(new Event('keydown'));
  window.scrollBy(0, 1);
  window.scrollBy(0, -1);
}

/** Click an element (e.g. a "stay signed in" button) to keep a session alive. */
export function clickKeepAlive(selector: string): boolean {
  const el = document.querySelector<HTMLElement>(selector);
  if (el) {
    el.click();
    return true;
  }
  return false;
}
