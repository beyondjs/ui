import { DataTable, Collection, type DataTableState } from '@beyond-js/ui';

interface Machine { id: string; name: string; size: string; conversations: number; project: string }
const machines: Machine[] = [{ id: 'm1', name: 'web', size: 'Standard', conversations: 2, project: 'Storefront' }];
const table = new DataTable<Machine>({
	label: 'Machines',
	columns: [{ key: 'name', label: 'Name', sort: true, primary: true }, { key: 'size', label: 'Size' }, { key: 'conversations', label: 'Conversations', align: 'end', sort: (a, b) => a.conversations - b.conversations }, { key: 'id', label: 'Identifier', mono: true, render: row => row.id }],
	rows: machines,
	key: row => row.id,
	group: { by: row => row.project },
	state: { query: 'we', sort: 'name', direction: 'descending' },
	onchange: (state: DataTableState) => state.page,
	size: 25,
	link: row => `/machines/${row.id}`,
	empty: { title: 'No machine yet', action: { label: 'Create a machine', href: '/machines/new' } },
	// A row's actions in a menu column of its own (0.44.0)
	menu: row => [{ label: `Rename ${row.name}`, run: () => undefined }, row.conversations ? null : { label: 'Delete', tone: 'danger' }]
});
table.rows = [];
table.status = 'loading';
table.status = { failed: null };
const state: DataTableState = table.state;
const list = new Collection<Machine>({ label: 'Machines', presentation: 'list', columns: [{ key: 'name', label: 'Name' }, { key: 'size', label: 'Size', end: true }], source: async () => ({ rows: machines }) });
export { state, list };
