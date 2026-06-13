import type { Panel } from '../../ui/popup/host';
import { el } from '../../ui/popup/dom';

interface ListEntry {
  id: string;
  title: string;
  url: string;
  username: string;
}

const panel: Panel = {
  async render(root, host) {
    const listWrap = el('div', {});
    const formWrap = el('div', {});

    const showList = async () => {
      formWrap.replaceChildren();
      const entries = await host.call<ListEntry[]>('list');
      listWrap.replaceChildren();
      listWrap.append(
        el('div', { className: 'row' }, [
          el('button', {
            className: 'primary',
            textContent: '+ Add login',
            style: 'flex:1',
            onclick: () => void showForm(),
          }),
        ]),
      );
      if (!entries.length) {
        listWrap.append(el('p', { className: 'muted', textContent: 'No saved logins yet.' }));
        return;
      }
      const ul = el('ul', { className: 'jobs' });
      for (const e of entries) {
        const fill = el('button', { className: 'ghost', textContent: 'Fill', title: 'Autofill active tab' });
        fill.addEventListener('click', () => void host.call('autofill', { id: e.id }));
        const copy = el('button', { className: 'ghost', textContent: 'Copy' });
        copy.addEventListener('click', async () => {
          const pw = await host.call<string | null>('reveal', { id: e.id });
          if (pw) await navigator.clipboard.writeText(pw);
          copy.textContent = 'Copied ✓';
          setTimeout(() => (copy.textContent = 'Copy'), 1000);
        });
        const edit = el('button', { className: 'ghost', textContent: '✎' });
        edit.addEventListener('click', () => void showForm(e.id));
        const del = el('button', { className: 'ghost', textContent: '🗑' });
        del.addEventListener('click', async () => {
          await host.call('remove', { id: e.id });
          await showList();
        });
        ul.append(
          el('li', {}, [
            el('span', { className: 'label' }, [
              el('div', { style: 'font-weight:600', textContent: e.title }),
              el('div', { className: 'muted', style: 'font-size:11px', textContent: e.username || e.url }),
            ]),
            fill,
            copy,
            edit,
            del,
          ]),
        );
      }
      listWrap.append(ul);
    };

    const showForm = async (id?: string) => {
      listWrap.replaceChildren();
      let current: { title: string; url: string; username: string; password: string } = {
        title: '',
        url: host.activeTab?.url ?? '',
        username: '',
        password: '',
      };
      if (id) {
        const entries = await host.call<ListEntry[]>('list');
        const e = entries.find((x) => x.id === id);
        const pw = (await host.call<string | null>('reveal', { id })) ?? '';
        if (e) current = { title: e.title, url: e.url, username: e.username, password: pw };
      }

      const title = input('Title', current.title);
      const url = input('URL', current.url);
      const username = input('Username', current.username);
      const password = input('Password', current.password);

      const gen = el('button', { className: 'ghost', textContent: 'Generate' });
      gen.addEventListener('click', async () => {
        const r = await host.call<{ password: string }>('generate', { opts: { length: 20, symbols: true } });
        (password.querySelector('input') as HTMLInputElement).value = r.password;
      });

      const save = el('button', { className: 'primary', textContent: 'Save', style: 'flex:1' });
      save.addEventListener('click', async () => {
        await host.call('save', {
          entry: {
            id,
            title: val(title),
            url: val(url),
            username: val(username),
            password: val(password),
          },
        });
        await showList();
      });
      const cancel = el('button', { className: 'ghost', textContent: 'Cancel' });
      cancel.addEventListener('click', () => void showList());

      formWrap.replaceChildren(
        title,
        url,
        username,
        el('div', { className: 'row' }, [password, gen]),
        el('div', { className: 'row', style: 'margin-top:8px' }, [save, cancel]),
      );
    };

    root.append(listWrap, formWrap);
    await showList();
  },
};

function input(label: string, value: string): HTMLElement {
  const inp = el('input', { type: 'text', value, placeholder: label, style: 'width:100%' });
  return el('div', { style: 'flex:1' }, [el('label', { textContent: label }), inp]);
}
function val(field: HTMLElement): string {
  return (field.querySelector('input') as HTMLInputElement).value.trim();
}

export default panel;
