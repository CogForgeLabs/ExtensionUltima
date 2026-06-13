// Injected into the page (self-contained). Collects image URLs from the page.
export function collectImages(): Array<{ src: string; w: number; h: number }> {
  const seen = new Set<string>();
  const out: Array<{ src: string; w: number; h: number }> = [];
  document.querySelectorAll('img').forEach((img) => {
    const src = img.currentSrc || img.src;
    if (src && /^https?:/.test(src) && !seen.has(src)) {
      seen.add(src);
      out.push({ src, w: img.naturalWidth || 0, h: img.naturalHeight || 0 });
    }
  });
  return out;
}
