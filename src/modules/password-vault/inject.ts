// Injected into the page (must be self-contained — no imports/closures).
// Fills the first password field and the nearest preceding username/email field.
export function fillCreds(username: string, password: string): boolean {
  const pw = document.querySelector<HTMLInputElement>('input[type=password]');
  if (!pw) return false;

  const set = (el: HTMLInputElement, v: string): void => {
    el.focus();
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  set(pw, password);

  if (username) {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
    const idx = inputs.indexOf(pw);
    for (let i = idx - 1; i >= 0; i--) {
      const t = inputs[i].type;
      if (t === 'text' || t === 'email' || t === 'tel') {
        set(inputs[i], username);
        break;
      }
    }
  }
  return true;
}
