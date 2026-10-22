import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** `DataTable` (0.15.0, DQ-12): search, sort, groups and pages over the product's rows, its state reported for the address and restored silently, its states told apart, its tools reachable when there is nothing. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const machines = Array.from({ length: 7 }, (_, index) => ({ id: `m${index}`, name: ['web', 'lab', 'api', 'docs', 'jobs', 'cache', 'edge'][index], size: index % 2 ? 'Small' : 'Standard', conversations: index * 3 % 5, project: index < 4 ? 'Storefront' : 'Analytics' }));
const columns = [{ key: 'name', label: 'Name', sort: true }, { key: 'size', label: 'Size' }, { key: 'conversations', label: 'Conversations', align: 'end', sort: true }, { key: 'id', label: 'Identifier', mono: true }];
const names = table => [...table.element.querySelectorAll('tbody tr:not(.bui-data-group) th')].map(cell => cell.textContent);
const make = (options = {}) => new ui.DataTable({ label: 'Machines', columns, rows: machines, delay: 0, ...options }).mount(document.body);
const type = async (table, text) => {
	const input = table.element.querySelector('input[type="search"]');
	input.value = text;
	input.dispatchEvent(new page.window.Event('input'));
	await new Promise(resolve => setTimeout(resolve, 5));
};

test('a compact search with its placeholder; what fits on one page shows no pager; the primary cell names the row', () => {
	const table = make({ link: row => `/machines/${row.id}` });
	const input = table.element.querySelector('input[type="search"]');
	assert.equal(input.placeholder, 'Search Machines');
	assert.ok(table.element.querySelector(`label[for="${input.id}"]`).classList.contains('bui-hidden'));
	assert.deepEqual(names(table), ['web', 'lab', 'api', 'docs', 'jobs', 'cache', 'edge']);
	assert.equal(table.element.querySelector('.bui-pager').childElementCount, 0, 'no "1–7 of 7" and no pager');
	assert.equal(table.element.querySelector('tbody th a.bui-row-link').getAttribute('href'), '/machines/m0');
	assert.ok(table.element.querySelector('td.bui-mono'), 'identifiers in mono');
	assert.ok(table.element.querySelector('td.bui-numeric'));
	assert.equal(table.element.querySelector('[role="status"]').textContent, '7 rows');
	table.destroy();
});

test('sort: headers that sort say so with aria-sort, ascending then descending, focus kept; the state is reported', () => {
	const changes = [];
	const table = make({ onchange: state => changes.push(state) });
	const header = () => table.element.querySelectorAll('thead th')[0];
	assert.equal(header().getAttribute('aria-sort'), 'none');
	assert.equal(table.element.querySelectorAll('thead th')[1].getAttribute('aria-sort'), null, 'a column that does not sort says nothing');
	header().querySelector('button').click();
	assert.equal(header().getAttribute('aria-sort'), 'ascending');
	assert.deepEqual(names(table), ['api', 'cache', 'docs', 'edge', 'jobs', 'lab', 'web']);
	assert.equal(document.activeElement, header().querySelector('button'), 'focus stays on the header');
	header().querySelector('button').click();
	assert.equal(header().getAttribute('aria-sort'), 'descending');
	assert.deepEqual(changes.at(-1), { query: '', sort: 'name', direction: 'descending', page: 1 });
	table.element.querySelectorAll('thead th')[2].querySelector('button').click();
	assert.deepEqual(names(table), ['web', 'cache', 'api', 'jobs', 'lab', 'edge', 'docs'], 'numbers as numbers, stable');
	table.destroy();
});

test('search filters by every column; no match is told apart from no data and clears; restoring a state reports nothing', async () => {
	const changes = [];
	const table = make({ onchange: state => changes.push(state) });
	await type(table, 'small');
	assert.deepEqual(names(table), ['lab', 'docs', 'cache']);
	assert.equal(changes.at(-1).query, 'small');
	await type(table, 'nothing like it');
	assert.equal(table.element.querySelector('.bui-empty').dataset.kind, 'match');
	assert.match(table.element.textContent, /Nothing matches “nothing like it”/);
	table.element.querySelector('.bui-empty .bui-button-quiet').click();
	assert.equal(names(table).length, 7);
	assert.equal(changes.at(-1).query, '');
	const reported = changes.length;
	table.state = { query: 'web', sort: 'name', direction: 'descending', page: 1 };
	assert.deepEqual(names(table), ['web']);
	assert.equal(table.element.querySelector('input[type="search"]').value, 'web');
	assert.equal(changes.length, reported, 'back and forward are not the person changing it');
	table.destroy();
});

