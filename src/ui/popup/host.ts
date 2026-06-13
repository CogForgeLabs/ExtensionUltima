// Shared types/helpers for the popup and its module panels.
import browser from '../../core/browser';

export interface ModuleDescriptor {
  id: string;
  name: string;
  description: string;
  icon: string;
  keywords: string[];
  category: string;
  hasPanel: boolean;
  browsers: string[];
  permissions: string[];
  origins: string[];
}

export interface ActiveTab {
  id: number;
  url: string;
  title: string;
}

/** Services a module panel uses to talk to its background module. */
export interface PanelHost {
  descriptor: ModuleDescriptor;
  activeTab: ActiveTab | null;
  /** Invoke a command on this panel's module (routed to the background). */
  call<T = unknown>(command: string, payload?: unknown): Promise<T>;
  /**
   * Inject a self-contained function into the active tab directly from the popup, so it runs
   * with the popup's user gesture. Needed for gesture-gated APIs like Picture-in-Picture and
   * fullscreen. Call it first thing in a click handler (no awaits before it) to keep the gesture.
   */
  runInActiveTab<A extends unknown[]>(func: (...args: A) => unknown, args: A): Promise<unknown>;
  /** Return to the launcher list. */
  back(): void;
}

export interface Panel {
  render(root: HTMLElement, host: PanelHost): void | Promise<void>;
}

/** Low-level message to the background broker. Throws on `{ ok: false }`. */
export async function send<T = unknown>(msg: unknown): Promise<T> {
  const res = (await browser.runtime.sendMessage(msg)) as { ok: boolean; error?: string } & Record<string, unknown>;
  if (!res?.ok) throw new Error(res?.error ?? 'request failed');
  return res as unknown as T;
}
