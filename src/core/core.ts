// The thin core that wires everything together: key vault, encryption engine, secure
// storage factory, scheduler, launcher prefs, and the module registry. Feature logic
// lives in modules, not here.
import { KeyVault } from './keyvault/vault';
import type { CryptoEngine } from './crypto/engine';
import { SecureStore } from './storage/secure-store';
import { ModuleRegistry } from './modules/registry';
import { Scheduler } from './triggers/scheduler';
import { TabService } from './tabs/service';
import type { Scope } from './triggers/types';
import { Prefs } from './prefs/prefs';
import { createLogger, type Logger } from './log';
import type { ModuleDescriptor } from './modules/types';

// Built-in modules. Add new modules here (and to MODULE_LOG.md — Rule 1).
import autoRefresh from '../modules/auto-refresh';
import keepAlive from '../modules/keep-alive';
import autoClick from '../modules/auto-click';
import pageWatch from '../modules/page-watch';
import passwordVault from '../modules/password-vault';
import totp from '../modules/totp';
import notes from '../modules/notes';
import sessionSaver from '../modules/session-saver';
import tabSuspender from '../modules/tab-suspender';
import autoMute from '../modules/auto-mute';
import darkMode from '../modules/dark-mode';
import videoSpeed from '../modules/video-speed';
import pip from '../modules/pip';
import changeMonitor from '../modules/change-monitor';
import scheduledOpener from '../modules/scheduled-opener';
import pomodoro from '../modules/pomodoro';
import tabSwitcher from '../modules/tab-switcher';
import snoozeTab from '../modules/snooze-tab';
import siteBlocker from '../modules/site-blocker';
import timeTracker from '../modules/time-tracker';
import elementZapper from '../modules/element-zapper';
import webHighlighter from '../modules/web-highlighter';
import autoScroll from '../modules/auto-scroll';
import readerMode from '../modules/reader-mode';
import cookieCleaner from '../modules/cookie-cleaner';
import breachChecker from '../modules/breach-checker';
import ephemeralNotes from '../modules/ephemeral-notes';
import bookmarkVault from '../modules/bookmark-vault';
import qr from '../modules/qr';
import textToSpeech from '../modules/text-to-speech';
import volumeBooster from '../modules/volume-booster';
import screenshot from '../modules/screenshot';
import recentlyClosed from '../modules/recently-closed';
import copyTabs from '../modules/copy-tabs';
import urlCleaner from '../modules/url-cleaner';
import mergeWindows from '../modules/merge-windows';
import incognitoOpener from '../modules/incognito-opener';
import stickyNotes from '../modules/sticky-notes';
import selectionToolbar from '../modules/selection-toolbar';
import textExpander from '../modules/text-expander';
import findReplace from '../modules/find-replace';
import imageDownloader from '../modules/image-downloader';
import reminders from '../modules/reminders';
import uptimeMonitor from '../modules/uptime-monitor';
import passphraseGenerator from '../modules/passphrase-generator';
import clipboardManager from '../modules/clipboard-manager';
import habitTracker from '../modules/habit-tracker';
import hotkeys from '../modules/hotkeys';
import contextMenu from '../modules/context-menu';
import omnibox from '../modules/omnibox';
import newTabDashboard from '../modules/new-tab-dashboard';

/** A unified row in the global Activity view — either a scheduler job or a module's
 *  ongoing effect (e.g. a muted site). */
export interface ActivityEntry {
  source: 'job' | 'config';
  /** Unique id for the UI. */
  uid: string;
  /** Set for jobs — used by pause/resume/stop. */
  jobId?: string;
  moduleId: string;
  /** Set for config items — passed to the module's stopActivity command. */
  entryId?: string;
  moduleName: string;
  icon: string;
  label: string;
  scopeKind: Scope['kind'] | 'none';
  targetKey: string;
  targetLabel: string;
  nextFireAt: number | null;
  paused: boolean;
  pausable: boolean;
  stoppable: boolean;
}

