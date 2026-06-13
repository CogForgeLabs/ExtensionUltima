// Injected into the page (must be self-contained — no imports/closures).
export function findText(text: string): boolean {
  const body = document.body;
  if (!body) return false;
  return body.innerText.toLowerCase().includes(text.toLowerCase());
}
