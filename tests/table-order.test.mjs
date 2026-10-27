import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/**
 * 0.44.0: a narrow `DataTable`'s sort line and its rows' menus. The line ("Sort by") offers each sortable column in
 * both directions and the product's own order, and reports through the one `onchange` the header's sort uses, so
 * the product keeps both in its address alike; it follows the header, the address and a cleared search, and is
 * hidden while the table draws no rows. `menu(row)` draws a menu column (L6): each row's "More actions for {name}",
 * read again when it opens, an empty cell for a row with none, released with each drawing. Where they show, the
 * reveal and the narrow line are drawn by the stylesheet, read here from its rules; the browser checks place them.
 */
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ui = await import('@beyond-js/ui/dom');
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const react = await import('@beyond-js/ui/react');
const h = React.createElement;
const { act, StrictMode } = React;
after(() => page.close());
beforeEach(() => page.reset());

const machines = [{ id: 'm0', name: 'web', size: 'Standard', conversations: 4 }, { id: 'm1', name: 'lab', size: 'Small', conversations: 0 }, { id: 'm2', name: 'api', size: 'Standard', conversations: 2 }];
const columns = [{ key: 'name', label: 'Name', sort: true }, { key: 'size', label: 'Size' }, { key: 'conversations', label: 'Conversations', align: 'end', sort: true }];
const names = root => [...root.querySelectorAll('tbody tr th')].map(cell => cell.textContent);
const make = (options = {}) => new ui.DataTable({ label: 'Machines', columns, rows: machines, search: false, ...options }).mount(document.body);
const choose = (select, value) => {
	select.value = value;
	select.dispatchEvent(new page.window.Event('change'));
};
const order = root => root.querySelector('.bui-data-order');

test('the sort line offers each sortable column both ways and the product\'s order, labelled, before the rows', () => {
	const table = make();
	const line = order(table.element);
	const select = line.querySelector('select');
	assert.equal(line.querySelector(`label[for="${select.id}"]`).textContent, 'Sort by');
	assert.deepEqual([...select.options].map(option => option.textContent), ['Default order', 'Name, ascending', 'Name, descending', 'Conversations, ascending', 'Conversations, descending']);
	assert.equal(select.value, '', 'nothing sorted shows the product\'s order');
	assert.equal(line.hidden, false, 'shown while rows are drawn (the stylesheet shows it only on the narrow form)');
	assert.ok(line.compareDocumentPosition(table.element.querySelector('.bui-data-body')) & page.window.Node.DOCUMENT_POSITION_FOLLOWING, 'above the rows');
	table.destroy();
	const plain = new ui.DataTable({ label: 'Machines', columns: columns.map(({ sort, ...column }) => column), rows: machines }).mount(document.body);
	assert.equal(order(plain.element), null, 'a table with no sortable column draws no line');
	plain.destroy();
});

test('choosing an order reports what the header reports, sorts the rows and keeps the header in step', () => {
	const changes = [];
	const table = make({ onchange: state => changes.push(state) });
	const select = order(table.element).querySelector('select');
	choose(select, 'descending:conversations');
	assert.deepEqual(changes.at(-1), { query: '', sort: 'conversations', direction: 'descending', page: 1 });
	assert.deepEqual(names(table.element), ['web', 'api', 'lab']);
	assert.equal(table.element.querySelectorAll('thead th')[2].getAttribute('aria-sort'), 'descending', 'the header says the same order');
	table.element.querySelector('thead th button').click();
	assert.equal(select.value, 'ascending:name', 'a header sort shows in the line');
	assert.deepEqual(changes.at(-1), { query: '', sort: 'name', direction: 'ascending', page: 1 }, 'both report one shape');
	choose(select, '');
	assert.deepEqual(changes.at(-1), { query: '', sort: null, direction: 'ascending', page: 1 }, 'the product\'s order again');
	assert.deepEqual(names(table.element), ['web', 'lab', 'api']);
	table.destroy();
});

test('a state restored from the address shows in the line without being reported; an unknown sort shows the product\'s order', () => {
	const changes = [];
	const table = make({ state: { sort: 'name', direction: 'descending' }, onchange: state => changes.push(state) });
	const select = order(table.element).querySelector('select');
	assert.equal(select.value, 'descending:name');
	table.state = { sort: 'conversations', direction: 'ascending' };
	assert.equal(select.value, 'ascending:conversations');
	table.state = { sort: 'size' };
	assert.equal(select.value, '', 'a column that does not sort is not an order');
	assert.equal(changes.length, 0);
	table.destroy();
});

test('the line is hidden while the table draws no rows: loading, a failure, nothing at all', () => {
	const table = make();
	const line = order(table.element);
	table.status = 'loading';
	assert.equal(line.hidden, true);
	table.status = { failed: null };
	assert.equal(line.hidden, true);
	table.rows = [];
	assert.equal(line.hidden, true);
	table.rows = machines;
	assert.equal(line.hidden, false);
	table.destroy();
});

