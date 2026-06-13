// Injected into the page (self-contained, runs in the isolated content world so it can use
// chrome.runtime to persist changes). Renders draggable sticky notes for the page.
export function renderNotes(url: string, notes: Array<{ id: string; x: number; y: number; text: string }>): void {
  const ID = 'eu-sticky';
  document.getElementById(ID)?.remove();
  const layer = document.createElement('div');
  layer.id = ID;
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483646';

  const send = (command: string, payload: unknown): void => {
    try {
      (globalThis as unknown as { chrome?: { runtime?: { sendMessage(m: unknown): void } } }).chrome?.runtime?.sendMessage({
        type: 'module',
        id: 'sticky-notes',
        command,
        payload,
      });
    } catch {
      /* ignore */
    }
  };

  for (const n of notes) {
    const card = document.createElement('div');
    card.style.cssText = `position:absolute;left:${n.x}px;top:${n.y}px;width:180px;min-height:60px;background:#fef9c3;color:#1a1a1a;border:1px solid #eab308;border-radius:6px;box-shadow:0 2px 8px #0003;font:13px system-ui;pointer-events:auto`;
    const bar = document.createElement('div');
    bar.style.cssText = 'height:18px;cursor:move;background:#fde047;border-radius:6px 6px 0 0;display:flex;justify-content:flex-end;touch-action:none';
    const del = document.createElement('span');
    del.textContent = '×';
    del.style.cssText = 'cursor:pointer;padding:0 7px;font-weight:700';
    del.onclick = () => {
      card.remove();
      send('remove', { url, id: n.id });
    };
    bar.appendChild(del);
    const body = document.createElement('div');
    body.contentEditable = 'true';
    body.textContent = n.text;
    body.style.cssText = 'padding:6px;outline:none;min-height:40px';
    body.addEventListener('blur', () => send('update', { url, id: n.id, text: body.innerText }));

    let sx = 0, sy = 0, ox = 0, oy = 0, drag = false;
    bar.addEventListener('pointerdown', (e) => {
      drag = true;
      sx = e.clientX;
      sy = e.clientY;
      ox = parseInt(card.style.left, 10);
      oy = parseInt(card.style.top, 10);
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', (e) => {
      if (!drag) return;
      card.style.left = `${ox + (e.clientX - sx)}px`;
      card.style.top = `${oy + (e.clientY - sy)}px`;
    });
    bar.addEventListener('pointerup', () => {
      if (!drag) return;
      drag = false;
      send('move', { url, id: n.id, x: parseInt(card.style.left, 10), y: parseInt(card.style.top, 10) });
    });

    card.append(bar, body);
    layer.appendChild(card);
  }

  document.documentElement.appendChild(layer);
}
