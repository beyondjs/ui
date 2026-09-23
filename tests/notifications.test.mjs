import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Notices } from './fixtures/notices.mjs';

const page = new Page();
const { NotificationEntry, NotificationInbox } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const products = { delegate: 'Delegate', cdn: 'CDN', projects: 'Projects' };
const bell = entry => entry.button;
const badge = entry => entry.element.querySelector('.bui-count');
const titles = root => [...root.querySelectorAll('.bui-notice-open')].filter(node => !node.closest('[hidden]')).map(node => node.textContent);

async function opened(entry) {
	bell(entry).click();
	await page.until(() => !entry.panel.querySelector('.bui-loading'));
}

test('the count shows when known and hides while unknown, failed or unavailable', async () => {
	const notices = new Notices();
	const entry = new NotificationEntry({ adapter: notices.adapter, href: '/notifications' }).mount(document.body);
	assert.equal(badge(entry).hidden, true, 'hidden before the summary answers');
	assert.equal(bell(entry).getAttribute('aria-label'), 'Notifications');
	await page.until(() => entry.count === 3);
	assert.equal(badge(entry).hidden, false);
	assert.equal(badge(entry).textContent, '3');
	assert.equal(bell(entry).getAttribute('aria-label'), 'Notifications, 3 unread');
	notices.down = true;
	await entry.refresh();
	assert.equal(entry.count, null);
	assert.equal(badge(entry).hidden, true);
	assert.equal(entry.element.dataset.state, 'failed');
	notices.down = false;
	notices.absent = true;
	await entry.refresh();
	assert.equal(entry.element.dataset.state, 'unavailable');
	assert.equal(badge(entry).hidden, true);
	await opened(entry);
	assert.match(entry.panel.textContent, /Notifications are unavailable right now/);
});

test('the panel lists recent items with product and time, and forgets them when closed', async () => {
	const notices = new Notices();
	const entry = new NotificationEntry({ adapter: notices.adapter, href: '/notifications', products, limit: 3, locale: 'es' }).mount(document.body);
	await opened(entry);
	assert.deepEqual(notices.calls.find(([name]) => name === 'list')[1], { state: 'all', product: null, cursor: null, limit: 3 });
	assert.equal(titles(entry.panel).length, 3);
	assert.match(titles(entry.panel)[0], /Export invoices” \(Unread\)/);
	assert.match(entry.panel.textContent, /Delegate · /);
	assert.ok(entry.panel.querySelector('time[datetime]'));
	assert.equal(entry.panel.querySelector('.bui-notify-all').getAttribute('href'), '/notifications');
	assert.equal(entry.panel.getAttribute('aria-labelledby'), entry.panel.querySelector('h2').id);
	page.key(entry.panel, 'Escape');
	assert.equal(document.activeElement, bell(entry));
	assert.equal(entry.panel.querySelector('.bui-notice'), null, 'no private text is kept after closing');
});

test('opening an item hands over its destination and marks it read; a gone item is removed', async () => {
	const notices = new Notices();
	const visits = [];
	notices.gone.add('n2');
	const entry = new NotificationEntry({ adapter: notices.adapter, onopen: destination => visits.push(destination) }).mount(document.body);
	await opened(entry);
	entry.panel.querySelectorAll('.bui-notice-open')[1].click();
	await page.until(() => /no longer available/.test(entry.panel.textContent));
	assert.equal(titles(entry.panel).some(title => title.includes('Luis')), false);
	assert.equal(entry.panel.querySelectorAll('.bui-notice').length, 5);
	entry.panel.querySelector('.bui-notice-open').click();
	await page.until(() => visits.length === 1);
	assert.deepEqual(visits, ['/app/n1']);
	assert.equal(entry.expanded, false);
	assert.equal(notices.items[0].read !== null, true);
});

