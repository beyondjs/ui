import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/**
 * 0.35.0: a React `DataTable` cell whose content renders nothing (no text, no element) is empty, as the DOM
 * table reads a value, so a narrow line leaves out its label and its separator; found by the Packages
 * interface, whose narrow lines kept an empty cell's label and began a wrapped line with "· ". The narrow
 * line is read here as the stylesheet draws it, from its own rules: shown cells, each label and each
 * separator. Also run on React 18.
 */
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
const dom = await import('@beyond-js/ui/dom');
const h = React.createElement;
const { act, StrictMode, useState } = React;
let root = null;
let host = null;

after(() => page.close());
beforeEach(async () => {
	if (root) await act(() => root.unmount());
	page.reset();
	host = document.createElement('div');
	document.body.append(host);
	root = createRoot(host);
});

const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const narrow = sheet.slice(sheet.indexOf('@container bui-data (max-width: 36rem)'));
/** The narrow block's rule for `selector`, which must exist: what the line is read with below. */
const rule = selector => {
	const at = narrow.indexOf(`${selector} {`);
	assert.ok(at !== -1, `the narrow line keeps ${selector}`);
	return narrow.slice(at, narrow.indexOf('}', at));
};
const hidden = '.bui-data td[data-empty]';
const labelled = ".bui-data td[data-label]:not([data-label=''], [data-summary])::before";
const parted = '.bui-data td:not([data-empty]) ~ td:not([data-empty])::before';
const both = ".bui-data td:not([data-empty]) ~ td[data-label]:not([data-empty], [data-label=''], [data-summary])::before";
assert.match(rule(hidden), /display:\s*none/);
assert.match(rule(labelled), /content:\s*attr\(data-label\) ': '/);
assert.match(rule(parted), /content:\s*'· '/);
assert.match(rule(both), /content:\s*'· ' attr\(data-label\) ': '/);
const element = selector => selector.replace('.bui-data ', '').replace('::before', '');

/** A row's narrow line of secondary values, as the rules above draw it: the later matching rule wins. */
function line(row) {
	return [...row.querySelectorAll('td')]
		.filter(cell => !cell.matches(element(hidden)))
		.map(cell => {
			const before = cell.matches(element(both)) ? `· ${cell.dataset.label}: ` : cell.matches(element(parted)) ? '· ' : cell.matches(element(labelled)) ? `${cell.dataset.label}: ` : '';
			return `${before}${cell.textContent}`;
		})
		.join(' ');
}

const columns = [
	{ key: 'name', label: 'Application', primary: true },
	{ key: 'branch', label: 'Branch', render: row => (row.branch ? h('code', null, row.branch) : null) },
	{ key: 'state', label: 'State', summary: true, render: row => (row.failed ? h('span', null, 'Failed') : '') },
	{ key: 'zone', label: 'Zone' }
];
const rows = [
	{ id: 'a', name: 'checkout', branch: 'main', failed: true, zone: 'us-east' },
	{ id: 'b', name: 'storefront', branch: null, failed: false, zone: 'eu-west' }
];

test('a React cell that renders nothing is empty: the narrow line leaves out its label and its separator', async () => {
	await act(() => root.render(h(StrictMode, null, h(ui.DataTable, { label: 'Applications', rows, columns, rowKey: row => row.id }))));
	const [full, sparse] = host.querySelectorAll('tbody tr');
	assert.deepEqual([...sparse.querySelectorAll('td')].map(cell => cell.hasAttribute('data-empty')), [true, true, false], 'the branch and the state rendered nothing');
	assert.deepEqual([...full.querySelectorAll('td')].map(cell => cell.hasAttribute('data-empty')), [false, false, false]);
	assert.equal(line(full), 'Branch: main · Failed · Zone: us-east');
	assert.equal(line(sparse), 'Zone: eu-west', 'no label without its value, and the line does not start with a separator');
});

