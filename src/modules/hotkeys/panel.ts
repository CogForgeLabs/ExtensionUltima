import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

const SLOTS = ['eu-1', 'eu-2', 'eu-3', 'eu-4'];

const panel: Panel = {
  async render(root, host) {
    const actions = await host.call<Array<{ key: string; label: string }>>('actions');
    const mapping = await host.call<Record<string, string>>('mapping');

    root.append(el('p', { className: 'muted', textContent: 'Map each shortcut slot to an action, then assign keys at your browser’s shortcuts page (e.g. chrome://extensions/shortcuts).' }));

    SLOTS.forEach((slot, i) => {
      const sel = el('select', { style: 'flex:1' }, [el('option', { value: '', textContent: '— none —' }), ...actions.map((a) => el('option', { value: a.key, textContent: a.label }))]) as HTMLSelectElement;
      sel.value = mapping[slot] ?? '';
      sel.addEventListener('change', () => void host.call('setSlot', { slot, actionKey: sel.value }));
      root.append(el('div', { className: 'row', style: 'margin:5px 0' }, [el('span', { className: 'muted', style: 'width:54px', textContent: `Slot ${i + 1}` }), sel]));
    });
  },
};

export default panel;
