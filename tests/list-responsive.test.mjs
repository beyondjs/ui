import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';
import { records, columns, object } from './fixtures/list-responsive.mjs';

const page = new Page();
const { ListRow, DataTable } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());
const sheet = name => readFileSync(new URL(`../src/styles/${name}.css`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

test('object rows retain name, machine context, all facts and independent action targets', () => {
	const row = new ListRow(object).mount(document.body);
	assert.equal(row.element.querySelector('.bui-row-main').textContent, object.title + object.meta);
	assert.deepEqual([...row.element.querySelectorAll('.bui-row-fact')].map(node => node.textContent), object.facts);
	assert.equal(row.element.querySelector('.bui-row-title').getAttribute('href'), object.href);
	assert.equal(row.element.querySelector('.bui-row-title button'), null);
	assert.equal(row.element.querySelector('.bui-row-actions button').textContent, 'Open files');
	assert.equal(row.element.querySelector('.bui-row-end').hidden, false);
	row.destroy();
});

test('comparative records keep distinct labels, real headers, summaries and empty markers', () => {
	const table = new DataTable({ label: 'Members', columns, rows: records, search: false }).mount(document.body);
	const cells = [...table.element.querySelectorAll('tbody td')];
	assert.deepEqual(cells.map(cell => cell.dataset.label), ['Joined', 'Last active', 'Work', 'Missing']);
	assert.deepEqual(cells.slice(0, 2).map(cell => cell.textContent), ['12 October 2026', '20 October 2026']);
	assert.equal(cells[0].hasAttribute('data-summary'), false);
	assert.equal(cells[1].hasAttribute('data-summary'), false);
	assert.equal(cells[2].hasAttribute('data-summary'), true);
	assert.equal(cells[3].hasAttribute('data-empty'), true);
	assert.deepEqual([...table.element.querySelectorAll('thead th[scope="col"]')].map(cell => cell.textContent), columns.map(column => column.label));
	assert.equal(table.element.querySelector('tbody th').getAttribute('scope'), 'row');
	table.element.querySelector('thead button').click();
	assert.equal(table.state.sort, 'joined');
	assert.equal(table.element.querySelector('tbody td').dataset.label, 'Joined');
	table.destroy();
});

test('DOM header content supplies its textual narrow label without duplicating its node', () => {
	const label = document.createElement('span');
	label.textContent = 'Last active';
	const table = new DataTable({ label: 'Members', columns: [columns[0], { key: 'active', label }], rows: records, search: false });
	assert.equal(table.element.querySelector('thead th:nth-child(2)').firstChild, label);
	assert.equal(table.element.querySelector('tbody td').dataset.label, 'Last active');
	table.destroy();
});

test('stylesheet source keeps narrow facts visible and allows long values to wrap', () => {
	const source = sheet('list');
	const narrow = source.slice(source.indexOf('@container bui-row (max-width: 30rem)'));
	const facts = narrow.match(/\.bui-row-fact\s*\{([^}]+)\}/)?.[1];
	assert.ok(facts);
	assert.doesNotMatch(facts, /display:\s*none|visibility:\s*hidden/);
	assert.match(facts, /white-space:\s*normal/);
	assert.match(facts, /overflow-wrap:\s*anywhere/);
	assert.match(facts, /max-width:\s*100%/);
	assert.match(narrow, /\.bui-row-end\s*\{[^}]*flex:\s*1 1 100%/);
});

test('stylesheet source labels narrow comparison values inline and excludes summaries and empties', () => {
	const source = sheet('table');
	const narrow = source.slice(source.indexOf('@container bui-data (max-width: 36rem)'));
	assert.match(narrow, /\.bui-data td\[data-label\]:not\(\[data-label=''\], \[data-summary\]\)::before\s*\{\s*content: attr\(data-label\) ': ';/);
	assert.match(narrow, /content: '· ' attr\(data-label\) ': ';/);
	assert.match(narrow, /\.bui-data td\[data-empty\]\s*\{\s*display: none;/);
	assert.match(narrow, /\.bui-data tr\s*\{[^}]*display: flex;[^}]*flex-wrap: wrap;/);
	assert.doesNotMatch(narrow, /\.bui-data td[^}]*display:\s*block/);
	assert.match(narrow, /\.bui-data td\s*\{[^}]*max-width: 100%;[^}]*overflow-wrap: anywhere;/);
});


test('stylesheet source raises interactive slot content above the stretched row link', () => {
	const source = sheet('list');
	const selector = '.bui-row :is(.bui-row-lead, .bui-row-meta, .bui-row-end) :is(a, button, input, select, textarea, summary, label, [tabindex], .bui-tooltip-anchor)';
	const rule = source.slice(source.indexOf(selector)).split('}')[0];
	assert.ok(source.includes(selector));
	assert.match(rule, /position: relative;/);
	assert.match(rule, /z-index: 1;/);
	const meta = document.createElement('span');
	for (const tag of ['a', 'button', 'input', 'select', 'textarea', 'summary', 'label', 'span']) {
		const control = document.createElement(tag);
		if (tag === 'span') control.tabIndex = 0;
		meta.append(control);
	}
	const anchor = document.createElement('span');
	anchor.className = 'bui-tooltip-anchor';
	meta.append(anchor);
	const row = new ListRow({ ...object, meta }).mount(document.body);
	assert.equal([...meta.children].every(control => control.matches(selector)), true);
	assert.equal(row.element.querySelector('.bui-row-title').matches(selector), false, 'the name retains the stretched row target');
	row.destroy();
});