test("a React cell's content that appears or goes later is read again", async () => {
	let show = null;
	function Late() {
		const [shown, setShown] = useState(false);
		show = setShown;
		return shown ? h('span', null, 'Deploying') : null;
	}
	await act(() => root.render(h(ui.DataTable, { label: 'Applications', rows: [rows[1]], rowKey: row => row.id, columns: [columns[0], { key: 'now', label: 'Now', render: () => h(Late) }, columns[3]] })));
	const row = host.querySelector('tbody tr');
	assert.equal(line(row), 'Zone: eu-west');
	await act(async () => show(true));
	await page.until(() => !row.querySelector('td').hasAttribute('data-empty'));
	assert.equal(line(row), 'Now: Deploying · Zone: eu-west');
	await act(async () => show(false));
	await page.until(() => row.querySelector('td').hasAttribute('data-empty'));
	assert.equal(line(row), 'Zone: eu-west');
});

test('the DOM table reads its own values so, and keeps a cell whose content is an element', () => {
	const table = new dom.DataTable({ label: 'Applications', columns: [{ key: 'name', label: 'Application', primary: true }, { key: 'branch', label: 'Branch' }, { key: 'mark', label: 'Mark', render: () => Object.assign(document.createElement('img'), { alt: '' }) }, { key: 'zone', label: 'Zone' }], rows: [{ id: 'b', name: 'storefront', branch: '', zone: 'eu-west' }] }).mount(document.body);
	const row = table.element.querySelector('tbody tr');
	assert.deepEqual([...row.querySelectorAll('td')].map(cell => cell.hasAttribute('data-empty')), [true, false, false], 'an image is content');
	assert.equal(line(row), 'Mark:  · Zone: eu-west');
	table.destroy();
});

test('the DOM and React tables read a cell alike: spaces and a childless span are nothing, an input or an image is content', async () => {
	const { CellContent } = await import('../src/dom/table/cell.js');
	const make = (tag, attributes = {}) => Object.assign(document.createElement(tag), attributes);
	const cases = [
		{ name: 'spaces', dom: '   ', react: () => '   ', empty: true },
		{ name: 'a bare dot', dom: make('span', { className: 'bui-status-dot' }), react: () => h('span', { className: 'bui-status-dot' }), empty: true },
		{ name: 'a field', dom: make('input', { 'aria-label': 'Port' }), react: () => h('input', { 'aria-label': 'Port', readOnly: true }), empty: false },
		{ name: 'an image', dom: make('img', { alt: '' }), react: () => h('img', { alt: '' }), empty: false },
		{ name: 'words', dom: 'us-east', react: () => h('em', null, 'us-east'), empty: false }
	];
	for (const item of cases) {
		assert.equal(CellContent.empty(item.dom), item.empty, `the DOM table: ${item.name}`);
		const table = new dom.DataTable({ label: 'Machines', columns: [{ key: 'name', label: 'Name', primary: true }, { key: 'value', label: 'Value', render: () => item.dom }], rows: [{ id: 'a', name: 'web' }] }).mount(document.body);
		assert.equal(table.element.querySelector('tbody td').hasAttribute('data-empty'), item.empty, `the DOM table draws it so: ${item.name}`);
		table.destroy();
		await act(() => root.render(h(ui.DataTable, { label: 'Machines', rows: [{ id: 'a', name: 'web' }], columns: [{ key: 'name', label: 'Name', primary: true }, { key: 'value', label: 'Value', render: item.react }] })));
		assert.equal(host.querySelector('tbody td').hasAttribute('data-empty'), item.empty, `React's table: ${item.name}`);
	}
});

test("a change in one React cell reads that cell again, not every cell", async () => {
	const { CellContent } = await import('../src/dom/table/cell.js');
	let show = null;
	function Late() {
		const [shown, setShown] = useState(false);
		show = setShown;
		return shown ? 'Deploying' : null;
	}
	const many = Array.from({ length: 20 }, (_, index) => ({ id: `r${index}`, name: `app-${index}` }));
	await act(() => root.render(h(ui.DataTable, { label: 'Applications', rows: many, rowKey: row => row.id, columns: [columns[0], { key: 'now', label: 'Now', render: row => (row.id === 'r3' ? h(Late) : 'Ready') }] })));
	const held = CellContent.held;
	let reads = 0;
	CellContent.held = holder => (reads++, held.call(CellContent, holder));
	try {
		await act(async () => show(true));
		await page.until(() => !host.querySelector('tbody tr[data-key="r3"] td').hasAttribute('data-empty'));
		assert.ok(reads >= 1 && reads <= 2, `only the cell that changed is read again (${reads})`);
	} finally {
		CellContent.held = held;
	}
});
