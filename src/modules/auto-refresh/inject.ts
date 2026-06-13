// Injected into the page (must be self-contained — no imports/closures).
export function saveScroll(): number {
  return window.scrollY;
}

export function restoreScroll(y: number): void {
  window.scrollTo(0, y);
}
