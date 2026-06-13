// Registry of popup config panels, keyed by module id. A module with `hasPanel: true`
// should have an entry here; modules without one just record a launch when opened.
import type { Panel } from './host';
import autoRefreshPanel from '../../modules/auto-refresh/panel';
import keepAlivePanel from '../../modules/keep-alive/panel';
import autoClickPanel from '../../modules/auto-click/panel';
import pageWatchPanel from '../../modules/page-watch/panel';
import passwordVaultPanel from '../../modules/password-vault/panel';
import totpPanel from '../../modules/totp/panel';
import notesPanel from '../../modules/notes/panel';
import sessionSaverPanel from '../../modules/session-saver/panel';
import tabSuspenderPanel from '../../modules/tab-suspender/panel';
import autoMutePanel from '../../modules/auto-mute/panel';
import darkModePanel from '../../modules/dark-mode/panel';
import videoSpeedPanel from '../../modules/video-speed/panel';
import pipPanel from '../../modules/pip/panel';
import tabSwitcherPanel from '../../modules/tab-switcher/panel';
import snoozeTabPanel from '../../modules/snooze-tab/panel';
import siteBlockerPanel from '../../modules/site-blocker/panel';
import timeTrackerPanel from '../../modules/time-tracker/panel';
import elementZapperPanel from '../../modules/element-zapper/panel';
import webHighlighterPanel from '../../modules/web-highlighter/panel';
import autoScrollPanel from '../../modules/auto-scroll/panel';
import readerModePanel from '../../modules/reader-mode/panel';
import cookieCleanerPanel from '../../modules/cookie-cleaner/panel';
import breachCheckerPanel from '../../modules/breach-checker/panel';
import ephemeralNotesPanel from '../../modules/ephemeral-notes/panel';
import bookmarkVaultPanel from '../../modules/bookmark-vault/panel';
import qrPanel from '../../modules/qr/panel';
import textToSpeechPanel from '../../modules/text-to-speech/panel';
import volumeBoosterPanel from '../../modules/volume-booster/panel';
import screenshotPanel from '../../modules/screenshot/panel';
import recentlyClosedPanel from '../../modules/recently-closed/panel';
import copyTabsPanel from '../../modules/copy-tabs/panel';
import urlCleanerPanel from '../../modules/url-cleaner/panel';
import mergeWindowsPanel from '../../modules/merge-windows/panel';
import incognitoOpenerPanel from '../../modules/incognito-opener/panel';
import stickyNotesPanel from '../../modules/sticky-notes/panel';
import selectionToolbarPanel from '../../modules/selection-toolbar/panel';
import textExpanderPanel from '../../modules/text-expander/panel';
import findReplacePanel from '../../modules/find-replace/panel';
import imageDownloaderPanel from '../../modules/image-downloader/panel';
import remindersPanel from '../../modules/reminders/panel';
import uptimeMonitorPanel from '../../modules/uptime-monitor/panel';
import passphraseGeneratorPanel from '../../modules/passphrase-generator/panel';
import clipboardManagerPanel from '../../modules/clipboard-manager/panel';
import habitTrackerPanel from '../../modules/habit-tracker/panel';
import hotkeysPanel from '../../modules/hotkeys/panel';
import contextMenuPanel from '../../modules/context-menu/panel';
import omniboxPanel from '../../modules/omnibox/panel';
import newTabDashboardPanel from '../../modules/new-tab-dashboard/panel';
import changeMonitorPanel from '../../modules/change-monitor/panel';
import scheduledOpenerPanel from '../../modules/scheduled-opener/panel';
import pomodoroPanel from '../../modules/pomodoro/panel';

export const panels: Record<string, Panel> = {
  'auto-refresh': autoRefreshPanel,
  'keep-alive': keepAlivePanel,
  'auto-click': autoClickPanel,
  'page-watch': pageWatchPanel,
  'password-vault': passwordVaultPanel,
  totp: totpPanel,
  notes: notesPanel,
  'session-saver': sessionSaverPanel,
  'tab-suspender': tabSuspenderPanel,
  'auto-mute': autoMutePanel,
  'dark-mode': darkModePanel,
  'video-speed': videoSpeedPanel,
  pip: pipPanel,
  'change-monitor': changeMonitorPanel,
  'scheduled-opener': scheduledOpenerPanel,
  pomodoro: pomodoroPanel,
  'tab-switcher': tabSwitcherPanel,
  'snooze-tab': snoozeTabPanel,
  'site-blocker': siteBlockerPanel,
  'time-tracker': timeTrackerPanel,
  'element-zapper': elementZapperPanel,
  'web-highlighter': webHighlighterPanel,
  'auto-scroll': autoScrollPanel,
  'reader-mode': readerModePanel,
  'cookie-cleaner': cookieCleanerPanel,
  'breach-checker': breachCheckerPanel,
  'ephemeral-notes': ephemeralNotesPanel,
  'bookmark-vault': bookmarkVaultPanel,
  qr: qrPanel,
  'text-to-speech': textToSpeechPanel,
  'volume-booster': volumeBoosterPanel,
  screenshot: screenshotPanel,
  'recently-closed': recentlyClosedPanel,
  'copy-tabs': copyTabsPanel,
  'url-cleaner': urlCleanerPanel,
  'merge-windows': mergeWindowsPanel,
  'incognito-opener': incognitoOpenerPanel,
  'sticky-notes': stickyNotesPanel,
  'selection-toolbar': selectionToolbarPanel,
  'text-expander': textExpanderPanel,
  'find-replace': findReplacePanel,
  'image-downloader': imageDownloaderPanel,
  reminders: remindersPanel,
  'uptime-monitor': uptimeMonitorPanel,
  'passphrase-generator': passphraseGeneratorPanel,
  'clipboard-manager': clipboardManagerPanel,
  'habit-tracker': habitTrackerPanel,
  hotkeys: hotkeysPanel,
  'context-menu': contextMenuPanel,
  omnibox: omniboxPanel,
  'new-tab-dashboard': newTabDashboardPanel,
};
