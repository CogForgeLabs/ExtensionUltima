// Reminders — schedule a notification with a message: once after N minutes, at a time of
// day, or repeating. Each is a scheduled job (visible/cancellable in the Activity dashboard).
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import type { Job, TriggerSpec } from '../../core/triggers/types';

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'reminders',
    name: 'Reminders',
    version: '0.1.0',
    description: 'Get a notification at a time, after a delay, or on repeat.',
    icon: '⏰',
    keywords: ['reminder', 'alarm', 'notify', 'alert', 'todo', 'timer'],
    category: 'Focus',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['log', 'triggers', 'notifications'],
  },

  init(c) {
    ctx = c;
    ctx.triggers.registerAction('remind', async (job: Job) => {
      const p = job.payload as { message?: string } | undefined;
      await ctx.notify.show('Reminder', p?.message || 'Reminder');
    });
    ctx.log.info('initialized');
  },

  commands: {
    async add(p: { message: string; mode: 'in' | 'every' | 'at'; minutes?: number; time?: string }) {
      if (!p.message?.trim()) throw new Error('Message required.');
      let trigger: TriggerSpec;
      let when: string;
      if (p.mode === 'at' && p.time) {
        const [h, m] = p.time.split(':').map(Number);
        const now = new Date();
        const next = new Date(now);
        next.setHours(h, m, 0, 0);
        if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
        trigger = { kind: 'at', at: next.getTime() };
        when = `at ${p.time}`;
      } else if (p.mode === 'every') {
        trigger = { kind: 'interval', seconds: Math.max(1, p.minutes ?? 30) * 60 };
        when = `every ${p.minutes}m`;
      } else {
        trigger = { kind: 'at', at: Date.now() + Math.max(1, p.minutes ?? 10) * 60_000 };
        when = `in ${p.minutes}m`;
      }
      await ctx.triggers.schedule({ action: 'remind', trigger, scope: { kind: 'all-tabs' }, payload: { message: p.message }, label: `${p.message} (${when})` });
      return { ok: true };
    },
    list() {
      return ctx.triggers.list().map((j) => ({ id: j.id, label: j.label ?? 'reminder' }));
    },
    async cancel(p: { id: string }) {
      await ctx.triggers.cancel(p.id);
      return { ok: true };
    },
  },
};

export default mod;
