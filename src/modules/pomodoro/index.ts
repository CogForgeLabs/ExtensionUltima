// Pomodoro — alternating focus/break timer with notifications. Each phase reschedules the
// next with the other duration.
import type { ExtensionModule, ModuleContext } from '../../core/modules/types';
import type { Job } from '../../core/triggers/types';

interface State {
  phase: 'work' | 'break';
  workMin: number;
  breakMin: number;
}

let ctx: ModuleContext;

const mod: ExtensionModule = {
  manifest: {
    id: 'pomodoro',
    name: 'Pomodoro',
    version: '0.1.0',
    description: 'Focus/break timer with notifications.',
    icon: '🍅',
    keywords: ['pomodoro', 'focus', 'timer', 'break', 'productivity', 'work'],
    category: 'Focus',
    hasPanel: true,
    browsers: ['chrome', 'firefox', 'edge', 'safari'],
    capabilities: ['storage', 'log', 'triggers', 'notifications'],
  },

  init(c) {
    ctx = c;
    ctx.triggers.registerAction('tick', runTick);
    ctx.log.info('initialized');
  },

  commands: {
    async start(p: { workMin: number; breakMin: number }) {
      const workMin = Math.max(1, p.workMin || 25);
      const breakMin = Math.max(1, p.breakMin || 5);
      for (const j of ctx.triggers.list()) await ctx.triggers.cancel(j.id);
      await ctx.storage.put('state', { phase: 'work', workMin, breakMin } satisfies State);
      await schedule('work', workMin);
      await ctx.notify.show('Pomodoro', `Focus time — ${workMin} minutes.`);
      return { ok: true };
    },
    async stop() {
      for (const j of ctx.triggers.list()) await ctx.triggers.cancel(j.id);
      await ctx.storage.delete('state');
      return { ok: true };
    },
    // Named `state` (not `status`) so the dashboard's status collector ignores it —
    // Pomodoro already appears in Activity via its timer job.
    async state() {
      const state = await ctx.storage.get<State>('state');
      return { running: ctx.triggers.list().length > 0, state: state ?? null };
    },
  },
};

async function runTick(job: Job): Promise<void> {
  const state = await ctx.storage.get<State>('state');
  if (!state) return;
  const nextPhase: State['phase'] = state.phase === 'work' ? 'break' : 'work';
  const mins = nextPhase === 'break' ? state.breakMin : state.workMin;

  await ctx.notify.show('Pomodoro', nextPhase === 'break' ? `Break time — ${mins} minutes.` : `Back to work — ${mins} minutes.`);
  await ctx.storage.put('state', { ...state, phase: nextPhase });

  await ctx.triggers.cancel(job.id);
  await schedule(nextPhase, mins);
}

async function schedule(phase: State['phase'], mins: number): Promise<void> {
  await ctx.triggers.schedule({
    action: 'tick',
    trigger: { kind: 'interval', seconds: mins * 60 },
    scope: { kind: 'all-tabs' },
    label: `Pomodoro · ${phase} ${mins}m`,
  });
}

export default mod;
