// Injected into the page (self-contained). Routes media through a Web Audio gain node so
// volume can exceed 100%. A source node can only be created once per element, so we cache.
export function setGain(level: number): string {
  const w = window as unknown as { __euAC?: AudioContext; __euGain?: WeakMap<HTMLMediaElement, GainNode> };
  try {
    const ACtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ACtor) return 'unsupported';
    if (!w.__euAC) {
      w.__euAC = new ACtor();
      w.__euGain = new WeakMap();
    }
    const ac = w.__euAC;
    const map = w.__euGain as WeakMap<HTMLMediaElement, GainNode>;
    const media = Array.from(document.querySelectorAll('video, audio')) as HTMLMediaElement[];
    if (!media.length) return 'no-media';
    for (const m of media) {
      let g = map.get(m);
      if (!g) {
        try {
          const src = ac.createMediaElementSource(m);
          g = ac.createGain();
          src.connect(g);
          g.connect(ac.destination);
          map.set(m, g);
        } catch {
          continue; // already connected elsewhere
        }
      }
      g.gain.value = level;
    }
    if (ac.state === 'suspended') void ac.resume();
    return 'ok';
  } catch {
    return 'error';
  }
}