test('groups with their count; pages past the size with a range; a page past the end shows the last', () => {
	const table = make({ group: { by: row => row.project }, size: 3 });
	const headings = () => [...table.element.querySelectorAll('.bui-data-group th')].map(cell => cell.textContent);
	assert.deepEqual(headings(), ['Storefront · 4']);
	assert.equal(table.element.querySelector('.bui-pager-summary').textContent, '1–3 of 7');
	const [previous, next] = table.element.querySelectorAll('.bui-pager button');
	assert.equal(previous.disabled, true);
	next.click();
	assert.deepEqual(headings(), ['Storefront · 4', 'Analytics · 3'], 'a group cut by a page keeps its heading and whole count');
	table.state = { page: 9 };
	assert.equal(table.state.page, 3);
	assert.equal(table.element.querySelector('.bui-pager-summary').textContent, '7–7 of 7');
	table.destroy();
});

test('no data: tools stay reachable, no headers or pager; loading and failure are said; Spanish', () => {
	const retries = [];
	const table = make({ rows: [], empty: { title: 'No machine yet', action: { label: 'Create a machine', run: () => {} } }, onretry: () => retries.push(1), labels: ui.DataTable.labels.es });
	assert.equal(table.element.querySelector('.bui-data-tools').hidden, false);
	assert.equal(table.element.querySelector('table'), null);
	assert.equal(table.element.querySelector('.bui-empty').dataset.kind, 'empty');
	assert.equal(table.element.querySelector('.bui-empty .bui-button-primary').textContent, 'Create a machine');
	table.status = 'loading';
	assert.ok(table.element.querySelector('.bui-skeleton-table'));
	assert.equal(table.element.querySelector('[role="status"]').textContent, 'Cargando Machines…');
	table.status = { failed: null };
	assert.equal(table.status, 'failed');
	assert.match(table.element.textContent, /No se pudo cargar esta lista/);
	table.element.querySelector('.bui-callout .bui-button').click();
	assert.deepEqual(retries, [1]);
	table.rows = machines;
	assert.equal(table.status, 'ready');
	assert.equal(names(table).length, 7);
	for (const key of Object.keys(ui.DataTable.labels.en)) assert.ok(key in ui.DataTable.labels.es, key);
	table.destroy();
	assert.equal(table.element.isConnected, false);
});

test('a row opened in place: the primary cell is a button; onopen takes plain clicks on links', () => {
	const opened = [];
	const table = make({ onopen: row => opened.push(row.id) });
	table.element.querySelector('tbody th button.bui-row-link').click();
	const linked = make({ link: row => `/m/${row.id}`, onopen: row => opened.push(`link ${row.id}`) });
	const link = linked.element.querySelector('tbody th a');
	link.dispatchEvent(new page.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, metaKey: true }));
	link.dispatchEvent(new page.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
	assert.deepEqual(opened, ['m0', 'link m0'], 'a new tab keeps the address');
	table.destroy();
	linked.destroy();
});

test('Collection: one page shows no range; presentation list draws ListRows', async () => {
	const list = new ui.Collection({ label: 'Machines', presentation: 'list', columns: [{ key: 'name', label: 'Name' }, { key: 'size', label: 'Size' }, { key: 'conversations', label: 'Conversations', end: true }], source: async () => ({ rows: machines.slice(0, 3), total: 3 }), link: row => `/m/${row.id}` }).mount(document.body);
	await page.until(() => list.element.querySelector('.bui-row'));
	const rows = [...list.element.querySelectorAll('.bui-collection-rows > .bui-row')];
	assert.equal(rows.length, 3);
	assert.equal(rows[0].querySelector('a.bui-row-title').textContent, 'web');
	assert.equal(rows[0].querySelector('.bui-row-meta').textContent, 'Standard');
	assert.equal(rows[0].querySelector('.bui-row-fact').textContent, '0');
	assert.equal(list.element.querySelector('.bui-pager').childElementCount, 0, 'no "1–3 of 3"');
	list.destroy();
});

test('React DataTable renders React cells, applies rows and state, and reports the person\'s changes', async () => {
	const react = await import('@beyond-js/ui/react');
	const { default: React } = await import('react');
	const { createRoot } = await import('react-dom/client');
	const h = React.createElement;
	const host = document.createElement('div');
	document.body.append(host);
	const root = createRoot(host);
	const changes = [];
	const draw = (rows, state = null) => React.act(() => root.render(h(react.DataTable, { label: 'Machines', rows, state, columns: [{ key: 'name', label: 'Name', sort: true, render: row => h('strong', null, row.name) }, { key: 'size', label: 'Size' }], onChange: next => changes.push(next) })));
	await draw(machines);
	assert.equal(host.querySelector('tbody th strong').textContent, 'web', 'a React cell through a portal');
	await draw(machines.slice(0, 2));
	assert.equal(host.querySelectorAll('tbody tr').length, 2);
	host.querySelector('thead button').click();
	assert.deepEqual(changes.at(-1), { query: '', sort: 'name', direction: 'ascending', page: 1 });
	await draw(machines.slice(0, 2), { sort: 'name', direction: 'descending' });
	assert.equal(host.querySelector('thead th').getAttribute('aria-sort'), 'descending');
	await React.act(() => root.unmount());
});
