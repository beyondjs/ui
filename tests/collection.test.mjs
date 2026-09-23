import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { rows } from './fixtures/rows.mjs';

const page = new Page();
const { Collection } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const columns = [
	{ key: 'title', label: 'Request', primary: true },
	{ key: 'state', label: 'State' },
	{ key: 'votes', label: 'Support', numeric: true }
];
const settle = list => page.until(() => list.element.querySelector('.bui-collection-body').getAttribute('aria-busy') === 'false');
const titles = list => [...list.element.querySelectorAll('tbody tr > :first-child')].map(cell => cell.textContent);

test('rows open their detail through real links; plain clicks can be taken over', async () => {
	const opened = [];
	const list = new Collection({ label: 'Requests', columns, source: Collection.local(rows), link: row => `#/requests/${row.id}`, onopen: row => opened.push(row.id), limit: 10 }).mount(document.body);
	await settle(list);
	const link = list.element.querySelector('tbody a.bui-row-link');
	assert.equal(link.getAttribute('href'), '#/requests/r1');
	assert.equal(list.element.querySelector('caption').textContent, 'Requests');
	assert.equal(list.element.querySelector('tbody td').dataset.label, 'State');
	link.click();
	assert.deepEqual(opened, ['r1']);
	link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
	assert.deepEqual(opened, ['r1'], 'a modified click keeps the browser behavior');
});

test('paging reports its state, restores from state and focuses the new rows', async () => {
	const states = [];
	const list = new Collection({ label: 'Requests', columns, source: Collection.local(rows), limit: 10, state: { page: 2 }, onstate: state => states.push(state) }).mount(document.body);
	await settle(list);
	assert.equal(titles(list)[0], 'Request 11');
	assert.match(list.element.querySelector('.bui-pager-summary').textContent, /11–20 of 23 · page 2 of 3/);
	const [previous, next] = list.element.querySelectorAll('.bui-pager button');
	next.click();
	await settle(list);
	assert.deepEqual(titles(list), ['Request 21', 'Request 22', 'Request 23']);
	assert.equal(list.element.querySelectorAll('.bui-pager button')[1].disabled, true);
	assert.equal(document.activeElement, list.element.querySelector('.bui-collection-body'));
	assert.deepEqual(states.at(-1), { query: '', filters: {}, page: 3 });
	assert.ok(previous);
	list.state = { query: '', filters: {}, page: 1 };
	await settle(list);
	assert.equal(titles(list)[0], 'Request 1');
});

test('search and filters reset the page; no matches offers to clear them', async () => {
	const states = [];
	const list = new Collection({
		label: 'Requests',
		columns,
		source: Collection.local(rows, (row, query, filters) => row.title.toLowerCase().includes(query.toLowerCase()) && (!filters.state || row.state === filters.state)),
		filters: [{ name: 'state', label: 'State', options: [{ value: 'open', label: 'Open' }, { value: 'released', label: 'Released' }] }],
		delay: 0,
		limit: 5,
		state: { page: 2 },
		onstate: state => states.push(state)
	}).mount(document.body);
	await settle(list);
	const select = list.element.querySelector('select');
	select.value = 'released';
	select.dispatchEvent(new Event('change'));
	await settle(list);
	assert.deepEqual(states.at(-1), { query: '', filters: { state: 'released' }, page: 1 });
	const input = list.element.querySelector('input[type="search"]');
	assert.equal(list.element.querySelector(`label[for="${input.id}"]`).textContent, 'Search Requests');
	input.value = 'nothing like this';
	input.dispatchEvent(new Event('input'));
	await page.until(() => /No matches for “nothing like this”/.test(list.element.textContent));
	list.element.querySelector('.bui-empty button').click();
	await settle(list);
	assert.equal(titles(list).length, 5);
	assert.deepEqual(states.at(-1), { query: '', filters: {}, page: 1 });
	assert.equal(document.activeElement, input);
});

test('an empty collection invites its first action; a failure offers retry and recovers', async () => {
	const action = document.createElement('a');
	action.textContent = 'New request';
	const empty = new Collection({ label: 'Requests', columns, source: async () => ({ rows: [], total: 0 }), empty: { title: 'No requests yet', body: 'Requests you submit appear here.', action } }).mount(document.body);
	await settle(empty);
	assert.match(empty.element.textContent, /No requests yet.*Requests you submit appear here.*New request/);
	let fail = true;
	const failing = new Collection({ label: 'Requests', columns, source: async request => { if (fail) throw new Error('down'); return Collection.local(rows)(request); }, explain: () => 'Requests are unavailable.' }).mount(document.body);
	await settle(failing);
	assert.match(failing.element.textContent, /Requests are unavailable/);
	assert.equal(failing.element.querySelector('[role="status"]').textContent, 'Requests are unavailable.');
	fail = false;
	failing.element.querySelector('.bui-callout button').click();
	await settle(failing);
	assert.equal(titles(failing).length, 20);
});

test('a page past the end moves back to the last page', async () => {
	const list = new Collection({ label: 'Requests', columns, source: Collection.local(rows), limit: 10, state: { page: 9 } }).mount(document.body);
	await page.until(() => titles(list)[0] === 'Request 21');
	assert.equal(list.state.page, 3);
	list.destroy();
	assert.equal(list.element.isConnected, false);
});
