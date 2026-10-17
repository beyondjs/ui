import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Notices } from './fixtures/notices.mjs';

/**
 * Notifications by matter (0.15.0, X-07): opening or marking a matter reads all of it through the
 * adapter's optional `readGroup` (Beyond Projects' `POST /v1/notifications/read` with `{ group, product }`),
 * falling back to the loaded updates; the inbox pages by matter, so one noisy matter never hides others;
 * a matter says how many updates it holds when the relay counts them.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

/** A noisy matter of 26 updates before a quiet one, as Ada's inbox held in the audit. */
const noisy = () => {
	const notices = new Notices();
	const at = minutes => new Date(Date.parse('2026-10-17T12:00:00Z') - minutes * 60000).toISOString();
	notices.items = [
		...Array.from({ length: 26 }, (_, index) => ({ id: `g${index}`, product: 'projects', kind: 'github.attention', title: 'The GitHub connection to beyond-JS needs attention', occurred: at(index), read: null, group: 'github:c1' })),
		{ id: 'q1', product: 'delegate', kind: 'request.commented', title: 'New comment on “Export invoices”', occurred: at(100), read: null, group: 'request:r1' }
	];
	return notices;
};
const rows = inbox => [...inbox.element.querySelectorAll('.bui-notices > .bui-notice:not(.bui-notice-earlier .bui-notice)')].filter(node => !node.closest('.bui-notice-earlier'));

test('a page of matters: a relay that ignores `by` is read on until the matters fill the page, within a bound', async () => {
	const notices = noisy();
	const inbox = new ui.NotificationInbox({ adapter: notices.adapter, limit: 20 }).mount(document.body);
	await page.until(() => rows(inbox).length === 2);
	const lists = notices.calls.filter(([name]) => name === 'list');
	assert.ok(lists.every(([, request]) => request.by === 'group'), 'it asks for matters');
	assert.equal(lists.length, 2, 'the first page held one matter; the second the rest');
	assert.match(inbox.element.textContent, /Export invoices/, 'the quiet matter is not hidden by the noisy one');
	inbox.destroy();
	const bounded = noisy();
	bounded.items = [...Array.from({ length: 200 }, (_, index) => ({ ...bounded.items[0], id: `b${index}` })), bounded.items.at(-1)];
	const capped = new ui.NotificationInbox({ adapter: bounded.adapter, limit: 20 }).mount(document.body);
	await page.until(() => rows(capped).length >= 1);
	assert.ok(bounded.calls.filter(([name]) => name === 'list').length <= 5, 'never more than Feed.pages requests at once');
	capped.destroy();
});

test('opening a matter reads all of it through readGroup, even updates no page loaded', async () => {
	const notices = noisy();
	const groups = [];
	const adapter = { ...notices.adapter, readGroup: async (group, scope) => (groups.push([group, scope]), notices.items.filter(item => item.group === group).forEach(item => (item.read = 'now'))) };
	const opened = [];
	const inbox = new ui.NotificationInbox({ adapter, limit: 1, onopen: destination => opened.push(destination) }).mount(document.body);
	await page.until(() => rows(inbox).length >= 1);
	rows(inbox)[0].querySelector('.bui-notice-open').click();
	await page.until(() => opened.length === 1);
	assert.deepEqual(groups, [['github:c1', { product: 'projects' }]], 'the whole matter, by its product');
	assert.ok(notices.items.filter(item => item.group === 'github:c1').every(item => item.read), 'all 26 read, not only the loaded ones');
	inbox.destroy();
});

test('marking a matter read uses readGroup; a relay without it, or a failing one, marks the loaded updates', async () => {
	const notices = noisy();
	let fail = true;
	const adapter = { ...notices.adapter, readGroup: async () => { if (fail) throw new Error('not yet'); } };
	const inbox = new ui.NotificationInbox({ adapter, limit: 20 }).mount(document.body);
	await page.until(() => rows(inbox).length === 2);
	rows(inbox)[0].querySelector('[data-control="mark"]').click();
	await page.until(() => notices.calls.some(([name]) => name === 'read'));
	const [, ids] = notices.calls.find(([name]) => name === 'read');
	assert.equal(ids.length, 26, 'the loaded updates, one by one, when readGroup fails');
	inbox.destroy();
	fail = false;
	const plain = noisy();
	const without = new ui.NotificationInbox({ adapter: plain.adapter, limit: 20 }).mount(document.body);
	await page.until(() => rows(without).length === 2);
	rows(without)[1].querySelector('[data-control="mark"]').click();
	await page.until(() => plain.calls.some(([name]) => name === 'read'));
	assert.deepEqual(plain.calls.find(([name]) => name === 'read')[1], ['q1'], 'without readGroup: the ids, as before');
	without.destroy();
});

test('a relay that groups answers one item per matter with its counts: the row says all its updates', async () => {
	const adapter = {
		summary: async () => ({ unread: 1 }),
		list: async () => ({ grouped: true, next: null, items: [{ id: 'g0', product: 'projects', title: 'The GitHub connection needs attention', occurred: new Date().toISOString(), read: null, group: 'github:c1', matter: { updates: 26, unread: 6 } }] }),
		read: async () => ({}),
		unread: async () => ({}),
		open: async () => ({ destination: '/x' })
	};
	const inbox = new ui.NotificationInbox({ adapter, labels: ui.NotificationInbox.labels.es }).mount(document.body);
	await page.until(() => inbox.element.querySelector('.bui-notice'));
	assert.equal(inbox.element.querySelector('.bui-notice-count').textContent, '26 novedades');
	assert.equal(inbox.element.querySelector('.bui-notice').dataset.read, 'false', 'unread while any update is');
	inbox.destroy();
});
