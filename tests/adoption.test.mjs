import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';
import { inside } from './fixtures/family.mjs';

/** 0.16.2: what the products' adoptions of 0.16.1 found: the bar's organizations without projects, a narrow ListRow, a narrow DataTable's empty cells and React cells drawn again. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const react = await import('@beyond-js/ui/react');
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
after(() => page.close());
beforeEach(() => page.reset());

const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rule = selector => [...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, names]) => names.split(',').map(name => name.trim()).includes(selector)).map(([, , body]) => body).join('\n');

test('a product without projects still carries its organizations in the product menu (a merged bar under 380 px folds the location there)', () => {
	const bar = new ui.FamilyBar({ product: 'accounts', brand: { src: '/w.svg', href: '/' }, descriptor: inside, projects: false }).mount(document.body);
	const carried = bar.element.querySelector('.bui-family-brand .bui-family-carried');
	assert.ok(carried, 'the organizations travel with the product menu');
	assert.match(carried.textContent, /Northwind/);
	assert.doesNotMatch(carried.textContent, /Storefront/, 'and no project');
	bar.destroy();
});

test('a narrow ListRow lets its end shrink and wrap under the name', () => {
	assert.match(rule('.bui-row'), /flex-wrap:\s*wrap/);
	assert.match(rule('.bui-row-end'), /flex:\s*0 1 auto/);
	assert.match(rule('.bui-row-end'), /min-width:\s*0/);
	assert.match(sheet, /@container bui-row \(max-width: 30rem\)\s*\{\s*\.bui-row-end\s*\{[^}]*flex:\s*1 1 100%/);
});

test('a narrow DataTable leaves out empty cells and their separators', () => {
	const table = new ui.DataTable({ label: 'Machines', columns: [{ key: 'name', label: 'Name' }, { key: 'size', label: 'Size' }, { key: 'note', label: 'Note' }, { key: 'zone', label: 'Zone' }], rows: [{ id: 'a', name: 'web', size: '', note: null, zone: 'us-east' }] }).mount(document.body);
	const cells = [...table.element.querySelectorAll('tbody td')];
	assert.deepEqual(cells.map(cell => cell.hasAttribute('data-empty')), [true, true, false]);
	assert.match(sheet, /\.bui-data td\[data-empty\]\s*\{[^}]*display:\s*none/);
	assert.match(sheet, /\.bui-data td:not\(\[data-empty\], \.bui-data-menu\) ~ td:not\(\[data-empty\]\)::before\s*\{[^}]*content:\s*'· '/);
	assert.doesNotMatch(sheet, /\.bui-data td:not\(:last-child\)::after/);
	table.destroy();
});

test('React DataTable draws a cell again when only its content changes, keyed by row and column', async () => {
	const host = document.createElement('div');
	document.body.append(host);
	const root = createRoot(host);
	const rows = [{ id: 'a', name: 'web' }, { id: 'b', name: 'lab' }];
	const draw = busy => React.act(() => root.render(React.createElement(react.DataTable, { label: 'Machines', rows, rowKey: row => row.id, columns: [{ key: 'name', label: 'Name' }, { key: 'state', label: 'State', render: row => React.createElement('em', null, busy.includes(row.id) ? 'Busy' : 'Ready') }] })));
	await draw([]);
	const states = () => [...host.querySelectorAll('tbody td em')].map(node => node.textContent);
	assert.deepEqual(states(), ['Ready', 'Ready']);
	await draw(['b']);
	assert.deepEqual(states(), ['Ready', 'Busy'], 'the same rows, a cell changed');
	await React.act(() => root.unmount());
});
