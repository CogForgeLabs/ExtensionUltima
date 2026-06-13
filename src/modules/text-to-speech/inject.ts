// Injected into the page (self-contained). Reads text aloud via the page's speechSynthesis.
export function speakPage(selectionOnly: boolean): string {
  const synth = window.speechSynthesis;
  if (!synth) return 'unsupported';
  synth.cancel();
  let text = '';
  const sel = window.getSelection();
  if (selectionOnly && sel && !sel.isCollapsed) text = sel.toString();
  else text = document.body ? document.body.innerText : '';
  text = text.trim().slice(0, 30000);
  if (!text) return 'empty';
  synth.speak(new SpeechSynthesisUtterance(text));
  return 'speaking';
}

export function stopSpeaking(): void {
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
