// Background entry (MV3 service worker on Chrome/Edge/Safari, background script on Firefox).
// Boots the core, resumes from the session key if the worker was restarted, and brokers
// popup messages. A 30s tick alarm both keeps the worker warm and fires due jobs after an
// eviction/resume.
import browser from '../core/browser';
import { Core } from '../core/core';

const core = new Core();
core.boot();

const TICK = 'eu:tick';

async function ensureTick(): Promise<void> {
  try {
    await browser.alarms.create(TICK, { periodInMinutes: 0.5 });
  } catch {
    /* alarms unavailable — ignore */
  }
}

// On worker start, try to resume an active session (key held in RAM via storage.session).
void (async () => {
  try {
    if (await core.tryResume()) {
      await ensureTick();
      await buildContextMenus();
    }
  } catch {
    /* nothing to resume */
  }
})();

// --- Platform features: context menus, keyboard commands, omnibox ---

const cm = (browser as unknown as { contextMenus?: typeof browser.contextMenus }).contextMenus;

async function buildContextMenus(): Promise<void> {
  if (!cm) return;
  try {
    await cm.removeAll();
    if (!core.vault.isUnlocked) return;
    const items = (await core.dispatch('context-menu', 'items', undefined)) as Array<{ id: string; title: string; contexts: string[] }>;
    for (const it of items) {
      cm.create({ id: it.id, title: it.title, contexts: it.contexts as browser.Menus.ContextType[] });
    }
  } catch {
    /* context-menu module inactive or API unavailable */
  }
}

cm?.onClicked.addListener(async (info, tab) => {
  try {
    if (!core.vault.isUnlocked && !(await core.tryResume())) return;
    await core.dispatch('context-menu', 'onClick', {
      menuItemId: String(info.menuItemId),
      selectionText: info.selectionText,
      linkUrl: info.linkUrl,
      pageUrl: info.pageUrl,
      tabId: tab?.id,
    });
  } catch {
    /* ignore */
  }
});

browser.commands?.onCommand.addListener(async (command) => {
  try {
    if (!core.vault.isUnlocked && !(await core.tryResume())) return;
    const target = (await core.dispatch('hotkeys', 'resolve', { command })) as { moduleId: string; command: string; payload?: unknown } | null;
    if (target) await core.dispatch(target.moduleId, target.command, target.payload);
  } catch {
    /* ignore */
  }
});

const omni = (browser as unknown as { omnibox?: typeof browser.omnibox }).omnibox;
omni?.setDefaultSuggestion?.({ description: 'ExtensionUltima — type a search term or a URL' });
omni?.onInputChanged.addListener(async (text, suggest) => {
  try {
    if (!core.vault.isUnlocked && !(await core.tryResume())) {
      suggest([{ content: text, description: 'Unlock ExtensionUltima first' }]);
      return;
    }
    const s = (await core.dispatch('omnibox', 'suggest', { text })) as Array<{ content: string; description: string }>;
    suggest(s);
  } catch {
    /* ignore */
  }
});
omni?.onInputEntered.addListener(async (text) => {
  try {
    if (!core.vault.isUnlocked && !(await core.tryResume())) return;
    await core.dispatch('omnibox', 'run', { text });
  } catch {
    /* ignore */
  }
});

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== TICK) return;
  try {
    if (!core.vault.isUnlocked && !(await core.tryResume())) return;
    await core.scheduler.tick();
  } catch {
    /* swallow — next tick retries */
  }
});

interface Incoming {
  type: string;
  passphrase?: string;
  id?: string;
  command?: string;
  payload?: unknown;
}

browser.runtime.onMessage.addListener(async (raw: unknown) => {
  const msg = raw as Incoming;
  try {
    switch (msg?.type) {
      case 'status':
        return {
          ok: true,
          initialized: await core.vault.isInitialized(),
          unlocked: core.vault.isUnlocked,
        };

      case 'unlock':
        await core.unlock(msg.passphrase ?? '');
        await ensureTick();
        await buildContextMenus();
        return { ok: true };

      case 'rebuildMenus':
        await buildContextMenus();
        return { ok: true };

      case 'lock':
        await core.lock();
        await browser.alarms.clear(TICK);
        return { ok: true };

      case 'launcher':
        if (!core.vault.isUnlocked) return { ok: false, error: 'locked' };
        return { ok: true, ...(await core.launcher()) };

      case 'recordLaunch':
        await core.prefs.recordLaunch(msg.id ?? '');
        return { ok: true };

      case 'togglePin':
        return { ok: true, pins: await core.prefs.togglePin(msg.id ?? '') };

      case 'cancelJob':
        await core.cancelJob(msg.id ?? '');
        return { ok: true };

      case 'runJob':
        await core.runJob(msg.id ?? '');
        return { ok: true };

      case 'pauseJob':
        await core.pauseJob(msg.id ?? '');
        return { ok: true };

      case 'resumeJob':
        await core.resumeJob(msg.id ?? '');
        return { ok: true };

      case 'module':
        return {
          ok: true,
          result: await core.dispatch(msg.id ?? '', msg.command ?? '', msg.payload),
        };

      default:
        return { ok: false, error: 'unknown message' };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
});
