import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** Column priority and list-detail (0.7.0, FAM-40): columns leave in a declared order and come back on request; a detail beside its list or alone. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const { ColumnFit } = await import('../src/dom/collection/columns.js');
after(() => page.close());
beforeEach(() => page.reset());

const rows = [
	{ id: 'r1', name: 'acme/web', branch: 'main', updated: '2 h ago', size: '12 MB', state: 'Ready' },
	{ id: 'r2', name: 'acme/api', branch: 'main', updated: 'yesterday', size: '4 MB', state: 'Cloning' }
];
const columns = [
	{ key: 'name', label: 'Repository', primary: true },
	{ key: 'state', label: 'State' },
	{ key: 'branch', label: 'Branch', priority: 1 },
	{ key: 'updated', label: 'Updated', priority: 2 },
	{ key: 'size', label: 'Size', priority: 3, numeric: true }
];

test('ColumnFit.fit hides the highest priority number first until the rest fit, never the primary or an unranked column', () => {
	const priorities = [undefined, undefined, 1, 2, 3];
	const widths = [200, 100, 100, 100, 100];
	assert.deepEqual([...ColumnFit.fit({ available: 600, widths, priorities })], []);
	assert.deepEqual([...ColumnFit.fit({ available: 500, widths, priorities })], [4]);
	assert.deepEqual([...ColumnFit.fit({ available: 350, widths, priorities })], [4, 3, 2]);
	assert.deepEqual([...ColumnFit.fit({ available: 100, widths, priorities })], [4, 3, 2], 'what cannot leave stays, and the table scrolls');
	assert.deepEqual([...ColumnFit.fit({ available: 100, widths: [100, 100], priorities: [5, 1], fixed: 0 })], [1], 'the primary stays even with a priority');
});

test('a collection hides its lowest-priority columns in a narrow region and reveals them on request, kept across pages', async () => {
	const collection = new ui.Collection({ label: 'Repositories', columns, source: ui.Collection.local(rows), search: false, limit: 1 }).mount(document.body);
	await page.until(() => collection.element.querySelector('table'));
	const toggle = collection.element.querySelector('.bui-collection-columns');
	assert.equal(toggle.hidden, true, 'nothing measured, nothing hidden');
	// The region is 420 px; the columns need 200, 100, 100, 100 and 100.
	const body = collection.element.querySelector('.bui-collection-body');
	Object.defineProperty(body, 'clientWidth', { value: 420, configurable: true });
	const widths = [200, 100, 100, 100, 100];
	const proto = window.HTMLTableCellElement.prototype;
	const saved = proto.getBoundingClientRect;
	proto.getBoundingClientRect = function () {
		return { width: this.tagName === 'TH' && this.closest('thead') ? widths[this.cellIndex] : 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 };
	};
	await collection.load();
	const hidden = () => [...collection.element.querySelectorAll('thead th')].filter(cell => cell.hasAttribute('data-bui-hidden')).map(cell => cell.textContent);
	assert.deepEqual(hidden(), ['Updated', 'Size']);
	assert.ok([...collection.element.querySelectorAll('tbody tr')].every(row => row.cells[3].hasAttribute('data-bui-hidden') && !row.cells[2].hasAttribute('data-bui-hidden')), 'a hidden column leaves every row');
	assert.equal(toggle.hidden, false);
	assert.equal(toggle.textContent, 'Show 2 more columns');
	assert.equal(toggle.getAttribute('aria-expanded'), 'false');
	toggle.click();
	assert.deepEqual(hidden(), []);
	assert.equal(toggle.textContent, 'Show fewer columns');
	assert.equal(toggle.getAttribute('aria-expanded'), 'true');
	collection.element.querySelector('.bui-pager button:last-child').click();
	await page.until(() => collection.state.page === 2 && collection.element.querySelector('tbody td')?.textContent === 'acme/api');
	assert.deepEqual(hidden(), [], 'the choice is kept on the next page');
	toggle.click();
	assert.deepEqual(hidden(), ['Updated', 'Size']);
	proto.getBoundingClientRect = saved;
	collection.destroy();
	const spanish = new ui.Collection({ label: 'Repositorios', columns, source: ui.Collection.local([]), labels: ui.Collection.labels.es }).mount(document.body);
	await page.until(() => spanish.element.querySelector('.bui-empty'));
	assert.equal(spanish.element.querySelector('.bui-empty-title').textContent, 'Todavía no hay nada aquí.');
	spanish.destroy();
});

test('ListDetail: the list alone, then the detail with its way back to the list; the product\'s navigation takes a plain click', () => {
	const navigations = [];
	const list = Object.assign(document.createElement('ul'), { className: 'repositories' });
	const split = new ui.ListDetail({ list, label: 'Repository', back: { label: 'Repositories', href: '?project=prj_1&view=repositories', onnavigate: event => navigations.push(event.type) } }).mount(document.body);
	assert.equal(split.open, false);
	assert.equal(split.element.querySelector('.bui-listdetail-detail').hidden, true);
	const detail = Object.assign(document.createElement('div'), { textContent: 'acme/web' });
	split.detail = detail;
	assert.equal(split.open, true);
	assert.ok(split.element.hasAttribute('data-open'));
	const region = split.element.querySelector('.bui-listdetail-detail');
	assert.equal(region.getAttribute('aria-label'), 'Repository');
	const back = region.querySelector('a.bui-listdetail-link');
	assert.equal(back.getAttribute('href'), '?project=prj_1&view=repositories');
	assert.equal(back.textContent, 'Repositories');
	back.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
	assert.deepEqual(navigations, ['click']);
	back.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, metaKey: true }));
	assert.equal(navigations.length, 1, 'a new tab keeps the address');
	split.focus();
	assert.ok(document.activeElement === region);
	split.back = null;
	assert.equal(region.querySelector('.bui-listdetail-back').childElementCount, 0);
	split.detail = null;
	assert.equal(split.open, false);
	assert.ok(split.element.contains(list));
	split.destroy();
});
