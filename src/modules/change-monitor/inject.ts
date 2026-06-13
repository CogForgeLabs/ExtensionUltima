// Injected into the page (must be self-contained — no imports/closures).
export function getText(selector: string): string {
  const root = selector ? document.querySelector(selector) : document.body;
  return root ? (root as HTMLElement).innerText : '';
}
