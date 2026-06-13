// Snooze Tab — close the current tab now and reopen it later. Each snooze is a one-shot
// scheduled job, so it shows in the Activity dashboard and can be cancelled there.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import type { Job } from '../../core/triggers/types';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'snooze-tab',
    name: 'Snooze Tab',
    version: '0.1.0',
    description: 'Close a tab now and have it reopen later.',
    icon: '💤',
    keywords: ['snooze', 'later', 'reopen', 'remind', 'tab', 'defer', 'read later'],
    category: 'Tabs',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'tabs', 'triggers', 'storage'],
  },

  init(c) {
    ctx = c;
    ctx.triggers.registerAction('reopen', reopen);
    ctx.log.info('initialized');
  },

  commands: {
    async snooze(p: { minutes: number }) {
      const tab = await ctx.tabs.activeTab();
      if (!tab || !/^https?:/.test(tab.url)) throw new Error('No snoozable tab.');
      const at = Date.now() + Math.max(1, p.minutes) * 60_000;
      await ctx.triggers.schedule({
        action: 'reopen',
        trigger: { kind: 'at', at },
        scope: { kind: 'all-tabs' },
        payload: { url: tab.url, title: tab.title },
        label: `reopen ${hostOf(tab.url)}`,
      });
      await ctx.tabs.closeTab(tab.id);
      return { ok: true };
    },
  },
};

async function reopen(job: Job): Promise<void> {
  const p = job.payload as { url?: string } | undefined;
  if (p?.url) await ctx.tabs.openUrl(p.url, { active: false });
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default mod;
