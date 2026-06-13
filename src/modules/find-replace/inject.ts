// Injected into the page (each function self-contained — no shared helpers, since only the
// passed function is serialized into the page).

export function clearFind(): void {
  document.querySelectorAll('mark.eu-find').forEach((m) => {
    const p = m.parentNode;
    if (p) {
      p.replaceChild(document.createTextNode(m.textContent ?? ''), m);
      p.normalize();
    }
  });
}

export function findHighlight(query: string, useRegex: boolean): number {
  document.querySelectorAll('mark.eu-find').forEach((m) => {
    const p = m.parentNode;
    if (p) {
      p.replaceChild(document.createTextNode(m.textContent ?? ''), m);
      p.normalize();
    }
  });
  if (!query) return 0;
  let re: RegExp;
  try {
    re = useRegex ? new RegExp(query, 'gi') : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  } catch {
    return 0;
  }
  let count = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const t = node as Text;
    const tag = t.parentElement?.tagName;
    if (tag && (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'MARK')) continue;
    if (t.nodeValue && re.test(t.nodeValue)) nodes.push(t);
    re.lastIndex = 0;
  }
  for (const tn of nodes) {
    const s = tn.nodeValue ?? '';
    const frag = document.createDocumentFragment();
    let last = 0;
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) {
      if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
      const mark = document.createElement('mark');
      mark.className = 'eu-find';
      mark.style.backgroundColor = '#fde047';
      mark.textContent = m[0];
      frag.appendChild(mark);
      last = m.index + m[0].length;
      count++;
      if (m[0].length === 0) re.lastIndex++;
    }
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    tn.parentNode?.replaceChild(frag, tn);
  }
  return count;
}

export function replaceAll(query: string, repl: string, useRegex: boolean): number {
  if (!query) return 0;
  let re: RegExp;
  try {
    re = useRegex ? new RegExp(query, 'g') : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  } catch {
    return 0;
  }
  let count = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  for (const tn of nodes) {
    const tag = tn.parentElement?.tagName;
    if (tag && (tag === 'SCRIPT' || tag === 'STYLE')) continue;
    const s = tn.nodeValue ?? '';
    re.lastIndex = 0;
    if (re.test(s)) {
      tn.nodeValue = s.replace(re, () => {
        count++;
        return repl;
      });
    }
  }
  return count;
}
