// Injected into the page (self-contained). Strips tracking params from the address bar
// without reloading (history.replaceState).
export function cleanUrl(params: string[]): boolean {
  try {
    const u = new URL(location.href);
    let changed = false;
    for (const key of Array.from(u.searchParams.keys())) {
      const match = params.some((p) => (p.endsWith('*') ? key.toLowerCase().startsWith(p.slice(0, -1).toLowerCase()) : key.toLowerCase() === p.toLowerCase()));
      if (match) {
        u.searchParams.delete(key);
        changed = true;
      }
    }
    if (changed) history.replaceState(history.state, '', u.toString());
    return changed;
  } catch {
    return false;
  }
}
