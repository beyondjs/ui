import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * A complete list's end line for a list a product draws itself (0.39.0, L5): the markup `Collection`'s list
 * draws on its last page, its words in English and Spanish, the keys only when asked, and `Collection` still
 * drawing the same line through it.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

test('the end line says the list is whole, and the keys only when asked', () => {
	const line = new ui.EndLine().element;
	assert.equal(line.localName, 'p');
	assert.equal(line.className, 'bui-rows-end');
	assert.equal(line.textContent, 'Nothing more');
	assert.equal(line.querySelector('.bui-rows-keys'), null, 'no keys unless the rows open and the focus can move');
	const keyed = new ui.EndLine({ keys: true }).element;
	assert.equal(keyed.querySelector('.bui-keys.bui-rows-keys').textContent, '↑ ↓ to move · Enter to open');
});

test('the end line takes its own words, and Spanish', () => {
	assert.equal(new ui.EndLine({ text: 'Nothing older.' }).element.textContent, 'Nothing older.');
	const spanish = new ui.EndLine({ keys: true, labels: ui.EndLine.labels.es }).element;
	assert.equal(spanish.firstElementChild.textContent, 'No hay más');
	assert.equal(spanish.querySelector('.bui-rows-keys').textContent, '↑ ↓ para moverte · Enter para abrir');
	assert.deepEqual(Object.keys(ui.EndLine.labels.es), Object.keys(ui.EndLine.labels.en));
	const node = document.createElement('strong');
	node.textContent = '12 devices';
	assert.ok(new ui.EndLine({ text: node }).element.contains(node), 'a node is placed as given');
});

test('Collection\'s list draws the same line on its last page', async () => {
	const list = new ui.Collection({
		label: 'Devices',
		presentation: 'list',
		columns: [{ key: 'name', label: 'Name', primary: true }],
		source: async () => ({ rows: [{ id: 'a', name: 'Laptop' }, { id: 'b', name: 'Phone' }], more: false }),
		link: row => `#/d/${row.id}`,
		delay: 0
	}).mount(document.body);
	await page.until(() => list.element.querySelector('.bui-rows-end'));
	const line = list.element.querySelector('.bui-rows-end');
	assert.equal(line.outerHTML, new ui.EndLine({ keys: true }).element.outerHTML);
	list.destroy();
});

test('the stylesheet lets the end line span a product\'s own list as it does Collection\'s', async () => {
	const { readFile } = await import('node:fs/promises');
	const css = await readFile(new URL('../src/styles/list-rules.css', import.meta.url), 'utf8');
	assert.match(css, /\.bui-collection-body > \.bui-rows-end,\s*\.bui-rows \+ \.bui-rows-end \{\s*max-width: none;/);
});
