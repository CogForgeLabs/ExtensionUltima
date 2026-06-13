// Module registry + loader. Validates manifests, builds each module's capability-scoped
// context (least privilege — undeclared services throw), drives lifecycle on unlock/lock,
// and routes UI commands.
import type { Core } from '../core';
import type { ExtensionModule, ModuleActivityItem, ModuleContext, ModuleDescriptor } from './types';
import { TabService } from '../tabs/service';
import { TriggerService } from '../triggers/scheduler';
import { NotifyService } from '../notify/notify';
import { CookieService } from '../cookies/service';
import { neededFor } from '../permissions/needed';

interface Managed {
  mod: ExtensionModule;
  state: 'registered' | 'active' | 'error';
  initialized: boolean;
}

export class ModuleRegistry {
  private readonly items = new Map<string, Managed>();

  constructor(private readonly core: Core) {}

  register(mod: ExtensionModule): void {
    const { id, version } = mod.manifest;
    if (this.items.has(id)) throw new Error(`Duplicate module id: ${id}`);
    this.items.set(id, { mod, state: 'registered', initialized: false });
    this.core.log.info(`registered module '${id}' v${version}`);
  }

  descriptors(): ModuleDescriptor[] {
    return [...this.items.values()].map(({ mod }) => {
      const m = mod.manifest;
      const need = neededFor(m);
      return {
        id: m.id,
        name: m.name,
        description: m.description,
        icon: m.icon,
        keywords: m.keywords,
        category: m.category,
        hasPanel: m.hasPanel,
        browsers: m.browsers,
        permissions: need.permissions,
        origins: need.origins,
      };
    });
  }

  private buildContext(mod: ExtensionModule): ModuleContext {
    const caps = mod.manifest.capabilities;
    const id = mod.manifest.id;
    const has = (c: string) => caps.includes(c as never);
    return {
      log: this.core.log.child(id),
      storage: has('storage') ? this.core.storageFor(`mod:${id}`) : denied(id, 'storage'),
      tabs: has('tabs') ? new TabService(has('scripting')) : denied(id, 'tabs'),
      triggers: has('triggers') ? new TriggerService(this.core.scheduler, id) : denied(id, 'triggers'),
      notify: has('notifications') ? new NotifyService() : denied(id, 'notifications'),
      cookies: has('cookies') ? new CookieService() : denied(id, 'cookies'),
    };
  }

  /** Init (once) and enable every module. Called after the vault unlocks. */
  async onUnlock(): Promise<void> {
    for (const item of this.items.values()) {
      try {
        if (!item.initialized) {
          await item.mod.init(this.buildContext(item.mod));
          item.initialized = true;
        }
        await item.mod.enable?.();
        item.state = 'active';
      } catch (e) {
        item.state = 'error';
        this.core.log.error(
          `module '${item.mod.manifest.id}' failed to start`,
          e instanceof Error ? e.message : String(e),
        );
      }
    }
  }

  onLock(): void {
    for (const item of this.items.values()) {
      if (item.state === 'active') {
        try {
          item.mod.disable?.();
        } catch {
          /* ignore disable errors during lock */
        }
        item.state = 'registered';
      }
    }
  }

  /** Collect a one-line status from every active module that exposes a `status` command. */
  async collectStatuses(): Promise<Array<{ id: string; name: string; icon: string; active: boolean; summary: string }>> {
    const out: Array<{ id: string; name: string; icon: string; active: boolean; summary: string }> = [];
    for (const item of this.items.values()) {
      const fn = item.mod.commands?.status;
      if (!fn || item.state !== 'active') continue;
      try {
        const r = (await fn(undefined)) as { active?: boolean; summary?: string } | undefined;
        if (r && (r.summary || r.active)) {
          const m = item.mod.manifest;
          out.push({ id: m.id, name: m.name, icon: m.icon, active: Boolean(r.active), summary: String(r.summary ?? '') });
        }
      } catch {
        /* a module's status failing shouldn't break the dashboard */
      }
    }
    return out;
  }

  /** Collect ongoing activity items from every active module that exposes an `activity` command. */
  async collectActivity(): Promise<Array<{ moduleId: string; moduleName: string; icon: string; items: ModuleActivityItem[] }>> {
    const out: Array<{ moduleId: string; moduleName: string; icon: string; items: ModuleActivityItem[] }> = [];
    for (const item of this.items.values()) {
      const fn = item.mod.commands?.activity;
      if (!fn || item.state !== 'active') continue;
      try {
        const r = (await fn(undefined)) as ModuleActivityItem[] | undefined;
        if (Array.isArray(r) && r.length) {
          const m = item.mod.manifest;
          out.push({ moduleId: m.id, moduleName: m.name, icon: m.icon, items: r });
        }
      } catch {
        /* a module's activity failing shouldn't break the dashboard */
      }
    }
    return out;
  }

  /** Route a UI command to a module. The module must be active (vault unlocked). */
  async dispatch(id: string, command: string, payload: unknown): Promise<unknown> {
    const item = this.items.get(id);
    if (!item) throw new Error(`Unknown module: ${id}`);
    if (item.state !== 'active') throw new Error(`Module '${id}' is not active (unlock first)`);
    const handler = item.mod.commands?.[command];
    if (!handler) throw new Error(`Module '${id}' has no command '${command}'`);
    return handler(payload);
  }
}

/** A stand-in that throws on any use, for capabilities a module did not declare. */
function denied(moduleId: string, cap: string): never {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(`Module '${moduleId}' did not declare the '${cap}' capability`);
      },
    },
  ) as never;
}
