import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Notices } from './fixtures/notices.mjs';

/**
 * How the notification entry and inbox state reach and counts as consumers answer them: products
 * by their display names, the summary bound of Beyond Projects (`more`), `sources` with their
 * state, and "View all" handing over to a routed inbox.
 */
const page = new Page();
const { NotificationEntry, NotificationInbox } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const products = { delegate: 'Delegate', cdn: 'CDN', projects: 'Projects' };
const badge = entry => entry.element.querySelector('.bui-count');
const partial = root => root.querySelector('.bui-callout-warning')?.textContent ?? '';
const lines = root => [...root.querySelectorAll('.bui-notify-silent > li')].map(line => line.textContent);

async function opened(entry) {
	entry.button.click();
	await page.until(() => entry.panel.querySelector('.bui-notice'));
}

test('partial results say one line per product that did not answer, in the catalog of causes, else its display name or id (0.44.0)', async () => {
	const notices = new Notices();
	notices.missing = ['cdn'];
	const named = new NotificationEntry({ adapter: notices.adapter, products }).mount(document.body);
	await opened(named);
	assert.deepEqual(lines(named.panel), ['Beyond CDN did not answer']);
	assert.match(partial(named.panel), /Its notifications are not listed\.$/);
	assert.equal(named.panel.querySelector('.bui-notify-partial').getAttribute('role'), null, 'drawn with the list, never announced as an alert');
	notices.missing = ['acme'];
	const outside = new NotificationEntry({ adapter: notices.adapter, products: { acme: 'Acme Billing' } }).mount(document.body);
	await opened(outside);
	assert.deepEqual(lines(outside.panel), ['Acme Billing did not answer'], 'a product outside the family by its display name');
	const unnamed = new NotificationEntry({ adapter: notices.adapter, products: {} }).mount(document.body);
	await opened(unnamed);
	assert.deepEqual(lines(unnamed.panel), ['acme did not answer'], 'an id without a display name is said as it is');
	notices.missing = ['cdn'];
	const inbox = new NotificationInbox({ adapter: notices.adapter, products, state: { state: 'all' } }).mount(document.body);
	await page.until(() => inbox.element.querySelector('.bui-notice'));
	assert.deepEqual(lines(inbox.element), ['Beyond CDN did not answer']);
});

test('sources with state unavailable are the partial signal in lists; available sources are not', async () => {
	const notices = new Notices();
	notices.shape = 'projects';
	const entry = new NotificationEntry({ adapter: notices.adapter, products }).mount(document.body);
	await opened(entry);
	assert.equal(partial(entry.panel), '', 'every source available: no partial message');
	entry.close();
	notices.missing = ['cdn', 'projects'];
	await opened(entry);
	assert.deepEqual(lines(entry.panel), ['Beyond CDN did not answer', 'Beyond Projects did not answer'], 'one line each, never one sentence listing them');
	assert.match(partial(entry.panel), /Their notifications are not listed\.$/);
	const inbox = new NotificationInbox({ adapter: notices.adapter, products, state: { state: 'all' }, locale: 'es', labels: NotificationInbox.labels.es }).mount(document.body);
	await page.until(() => inbox.element.querySelector('.bui-notice'));
	assert.deepEqual(lines(inbox.element), ['Beyond CDN no respondió', 'Beyond Projects no respondió']);
	assert.match(partial(inbox.element), /Sus notificaciones no aparecen en la lista\.$/);
});

test('a bounded summary shows N+ for any N; an unbounded one keeps 99+ past 99', async () => {
	const notices = new Notices();
	notices.shape = 'projects';
	notices.bound = 2;
	const entry = new NotificationEntry({ adapter: notices.adapter }).mount(document.body);
	await page.until(() => entry.count === 2);
	assert.equal(badge(entry).textContent, '2+');
	assert.equal(entry.more, true);
	assert.equal(entry.button.getAttribute('aria-label'), 'Notifications, 2 or more unread');
	notices.bound = 99;
	await entry.refresh();
	assert.equal(badge(entry).textContent, '3', 'below the bound the count is exact');
	assert.equal(entry.more, false);
	assert.equal(entry.button.getAttribute('aria-label'), 'Notifications, 3 unread');
	const old = new NotificationEntry({ adapter: { ...notices.adapter, summary: async () => ({ unread: 150 }) } }).mount(document.body);
	await page.until(() => old.count === 150);
	assert.equal(badge(old).textContent, '99+');
	const zero = new NotificationEntry({ adapter: { ...notices.adapter, summary: async () => ({ unread: 0, more: false, sources: [] }) } }).mount(document.body);
	await page.until(() => zero.count === 0);
	assert.equal(badge(zero).hidden, true, 'nothing unread shows no badge');
});

test('a summary naming unreachable sources marks the entry partial; the legacy unavailable field still does', async () => {
	const notices = new Notices();
	notices.shape = 'projects';
	const entry = new NotificationEntry({ adapter: notices.adapter }).mount(document.body);
	await page.until(() => entry.count !== null);
	assert.equal(entry.element.dataset.state, 'ready');
	notices.missing = ['cdn'];
	await entry.refresh();
	assert.equal(entry.element.dataset.state, 'partial');
	assert.deepEqual(entry.missing, ['cdn']);
	notices.shape = 'relay';
	await entry.refresh();
	assert.equal(entry.element.dataset.state, 'partial');
	notices.missing = [];
	await entry.refresh();
	assert.equal(entry.element.dataset.state, 'ready');
	assert.deepEqual(entry.missing, []);
});

test('the new copy is replaced through labels', async () => {
	const notices = new Notices();
	notices.shape = 'projects';
	notices.bound = 2;
	notices.missing = ['projects'];
	const labels = {
		button: ({ count, more }) => (count === null ? 'Notificaciones' : `Notificaciones, ${count}${more ? ' o más' : ''} sin leer`),
		badge: ({ count, more }) => (more ? `${count} o más` : String(count)),
		silent: '{product} no contestó',
		unlisted: 'Faltan sus avisos.'
	};
	const entry = new NotificationEntry({ adapter: notices.adapter, products, labels }).mount(document.body);
	await page.until(() => entry.count === 2);
	assert.equal(badge(entry).textContent, '2', 'two unread visible, at the bound');
	notices.missing = [];
	await entry.refresh();
	assert.equal(badge(entry).textContent, '2 o más');
	assert.equal(entry.button.getAttribute('aria-label'), 'Notificaciones, 2 o más sin leer');
	notices.missing = ['projects'];
	await opened(entry);
	assert.equal(partial(entry.panel), 'Beyond Projects no contestóFaltan sus avisos.');
});

test('View all with onview closes the panel, returns focus to the bell and hands over', async () => {
	const notices = new Notices();
	const views = [];
	const entry = new NotificationEntry({ adapter: notices.adapter, href: '#/notifications', onview: () => views.push(entry.expanded) }).mount(document.body);
	await opened(entry);
	const all = entry.panel.querySelector('.bui-notify-all');
	all.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
	assert.equal(entry.expanded, true, 'a modified click opens elsewhere and leaves the panel');
	assert.deepEqual(views, []);
	all.click();
	assert.deepEqual(views, [false], 'the panel is closed before the product routes');
	assert.equal(entry.expanded, false);
	assert.ok(document.activeElement === entry.button, 'focus is back on the bell');
	assert.equal(entry.panel.querySelector('.bui-notice'), null, 'no item text is kept');
});
