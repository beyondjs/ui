import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { DataTable, ActionMenu, el } from '@beyond-js/ui';
import { columns, rows } from '../data/table-clearance.js';

window.fixture = { ready: false, chosen: null };
const actions = row => row.id === 'none' ? [] : [{ label: `Open ${row.name}`, run: () => { window.fixture.chosen = row.id; } }];
for (const mode of ['native', 'column']) {
	const own = { key: 'actions', label: 'Actions', menu: true, value: row => row.id === 'none' ? null : new ActionMenu({ label: null, name: `Actions for ${row.name}`, items: actions(row) }).element };
	const table = new DataTable({ label: `${mode} menus`, columns: mode === 'column' ? [...columns, own] : columns, rows, menu: mode === 'native' ? actions : null, search: false, framed: true });
	document.getElementById('root').append(el('section', { class: 'bui-raised', id: mode }, [table.element]));
}
window.fixture.ready = true;
