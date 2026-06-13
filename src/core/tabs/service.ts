// Tab + page-injection service (capability 'tabs'; injection also needs 'scripting').
// Resolves a Scope to concrete tab ids and performs tab actions. Injected functions run
// in the page and must be self-contained (no imports/closures) — see modules/.../inject.ts.
import browser from '../browser';
import type { Scope } from '../triggers/types';

export interface TabInfo {
  id: number;
  url: string;
  title: string;
  windowId?: number;
  active?: boolean;
  audible?: boolean;
  pinned?: boolean;
  discarded?: boolean;
}

export class TabService {
  constructor(private readonly canScript: boolean) {}

  async resolveScope(scope: Scope): Promise<number[]> {
    switch (scope.kind) {
      case 'tab':
        return [scope.tabId];
      case 'all-tabs':
        return ids(await browser.tabs.query({}));
      case 'window':
        return ids(await browser.tabs.query({ windowId: scope.windowId }));
      case 'url':
        return ids(await browser.tabs.query({ url: scope.pattern }));
      case 'domain': {
        const tabs = await browser.tabs.query({});
        return ids(tabs.filter((t) => t.url != null && host(t.url) === scope.domain));
      }
    }
  }

  async reload(tabId: number, bypassCache = false): Promise<void> {
    await browser.tabs.reload(tabId, { bypassCache });
  }

  async activate(tabId: number): Promise<void> {
    const tab = await browser.tabs.update(tabId, { active: true });
    if (tab?.windowId != null) {
      try {
        await browser.windows.update(tab.windowId, { focused: true });
      } catch {
        /* windows API may be unavailable — ignore */
      }
    }
  }

  async navigate(tabId: number, url: string): Promise<void> {
    await browser.tabs.update(tabId, { url });
  }

  /** Capture the visible area of the active tab as a data URL (null on failure). */
  async captureVisible(): Promise<string | null> {
    try {
      return await browser.tabs.captureVisibleTab();
    } catch {
      return null;
    }
  }

  async recentlyClosed(): Promise<Array<{ sessionId: string; title: string; url: string }>> {
    try {
      const sessions = await browser.sessions.getRecentlyClosed({ maxResults: 25 });
      const out: Array<{ sessionId: string; title: string; url: string }> = [];
      for (const s of sessions) {
        const t = s.tab;
        if (t?.sessionId) out.push({ sessionId: t.sessionId, title: t.title ?? t.url ?? '', url: t.url ?? '' });
      }
      return out;
    } catch {
      return [];
    }
  }

  async restoreClosed(sessionId: string): Promise<void> {
    try {
      await browser.sessions.restore(sessionId);
    } catch {
      /* ignore */
    }
  }

  async mergeAllIntoCurrent(): Promise<void> {
    const current = await browser.windows.getCurrent();
    if (current.id == null) return;
    const all = await browser.tabs.query({});
    const moving = all.filter((t) => t.windowId !== current.id && t.id != null).map((t) => t.id as number);
    if (moving.length) await browser.tabs.move(moving, { windowId: current.id, index: -1 });
  }

  async openIncognito(url: string): Promise<void> {
    await browser.windows.create({ url, incognito: true });
  }

  async download(url: string, filename?: string): Promise<void> {
    await browser.downloads.download(filename ? { url, filename } : { url });
  }

  async activeTab(): Promise<TabInfo | null> {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    return tab ? toInfo(tab) : null;
  }

  async allTabs(): Promise<TabInfo[]> {
    return (await browser.tabs.query({})).map(toInfo).filter((t): t is TabInfo => t !== null);
  }

  async currentWindowTabs(): Promise<TabInfo[]> {
    return (await browser.tabs.query({ currentWindow: true }))
      .map(toInfo)
      .filter((t): t is TabInfo => t !== null);
  }

  async openUrl(url: string, opts: { active?: boolean } = {}): Promise<void> {
    await browser.tabs.create({ url, active: opts.active ?? false });
  }

  async closeTab(tabId: number): Promise<void> {
    await browser.tabs.remove(tabId);
  }

  async discard(tabId: number): Promise<void> {
    try {
      await browser.tabs.discard(tabId);
    } catch {
      /* some tabs (active/special) can't be discarded — ignore */
    }
  }

  async setMuted(tabId: number, muted: boolean): Promise<void> {
    await browser.tabs.update(tabId, { muted });
  }

  /** Register a callback fired whenever any tab finishes loading. */
  onComplete(cb: (tabId: number, url: string) => void): void {
    browser.tabs.onUpdated.addListener((tabId, info, tab) => {
      if (info.status === 'complete') cb(tabId, tab.url ?? '');
    });
  }

  /** Register a callback fired when the active tab changes. */
  onActivated(cb: (tabId: number) => void): void {
    browser.tabs.onActivated.addListener((info) => cb(info.tabId));
  }

  /** Register a callback fired when a tab is closed. */
  onRemoved(cb: (tabId: number) => void): void {
    browser.tabs.onRemoved.addListener((tabId) => cb(tabId));
  }

  async insertCSS(tabId: number, css: string): Promise<void> {
    if (!this.canScript) throw new Error("Module did not declare the 'scripting' capability");
    await browser.scripting.insertCSS({ target: { tabId }, css });
  }

  async removeCSS(tabId: number, css: string): Promise<void> {
    if (!this.canScript) return;
    try {
      await browser.scripting.removeCSS({ target: { tabId }, css });
    } catch {
      /* nothing to remove — ignore */
    }
  }

  /** Run a self-contained function in the page and return its result. Requires 'scripting'. */
  async runFunc<A extends unknown[], R>(
    tabId: number,
    func: (...args: A) => R,
    args: A,
  ): Promise<R | undefined> {
    if (!this.canScript) throw new Error("Module did not declare the 'scripting' capability");
    const results = await browser.scripting.executeScript({
      target: { tabId },
      func: func as (...a: unknown[]) => unknown,
      args: args as unknown[],
    });
    return results?.[0]?.result as R | undefined;
  }
}

function ids(tabs: Array<{ id?: number }>): number[] {
  return tabs.map((t) => t.id).filter((id): id is number => typeof id === 'number');
}

function toInfo(t: {
  id?: number;
  url?: string;
  title?: string;
  windowId?: number;
  active?: boolean;
  audible?: boolean;
  pinned?: boolean;
  discarded?: boolean;
}): TabInfo | null {
  if (t.id == null) return null;
  return {
    id: t.id,
    url: t.url ?? '',
    title: t.title ?? '',
    windowId: t.windowId,
    active: t.active,
    audible: t.audible,
    pinned: t.pinned,
    discarded: t.discarded,
  };
}

function host(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