export interface ModuleStatus {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  summary: string;
}

export interface LauncherState {
  modules: ModuleDescriptor[];
  pins: string[];
  usage: Record<string, number>;
  lastUsed: Record<string, number>;
  activity: ActivityEntry[];
  statuses: ModuleStatus[];
}

export class Core {
  readonly vault = new KeyVault();
  readonly scheduler = new Scheduler(this);
  readonly modules = new ModuleRegistry(this);
  readonly prefs = new Prefs(this);
  readonly log: Logger = createLogger('core');
  private readonly tabsService = new TabService(false);

  /** The global encryption engine. Throws if locked. */
  get crypto(): CryptoEngine {
    return this.vault.crypto;
  }

  /** A namespaced encrypted store. All persistence goes through here (Rule 2). */
  storageFor(namespace: string): SecureStore {
    return new SecureStore(this.crypto, namespace);
  }

  /** Register modules. Safe to call while locked — no data is touched yet. */
  boot(): void {
    this.modules.register(autoRefresh);
    this.modules.register(keepAlive);
    this.modules.register(autoClick);
    this.modules.register(pageWatch);
    this.modules.register(passwordVault);
    this.modules.register(totp);
    this.modules.register(notes);
    this.modules.register(sessionSaver);
    this.modules.register(tabSuspender);
    this.modules.register(autoMute);
    this.modules.register(darkMode);
    this.modules.register(videoSpeed);
    this.modules.register(pip);
    this.modules.register(changeMonitor);
    this.modules.register(scheduledOpener);
    this.modules.register(pomodoro);
    this.modules.register(tabSwitcher);
    this.modules.register(snoozeTab);
    this.modules.register(siteBlocker);
    this.modules.register(timeTracker);
    this.modules.register(elementZapper);
    this.modules.register(webHighlighter);
    this.modules.register(autoScroll);
    this.modules.register(readerMode);
    this.modules.register(cookieCleaner);
    this.modules.register(breachChecker);
    this.modules.register(ephemeralNotes);
    this.modules.register(bookmarkVault);
    this.modules.register(qr);
    this.modules.register(textToSpeech);
    this.modules.register(volumeBooster);
    this.modules.register(screenshot);
    this.modules.register(recentlyClosed);
    this.modules.register(copyTabs);
    this.modules.register(urlCleaner);
    this.modules.register(mergeWindows);
    this.modules.register(incognitoOpener);
    this.modules.register(stickyNotes);
    this.modules.register(selectionToolbar);
    this.modules.register(textExpander);
    this.modules.register(findReplace);
    this.modules.register(imageDownloader);
    this.modules.register(reminders);
    this.modules.register(uptimeMonitor);
    this.modules.register(passphraseGenerator);
    this.modules.register(clipboardManager);
    this.modules.register(habitTracker);
    this.modules.register(hotkeys);
    this.modules.register(contextMenu);
    this.modules.register(omnibox);
    this.modules.register(newTabDashboard);
    this.log.info('core booted (locked)');
  }

  /** First run initializes the vault; later calls unlock it. Then start modules + jobs. */
  async unlock(passphrase: string): Promise<void> {
    if (await this.vault.isInitialized()) {
      await this.vault.unlock(passphrase);
    } else {
      await this.vault.setup(passphrase);
      this.log.info('vault initialized');
    }
    await this.startSession();
    this.log.info('unlocked');
  }

  /** Resume after a worker restart using the in-RAM session key (no passphrase). */
  async tryResume(): Promise<boolean> {
    if (this.vault.isUnlocked) return true;
    if (!(await this.vault.tryRehydrate())) return false;
    await this.startSession();
    this.log.info('resumed from session key');
    return true;
  }

  private async startSession(): Promise<void> {
    await this.modules.onUnlock(); // modules register their trigger actions here
    await this.scheduler.restore(); // then persisted jobs are (re)scheduled
  }

