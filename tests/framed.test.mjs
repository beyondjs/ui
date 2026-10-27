import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/**
 * A DataTable at the top of a framed box (0.41.0, D184): `framed` in the DOM (option and setter) and in React marks
 * the table, and the stylesheet lifts its first capitals to the box's inset only with no tools above it: a wide
 * table by its header row's room, a narrow one by its first row's padding and half-leading, its scroller then
 * clipping nothing. Where the words land is measured in the browser (`checks/insets.mjs`, the cards).
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

const columns = [{ key: 'job', label: 'Job', primary: true }, { key: 'state', label: 'State' }];
const rows = [{ id: 'a', job: 'Prepare storefront', state: 'Running' }];

test('DataTable: framed marks the table, by its option and its setter; unframed by default', () => {
	const table = new ui.DataTable({ label: 'Jobs', columns, rows, search: false, framed: true }).mount(document.body);
	assert.equal(table.framed, true);
	assert.equal(table.element.hasAttribute('data-framed'), true);
	table.framed = false;
	assert.equal(table.element.hasAttribute('data-framed'), false);
	const plain = new ui.DataTable({ label: 'Jobs', columns, rows }).mount(document.body);
	assert.equal(plain.framed, false, 'a table on the page is not framed');
	table.destroy();
	plain.destroy();
});

test('React DataTable: framed follows the prop', async () => {
	const host = document.body.appendChild(document.createElement('div'));
	const root = createRoot(host);
	await act(() => root.render(h(StrictMode, null, h(react.DataTable, { label: 'Jobs', columns, rows, search: false, framed: true }))));
	assert.equal(host.querySelector('.bui-data-table').hasAttribute('data-framed'), true);
	await act(() => root.render(h(StrictMode, null, h(react.DataTable, { label: 'Jobs', columns, rows, search: false }))));
	assert.equal(host.querySelector('.bui-data-table').hasAttribute('data-framed'), false);
	await act(() => root.unmount());
});

test('the built stylesheet: a framed table lifts its first capitals only with no tools above it', () => {
	const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
	const tools = ':not(:has(> .bui-data-tools:not([hidden])))';
	assert.ok(sheet.includes(`.bui-data-table[data-framed]${tools} > .bui-data-body .bui-table {\n\t\tmargin-block-start: calc((1cap - var(--bui-row)) / 2);`), 'a wide table rises by its header row\'s room above the capitals');
	assert.ok(sheet.includes(`.bui-data-table[data-framed]${tools} > .bui-data-body .bui-data tbody > tr:first-child {\n\t\t\tmargin-block-start: calc(-1 * var(--space-2) - (1lh - 1cap) / 2);`), 'a narrow table lifts its first row');
	assert.match(sheet, /\.bui-data-table\[data-framed\] > \.bui-data-body \{\s*overflow: visible;/, 'a narrow framed table clips nothing');
	assert.doesNotMatch(sheet.replace(/\[data-framed\][^{]*\{[^}]*\}/g, ''), /margin-block-start: calc\(\(1cap - var\(--bui-row\)\) \/ 2\)/, 'no table outside a frame is lifted');
});

test('DataHead: a narrow table\'s hidden header leaves the Tab order, a wide one\'s comes back, after every drawing too (0.41.0, D187)', async () => {
	const { DataHead } = await import('../src/dom/table/head.js');
	const sortable = columns.map(column => ({ ...column, sort: true }));
	const table = new ui.DataTable({ label: 'Jobs', columns: sortable, rows, search: false }).mount(document.body);
	let width = 390;
	table.element.getBoundingClientRect = () => ({ width });
	const head = new DataHead(table.element);
	const indexes = () => [...table.element.querySelectorAll('thead button')].map(button => button.getAttribute('tabindex'));
	head.measure();
	assert.equal(head.narrow, true);
	assert.deepEqual(indexes(), ['-1', '-1'], 'out of the Tab order, still in the header');
	table.rows = [...rows, { id: 'b', job: 'Build', state: 'Done' }];
	head.apply();
	assert.deepEqual(indexes(), ['-1', '-1'], 'a drawing of the rows keeps them out');
	width = 1024;
	head.measure();
	assert.deepEqual(indexes(), [null, null], 'a wide table gives them back');
	head.destroy();
	table.destroy();
});