test('menu: a column of its own, each row\'s menu named by the row, an empty cell for a row with no actions', () => {
	const ran = [];
	const table = make({ menu: row => (row.conversations ? [{ label: 'Rename…', run: () => ran.push(row.id) }, null] : []), group: { by: row => row.size } });
	const head = [...table.element.querySelectorAll('thead th')].at(-1);
	assert.ok(head.classList.contains('bui-data-menu'));
	assert.equal(head.querySelector('.bui-hidden').textContent, 'Actions', 'its header is named for assistive technology only');
	assert.equal(table.element.querySelector('.bui-data-group th').getAttribute('colspan'), '4', 'a group heading spans the menu column too');
	const cells = [...table.element.querySelectorAll('tbody tr:not(.bui-data-group) > td.bui-data-menu')];
	assert.equal(cells.length, 3);
	const named = cells.map(cell => cell.querySelector('.bui-menu-button')?.getAttribute('aria-label') ?? null);
	assert.deepEqual(named.sort(), ['More actions for api', 'More actions for web', null].sort());
	const empty = cells.find(cell => !cell.querySelector('.bui-menu-button'));
	assert.ok(empty.hasAttribute('data-empty'), 'a row with no actions leaves its cell empty');
	assert.equal(empty.parentElement.querySelector('th').textContent, 'lab');
	table.destroy();
});

test('menu: its items are read again each time it opens, and a press runs the product\'s action', () => {
	let label = 'Rename…';
	const ran = [];
	const table = make({ menu: row => [{ label, run: () => ran.push(row.id) }] });
	const button = table.element.querySelector('tbody tr .bui-menu-button');
	label = 'Rename web…';
	button.click();
	const item = document.querySelector('.bui-menu:not([hidden]) [role="menuitem"]');
	assert.equal(item.textContent, 'Rename web…', 'the latest items');
	item.click();
	assert.deepEqual(ran, ['m0']);
	table.destroy();
});

test('menu: Spanish names it; the menus of a drawing are released when the rows are drawn again', () => {
	const table = make({ menu: () => [{ label: 'Renombrar…' }], labels: ui.DataTable.labels.es });
	assert.equal(table.element.querySelector('tbody .bui-menu-button').getAttribute('aria-label'), 'Más acciones de web');
	assert.equal(table.element.querySelector('thead .bui-data-menu').textContent, 'Acciones');
	assert.equal(order(table.element).querySelector('label').textContent, 'Ordenar por');
	assert.deepEqual([...order(table.element).querySelectorAll('option')].slice(0, 2).map(option => option.textContent), ['Orden predeterminado', 'Name, ascendente']);
	const before = table.element.querySelector('tbody .bui-menu-button');
	table.rows = [...machines];
	assert.notEqual(table.element.querySelector('tbody .bui-menu-button'), before, 'drawn again');
	table.destroy();
});

test('React DataTable: menu items as ActionMenu takes them, the latest onSelect; the sort line reports through onChange', async () => {
	const host = document.body.appendChild(document.createElement('div'));
	const root = createRoot(host);
	const ran = [];
	const changes = [];
	const render = tag => h(StrictMode, null, h(react.DataTable, { label: 'Machines', columns, rows: machines, search: false, onChange: state => changes.push(state), menu: row => [{ label: 'Rename…', onSelect: () => ran.push(`${tag}:${row.id}`) }] }));
	await act(() => root.render(render('first')));
	await act(() => root.render(render('second')));
	const button = host.querySelector('tbody tr .bui-menu-button');
	assert.equal(button.getAttribute('aria-label'), 'More actions for web');
	await act(() => button.click());
	await act(() => document.querySelector('.bui-menu:not([hidden]) [role="menuitem"]').click());
	assert.deepEqual(ran, ['second:m0'], 'the latest props');
	await act(() => choose(host.querySelector('.bui-data-order select'), 'ascending:name'));
	assert.deepEqual(changes.at(-1), { query: '', sort: 'name', direction: 'ascending', page: 1 });
	await act(() => root.unmount());
});

test('the built stylesheet: the line shows only on the narrow form, a row\'s menu reveals as a list row\'s and stays beside the name', () => {
	const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
	assert.match(sheet, /\.bui-data-order \{\s*display: none;/, 'hidden on the wide form');
	const narrow = sheet.slice(sheet.indexOf('@container bui-data (max-width: 36rem)'));
	assert.match(narrow, /\.bui-data-order:not\(\[hidden\]\) \{\s*display: flex;/, 'shown on the narrow form');
	assert.match(sheet, /\.bui-row:not\(:hover, :focus-within\) > \.bui-row-end > \.bui-menu-holder:not\(:has\(\[aria-expanded='true'\]\)\),\s*\.bui-data tbody > tr:not\(:hover, :focus-within\) > \.bui-data-menu > \.bui-menu-holder:not\(:has\(\[aria-expanded='true'\]\)\) \{\s*opacity: 0;/, 'one reveal for a list row\'s menu and a table row\'s');
	assert.match(narrow, /\.bui-data tr:has\(> \.bui-data-menu\) > th\[scope='row'\] \{\s*flex: 1 1 0;\s*order: -2;/, 'the name first, sharing its line');
	assert.match(narrow, /\.bui-data tr:has\(> \.bui-data-menu\)::after \{\s*content: '';\s*flex-basis: 100%;\s*order: -1;/, 'the values below the name and the menu');
	assert.match(narrow, /\.bui-data td\.bui-data-menu \{[^}]*order: -1;/, 'the menu beside the name');
});
