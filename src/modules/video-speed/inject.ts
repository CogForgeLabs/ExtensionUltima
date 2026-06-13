// Injected into the page (must be self-contained — no imports/closures beyond these
// functions' own scope; only page globals).

/**
 * Apply a playback rate AND install a persistent enforcer so the rate survives:
 *  - SPA navigations that swap the video source without a full page load (e.g. YouTube),
 *  - new <video>/<audio> elements added later,
 *  - the site resetting playbackRate to 1 when a new video loads.
 * Idempotent: calling again just updates the target rate.
 */
export function applyVideoSpeed(rate: number): number {
  const w = window as unknown as {
    __euRate?: number;
    __euSpeedHooked?: boolean;
  };
  w.__euRate = rate;

  const apply = (el: HTMLMediaElement): void => {
    try {
      if (el.playbackRate !== w.__euRate) el.playbackRate = w.__euRate ?? 1;
    } catch {
      /* ignore */
    }
  };
  const all = (): NodeListOf<HTMLMediaElement> => document.querySelectorAll<HTMLMediaElement>('video, audio');
  all().forEach(apply);

  if (!w.__euSpeedHooked) {
    w.__euSpeedHooked = true;
    const hook = (el: HTMLMediaElement & { __euHooked?: boolean }): void => {
      if (el.__euHooked) return;
      el.__euHooked = true;
      // Reapply when a (possibly new) source loads or starts playing.
      ['loadstart', 'loadeddata', 'canplay', 'play', 'playing'].forEach((ev) =>
        el.addEventListener(ev, () => apply(el)),
      );
    };
    const scan = (): void => all().forEach((el) => { hook(el); apply(el); });
    scan();
    try {
      new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
    } catch {
      /* observer unsupported — events still cover most cases */
    }
  }

  return all().length;
}
