// The contract every sub-extension module implements. One module = one folder under
// src/modules/. A module declares launcher metadata, the browsers it supports (Rule 4),
// and the capabilities it needs; the host grants only what is declared (least privilege).
import type { SecureStore } from '../storage/secure-store';
import type { Logger } from '../log';
import type { TabService } from '../tabs/service';
import type { TriggerService } from '../triggers/scheduler';
import type { NotifyService } from '../notify/notify';
import type { CookieService } from '../cookies/service';
import type { Scope } from '../triggers/types';

/**
 * One manageable thing a module is currently doing, surfaced in the global Activity view.
 * Modules with ongoing effects (not timer jobs) return these from an `activity` command and
 * remove one via a `stopActivity({ id })` command. `scope` lets it group by tab/site.
 */
export interface ModuleActivityItem {
  id: string;
  label: string;
  scope?: Scope;
  stoppable?: boolean;
}

export type BrowserTarget = 'chrome' | 'firefox' | 'edge' | 'safari';

export type Capability = 'storage' | 'log' | 'tabs' | 'triggers' | 'scripting' | 'notifications' | 'cookies';

export interface ModuleManifest {
  /** Unique, kebab-case id. */
  id: string;
  name: string;
  version: string;
  description: string;
  /** Emoji/glyph shown in the launcher. */
  icon: string;
  /** Search terms for the launcher search bar. */
  keywords: string[];
  /** Grouping label in the launcher. */
  category: string;
  /** Whether the popup shows a config panel for this module. */
  hasPanel: boolean;
  /** Browsers this module is verified to support (Rule 4). */
  browsers: BrowserTarget[];
  /** Capabilities the module requires. */
  capabilities: Capability[];
  /** Extra browser permissions beyond those implied by capabilities (e.g. 'sessions',
   *  'downloads', 'contextMenus'). Granted on-demand when the tool is enabled. */
  extraPermissions?: string[];
  /** Whether the tool needs broad host access (page injection or cross-site fetch). */
  hostAccess?: boolean;
}

/** Capability-scoped services handed to a module at init. Undeclared services throw on use. */
export interface ModuleContext {
  log: Logger;
  storage: SecureStore;
  tabs: TabService;
  triggers: TriggerService;
  notify: NotifyService;
  cookies: CookieService;
}

/** A command invoked from the UI (popup) and routed to the module in the background. */
export type CommandHandler = (payload: any) => Promise<unknown> | unknown;

export interface ExtensionModule {
  manifest: ModuleManifest;
  /** Called once, after the vault is unlocked. */
  init(ctx: ModuleContext): Promise<void> | void;
  enable?(): Promise<void> | void;
  disable?(): Promise<void> | void;
  /** UI-callable commands, routed by the background message broker. */
  commands?: Record<string, CommandHandler>;
}

/** Non-secret module info sent to the popup launcher. */
export interface ModuleDescriptor {
  id: string;
  name: string;
  description: string;
  icon: string;
  keywords: string[];
  category: string;
  hasPanel: boolean;
  browsers: BrowserTarget[];
  /** Optional browser permissions this tool needs (requested on enable). */
  permissions: string[];
  /** Host origins this tool needs (e.g. ['<all_urls>']). */
  origins: string[];
}
