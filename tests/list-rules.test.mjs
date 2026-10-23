import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * The family's list rules (0.21.1, D162) in `Collection`'s list presentation: a row's own options over the
 * columns', consecutive rows grouped under their labels with each group a list it names, a search's words
 * marked in the names, the end line only on the last page, the arrow keys between rows and Down from the
 * search; `Recency` and `Matches` alone. Geometry is a browser's to prove (`acceptance/checks/auditing.mjs`).
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const day = 86400000;
const now = Date.parse('2026-10-23T09:00:00');
const rows = [
	{ id: 'c1', title: 'Fix the checkout total', state: 'attention', at: now - 3600000 },
	{ id: 'c2', title: 'Add retries to the webhook', state: 'running', at: now - 2 * 3600000 },
	{ id: 'c3', title: 'hola', state: 'done', at: now - day },
	{ id: 'c4', title: 'Set up the pipeline', state: 'done', at: now - 40 * day }
];
const recency = new ui.Recency({ now: () => now });
const make = (options = {}) =>
	new ui.Collection({
		label: 'Conversations',
		presentation: 'list',
		columns: [{ key: 'title', label: 'Title', primary: true }],
		source: async ({ query }) => ({ rows: rows.filter(row => row.title.toLowerCase().includes(query.toLowerCase())), more: false }),
		link: row => `#/c/${row.id}`,
		row: row => ({ lead: { state: row.state }, meta: ['web', 'main'], menu: [{ label: 'Pin', run: () => undefined }] }),
		group: recency.group(row => row.at),
		delay: 0,
		...options
	}).mount(document.body);

test('rows are grouped under their labels, each group a list named by its label, with the row\'s own lead and menu', async () => {
	const list = make();
	await page.until(() => list.element.querySelector('.bui-row'));
	const groups = [...list.element.querySelectorAll('.bui-rows-group')];
	assert.deepEqual(groups.map(group => group.querySelector('.bui-rows-label').textContent), ['Today', 'Yesterday', 'September']);
	for (const group of groups) assert.equal(group.querySelector('ul.bui-rows').getAttribute('aria-labelledby'), group.querySelector('.bui-rows-label').id);
	assert.ok(groups[0].querySelector('.bui-rows-label').hasAttribute('data-bui-label'), 'a group\'s label is a label by design');
	const first = groups[0].querySelector('.bui-row');
	assert.equal(first.querySelector('.bui-row-lead .bui-status').dataset.state, 'attention', 'the row\'s own lead');
	assert.equal(first.querySelector('.bui-row-meta').textContent, 'web · main', 'the row\'s own line');
	assert.ok(first.querySelector('.bui-row-end .bui-menu-button'), 'the row\'s own menu');
	assert.equal(first.querySelector('a.bui-row-title').getAttribute('href'), '#/c/c1', 'the columns still give the name and the link');
	list.destroy();
});

test('the last page ends with one end line, with the keys; a page with more after it has none, and so does an empty list', async () => {
	const list = make();
	await page.until(() => list.element.querySelector('.bui-row'));
	const end = list.element.querySelector('.bui-rows-end');
	assert.equal(end.firstChild.textContent, 'Nothing more');
	assert.ok(end.querySelector('.bui-keys'), 'the keys are a hint a touch screen hides');
	list.destroy();
	const more = make({ source: async () => ({ rows, more: true }) });
	await page.until(() => more.element.querySelector('.bui-row'));
	assert.equal(more.element.querySelector('.bui-rows-end'), null, 'more follows: nothing ends here');
	more.destroy();
	const own = make({ end: ({ count }) => `${count} conversations · nothing older` });
	await page.until(() => own.element.querySelector('.bui-rows-end'));
	assert.equal(own.element.querySelector('.bui-rows-end').firstChild.textContent, '4 conversations · nothing older', 'the product\'s words, with how many the list holds');
	own.destroy();
	const none = make({ source: async () => ({ rows: [], more: false }) });
	await page.until(() => none.element.querySelector('.bui-empty'));
	assert.equal(none.element.querySelector('.bui-rows-end'), null);
	none.destroy();
	const off = make({ end: false });
	await page.until(() => off.element.querySelector('.bui-row'));
	assert.equal(off.element.querySelector('.bui-rows-end'), null);
	off.destroy();
});

