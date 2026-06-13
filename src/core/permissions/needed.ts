// Computes the browser permissions a module needs from its declared capabilities (+ extras).
// Pure — no browser API. Capabilities map to permissions; 'scripting' or `hostAccess` imply
// broad host access. Browser permissions are extension-global, so granting any of these for
// one tool automatically satisfies every other tool that needs the same one.
import type { ModuleManifest } from '../modules/types';

const CAP_PERMISSIONS: Record<string, string[]> = {
  tabs: ['tabs'],
  scripting: ['scripting'],
  notifications: ['notifications'],
  cookies: ['cookies'],
  // storage, log, triggers need no optional permission (storage + alarms are core).
};

export interface NeededPermissions {
  permissions: string[];
  origins: string[];
}

export function neededFor(manifest: ModuleManifest): NeededPermissions {
  const permissions = new Set<string>();
  for (const cap of manifest.capabilities) {
    for (const p of CAP_PERMISSIONS[cap] ?? []) permissions.add(p);
  }
  for (const p of manifest.extraPermissions ?? []) permissions.add(p);
  const origins = manifest.capabilities.includes('scripting') || manifest.hostAccess ? ['<all_urls>'] : [];
  return { permissions: [...permissions], origins };
}
