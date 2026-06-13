// Injected into the page (self-contained). Smoothly auto-scrolls the page.
export function startScroll(pxPerTick: number): void {
  const w = window as unknown as { __euScroll?: ReturnType<typeof setInterval> };
  if (w.__euScroll) clearInterval(w.__euScroll);
  w.__euScroll = setInterval(() => {
    window.scrollBy(0, pxPerTick);
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1) {
      if (w.__euScroll) clearInterval(w.__euScroll);
      w.__euScroll = undefined;
    }
  }, 50);
}

export function stopScroll(): void {
  const w = window as unknown as { __euScroll?: ReturnType<typeof setInterval> };
  if (w.__euScroll) {
    clearInterval(w.__euScroll);
    w.__euScroll = undefined;
  }
}