test('mark as read and mark all as read change read state only, and refresh the count', async () => {
	const notices = new Notices();
	const entry = new NotificationEntry({ adapter: notices.adapter }).mount(document.body);
	await page.until(() => entry.count === 3);
	await opened(entry);
	const mark = entry.panel.querySelector('.bui-notice-mark');
	assert.equal(mark.textContent, 'Mark as read');
	mark.focus();
	mark.click();
	await page.until(() => entry.count === 2);
	assert.equal(document.activeElement.textContent, 'Mark as unread', 'focus stays on the same item');
	entry.panel.querySelector('.bui-notify-foot .bui-link-button').click();
	await page.until(() => entry.count === 0);
	const [, target] = notices.calls.filter(([name]) => name === 'read').at(-1);
	assert.ok(target.before, 'mark all is bounded by when the list was loaded');
	assert.equal(notices.calls.some(([name]) => name === 'open'), false, 'marking never opens anything');
});

test('the panel states failure with retry, and partial results name the unreachable products', async () => {
	const notices = new Notices();
	const entry = new NotificationEntry({ adapter: notices.adapter }).mount(document.body);
	notices.down = true;
	await opened(entry);
	assert.match(entry.panel.textContent, /Notifications could not be loaded/);
	notices.down = false;
	notices.missing = ['cdn'];
	entry.panel.querySelector('.bui-callout button').click();
	await page.until(() => entry.panel.querySelector('.bui-notice'));
	assert.match(entry.panel.textContent, /Some products could not be reached \(cdn\)/);
	assert.equal(titles(entry.panel).some(title => title.includes('Release 1.4.0')), false);
});

test('the inbox filters unread and all by product, groups, pages and reports its state', async () => {
	const notices = new Notices();
	const states = [];
	const inbox = new NotificationInbox({ adapter: notices.adapter, products, limit: 10, onstate: state => states.push(state), labels: { updates: ({ count }) => `${count} novedades` } }).mount(document.body);
	await page.until(() => inbox.element.querySelector('.bui-notice'));
	assert.deepEqual(titles(inbox.element).map(title => title.replace(' (Unread)', '')), ['New comment on “Export invoices”', 'You were added to Storefront']);
	const group = inbox.element.querySelector('[data-control="group"]');
	assert.equal(group.textContent, '2 novedades');
	group.click();
	assert.equal(group.getAttribute('aria-expanded'), 'true');
	const [unread, all] = inbox.element.querySelectorAll('.bui-toggle');
	assert.equal(unread.getAttribute('aria-pressed'), 'true');
	all.click();
	await page.until(() => inbox.element.querySelectorAll('.bui-notice').length >= 9);
	assert.deepEqual(states.at(-1), { state: 'all', product: '' });
	const more = inbox.element.querySelector('.bui-inbox > .bui-button-quiet');
	assert.equal(more.hidden, false);
	more.click();
	await page.until(() => inbox.element.querySelector('.bui-inbox > .bui-button-quiet').hidden);
	assert.equal(inbox.element.querySelectorAll('.bui-notice').length, 16);
	const select = inbox.element.querySelector('select');
	select.value = 'cdn';
	select.dispatchEvent(new Event('change'));
	await page.until(() => titles(inbox.element).length === 1);
	assert.deepEqual(states.at(-1), { state: 'all', product: 'cdn' });
	inbox.state = { state: 'unread', product: 'cdn' };
	await page.until(() => /You are all caught up/.test(inbox.element.textContent));
});

test('the inbox marks all read for its product filter and survives an unavailable aggregation', async () => {
	const notices = new Notices();
	const inbox = new NotificationInbox({ adapter: notices.adapter, products, state: { state: 'unread', product: 'delegate' } }).mount(document.body);
	await page.until(() => inbox.element.querySelector('.bui-notice'));
	const everything = inbox.element.querySelector('.bui-inbox-tools .bui-button');
	everything.click();
	await page.until(() => /caught up/.test(inbox.element.textContent));
	assert.equal(notices.calls.filter(([name]) => name === 'read').at(-1)[1].product, 'delegate');
	assert.equal(notices.items.find(item => item.id === 'n4').read, null, 'another product stays unread');
	notices.absent = true;
	await inbox.load();
	assert.match(inbox.element.textContent, /unavailable right now/);
	inbox.destroy();
	assert.equal(inbox.element.isConnected, false);
});
