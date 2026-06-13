// Injected into the page (must be self-contained — no imports/closures beyond each
// function's own scope; only page globals).

/**
 * Toggle Picture-in-Picture on the best video. Called from the popup so it carries a user
 * gesture. Returns 'ok' | 'exit' | 'no-video' | 'unsupported' | 'denied' (the popup uses
 * 'denied' to arm the click fallback below).
 */
export async function togglePiP(): Promise<string> {
  const d = document as Document & {
    pictureInPictureEnabled?: boolean;
    pictureInPictureElement?: Element | null;
    exitPictureInPicture?: () => Promise<void>;
  };
  if (!d.pictureInPictureEnabled) return 'unsupported';
  if (d.pictureInPictureElement) {
    await d.exitPictureInPicture?.();
    return 'exit';
  }
  const vids = Array.from(document.querySelectorAll('video')) as HTMLVideoElement[];
  if (!vids.length) return 'no-video';
  const v =
    vids.filter((x) => !x.paused && x.readyState > 1)[0] ??
    vids.slice().sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
  try {
    (v as HTMLVideoElement & { disablePictureInPicture?: boolean }).disablePictureInPicture = false;
    v.removeAttribute('disablepictureinpicture');
  } catch {
    /* ignore */
  }
  try {
    await v.requestPictureInPicture();
    return 'ok';
  } catch {
    return 'denied';
  }
}

/**
 * Fallback when PiP is denied for lack of a page gesture: arm a one-shot handler so the next
 * click/keypress anywhere on the page (a genuine gesture) starts PiP.
 */
export function armPiP(): string {
  const d = document as Document & { pictureInPictureEnabled?: boolean };
  if (!d.pictureInPictureEnabled) return 'unsupported';
  const handler = (): void => {
    document.removeEventListener('click', handler, true);
    document.removeEventListener('keydown', handler, true);
    const vids = Array.from(document.querySelectorAll('video')) as HTMLVideoElement[];
    const v =
      vids.filter((x) => !x.paused && x.readyState > 1)[0] ??
      vids.slice().sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
    if (!v) return;
    try {
      (v as HTMLVideoElement & { disablePictureInPicture?: boolean }).disablePictureInPicture = false;
      v.removeAttribute('disablepictureinpicture');
    } catch {
      /* ignore */
    }
    void v.requestPictureInPicture().catch(() => {});
  };
  document.addEventListener('click', handler, true);
  document.addEventListener('keydown', handler, true);
  return 'armed';
}