  async lock(): Promise<void> {
    this.scheduler.suspend();
    this.modules.onLock();
    await this.vault.lock();
    this.log.info('locked');
  }

  async launcher(): Promise<LauncherState> {
    return {
      modules: this.modules.descriptors(),
      pins: await this.prefs.pins(),
      usage: await this.prefs.usage(),
      lastUsed: await this.prefs.lastUsed(),
      activity: await this.activity(),
      statuses: await this.modules.collectStatuses(),
    };
  }

  /** Everything active across all modules: scheduler jobs + modules' ongoing effects. */
  async activity(): Promise<ActivityEntry[]> {
    const metas = new Map(this.modules.descriptors().map((d) => [d.id, d]));
    const tabTitles = new Map<number, string>();
    try {
      for (const t of await this.tabsService.allTabs()) tabTitles.set(t.id, t.title || t.url || `Tab ${t.id}`);
    } catch {
      /* tabs unavailable — fall back to ids */
    }

    const entries: ActivityEntry[] = [];

    // Scheduler jobs (timer automations).
    for (const j of this.scheduler.all()) {
      const d = metas.get(j.moduleId);
      const target = describeScope(j.scope, tabTitles);
      const next = j.nextFireAt;
      entries.push({
        source: 'job',
        uid: j.id,
        jobId: j.id,
        moduleId: j.moduleId,
        moduleName: d?.name ?? j.moduleId,
        icon: d?.icon ?? '•',
        label: j.label ?? j.action,
        scopeKind: target.kind,
        targetKey: target.key,
        targetLabel: target.label,
        nextFireAt: next != null && next < Number.MAX_SAFE_INTEGER ? next : null,
        paused: Boolean(j.paused),
        pausable: true,
        stoppable: true,
      });
    }

    // Modules' ongoing effects (e.g. muted sites, dark-mode sites).
    for (const grp of await this.modules.collectActivity()) {
      for (const it of grp.items) {
        const target = it.scope ? describeScope(it.scope, tabTitles) : { kind: 'none' as const, key: 'settings', label: 'Settings' };
        entries.push({
          source: 'config',
          uid: `${grp.moduleId}:${it.id}`,
          moduleId: grp.moduleId,
          entryId: it.id,
          moduleName: grp.moduleName,
          icon: grp.icon,
          label: it.label,
          scopeKind: target.kind,
          targetKey: target.key,
          targetLabel: target.label,
          nextFireAt: null,
          paused: false,
          pausable: false,
          stoppable: it.stoppable !== false,
        });
      }
    }

    return entries;
  }

  async cancelJob(jobId: string): Promise<void> {
    await this.scheduler.cancel(jobId);
  }

  async runJob(jobId: string): Promise<void> {
    await this.scheduler.fireNow(jobId);
  }

  async pauseJob(jobId: string): Promise<void> {
    await this.scheduler.pause(jobId);
  }

  async resumeJob(jobId: string): Promise<void> {
    await this.scheduler.resume(jobId);
  }

  async dispatch(id: string, command: string, payload: unknown): Promise<unknown> {
    return this.modules.dispatch(id, command, payload);
  }
}

/** Map a scope to a stable group key + human label for the Activity view. */
function describeScope(
  scope: Scope,
  tabTitles: Map<number, string>,
): { kind: Scope['kind']; key: string; label: string } {
  switch (scope.kind) {
    case 'tab':
      return { kind: 'tab', key: `tab:${scope.tabId}`, label: tabTitles.get(scope.tabId) ?? `Tab ${scope.tabId} (closed)` };
    case 'url':
      return { kind: 'url', key: `url:${scope.pattern}`, label: scope.pattern };
    case 'domain':
      return { kind: 'domain', key: `domain:${scope.domain}`, label: scope.domain };
    case 'all-tabs':
      return { kind: 'all-tabs', key: 'all-tabs', label: 'All tabs' };
    case 'window':
      return { kind: 'window', key: `window:${scope.windowId}`, label: 'This window' };
  }
}
