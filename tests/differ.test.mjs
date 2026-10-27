import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { copies } from './fixtures/copies.mjs';

/** 0.44.0 (D162 L3): a row says what differs among the rows in view, through one shared `Differ`. */
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const dom = await import('@beyond-js/ui/dom');
const ui = await import('@beyond-js/ui/react');
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const { act } = React;
after(() => page.close());
beforeEach(() => page.reset());

const columns = [{ key: 'name', label: 'Copy', primary: true }];
const metas = element => [...element.querySelectorAll('.bui-row-meta')].map(meta => (meta.hidden ? '' : meta.textContent));
const own = (row, { differ }) => ({ meta: [differ.in(each => each.machine) ? row.machine : null, differ.in(each => each.author) ? row.author : null] });

test('Differ answers whether rows hold two values or more; empty values never differ', () => {
	assert.equal(dom.Differ.of(copies, row => row.machine), true);
	assert.equal(dom.Differ.of(copies, row => row.author), false, 'one author, and rows with none, share it');
	const differ = new dom.Differ(copies.slice(0, 2));
	assert.equal(differ.in(row => row.machine), false);
	assert.equal(differ.in(row => row.name), true);
	assert.equal(new dom.Differ([]).in(row => row.machine), false);
	assert.equal(new dom.Differ(null).in(() => 'x'), false, 'no rows differ in nothing');
	assert.equal(dom.Differ.of([{ size: 0 }, { size: '' }, { size: false }], row => row.size), true, 'only null, undefined and the empty text are empty');
	assert.equal(ui.Differ, dom.Differ);
});

test('Collection gives its row option a Differ of the rows drawn, page by page', async () => {
	const list = new dom.Collection({ label: 'Copies', presentation: 'list', columns, limit: 2, source: dom.Collection.local(copies), row: own }).mount(document.body);
	await page.until(() => list.element.querySelectorAll('.bui-row').length === 2);
	assert.deepEqual(metas(list.element), ['', ''], 'the first page shares its machine and its author: neither is said');
	list.element.querySelector('.bui-pager button:last-of-type').click();
	await page.until(() => list.element.querySelector('.bui-row-title')?.textContent === copies[2].name);
	assert.deepEqual(metas(list.element), copies.slice(2, 4).map(row => row.machine), 'the next page differs in its machine');
	list.destroy();
});

test('React Collection passes the same context to its latest row prop', async () => {
	const host = document.body.appendChild(document.createElement('div'));
	const root = createRoot(host);
	const seen = [];
	await act(() => root.render(React.createElement(ui.Collection, { label: 'Copies', presentation: 'list', columns, source: dom.Collection.local(copies), row: (row, context) => (seen.push(context.differ instanceof dom.Differ), own(row, context)) })));
	await act(() => page.until(() => host.querySelectorAll('.bui-row').length === copies.length));
	assert.ok(seen.length && seen.every(Boolean));
	assert.deepEqual(metas(host), copies.map(row => row.machine));
	await act(() => root.unmount());
});
