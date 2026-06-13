// Injected into the page (must be self-contained — no imports/closures).
export function autoClick(selector: string): boolean {
  const el = document.querySelector<HTMLElement>(selector);
  if (el) {
    el.click();
    return true;
  }
  return false;
}