test('a search\'s words are marked in names given as text', async () => {
	const list = make({ state: { query: 'the' } });
	await page.until(() => list.element.querySelector('.bui-row'));
	const marks = [...list.element.querySelectorAll('.bui-row-title mark.bui-match')].map(mark => mark.textContent);
	assert.deepEqual(marks, ['the', 'the', 'the']);
	assert.equal(list.element.querySelector('.bui-row-title').textContent, 'Fix the checkout total', 'the name reads whole');
	list.destroy();
});

test('the arrow keys move between the rows\' names, and Down from the search reaches the first', async () => {
	const list = make();
	await page.until(() => list.element.querySelector('.bui-row'));
	const names = [...list.element.querySelectorAll('.bui-row-title')];
	const press = (target, key) => target.dispatchEvent(new page.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
	names[0].focus();
	press(names[0], 'ArrowDown');
	assert.equal(document.activeElement, names[1]);
	press(names[1], 'End');
	assert.equal(document.activeElement, names[3], 'across groups');
	press(names[3], 'ArrowDown');
	assert.equal(document.activeElement, names[3], 'the last keeps the focus');
	press(names[3], 'Home');
	assert.equal(document.activeElement, names[0]);
	press(names[0], 'ArrowUp');
	assert.equal(document.activeElement, names[0], 'the first keeps the focus');
	const search = list.tools.element.querySelector('input');
	search.focus();
	press(search, 'ArrowDown');
	assert.equal(document.activeElement, names[0], 'Down from the search');
	list.destroy();
});

test('Recency groups by calendar day, then by month, in either language', () => {
	const at = (text, hours = 12) => new Date(`${text}T${String(hours).padStart(2, '0')}:00:00`).getTime();
	const en = new ui.Recency({ now: () => at('2026-10-23', 9) });
	assert.equal(en.of(at('2026-10-23', 1)).label, 'Today');
	assert.equal(en.of(at('2026-10-24')).label, 'Today', 'ahead of the clock');
	assert.equal(en.of(at('2026-10-22', 23)).label, 'Yesterday');
	assert.equal(en.of(at('2026-10-16')).label, 'Previous 7 days');
	assert.equal(en.of(at('2026-09-23')).label, 'Previous 30 days');
	assert.equal(en.of(at('2026-09-01')).label, 'September');
	assert.equal(en.of(at('2025-08-01')).label, 'August 2025');
	assert.equal(en.of('not a date').label, 'Earlier');
	const es = new ui.Recency({ locale: 'es', labels: ui.Recency.labels.es, now: () => at('2026-10-23', 9) });
	assert.equal(es.of(at('2026-10-22')).label, 'Ayer');
	assert.equal(es.of(at('2026-09-01')).label, 'Septiembre', 'a month in sentence case');
});

test('Matches marks each word ignoring case and taking it literally', () => {
	const said = parts => parts.map(part => (typeof part === 'string' ? part : `[${part.textContent}]`));
	assert.deepEqual(said(ui.Matches.mark('Fix the checkout total', 'CHECK tot')), ['Fix the ', '[check]', 'out ', '[tot]', 'al']);
	assert.deepEqual(said(ui.Matches.mark('a+b (c)', '+b (')), ['a', '[+b]', ' ', '[(]', 'c)']);
	assert.deepEqual(ui.Matches.mark('Plain', ' '), ['Plain']);
});

test('a row\'s name that holds the focus keeps it when the list is drawn again', async () => {
	const list = make();
	await page.until(() => list.element.querySelector('.bui-row'));
	list.element.querySelectorAll('.bui-row-title')[2].focus();
	await list.load();
	assert.equal(document.activeElement, list.element.querySelectorAll('.bui-row-title')[2], 'the same conversation\'s name, in the new rows');
	assert.equal(document.activeElement.textContent, 'hola');
	list.destroy();
});

test('a list whose rows open nothing says no keys; Down from the search waits for an input method and for a pending answer', async () => {
	const plain = make({ link: null });
	await page.until(() => plain.element.querySelector('.bui-rows-end'));
	assert.equal(plain.element.querySelector('.bui-rows-end .bui-keys'), null);
	plain.destroy();
	const list = make();
	await page.until(() => list.element.querySelector('.bui-row'));
	const search = list.tools.element.querySelector('input');
	search.focus();
	search.dispatchEvent(new page.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true, isComposing: true }));
	assert.equal(document.activeElement, search, 'an input method keeps its Down');
	list.element.querySelector('.bui-collection-body').setAttribute('aria-busy', 'true');
	search.dispatchEvent(new page.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
	assert.equal(document.activeElement, search, 'rows about to be replaced take no focus');
	list.destroy();
});
