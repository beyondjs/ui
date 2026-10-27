import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Notices } from './fixtures/notices.mjs';

/**
 * The inbox's tools in the page's header (0.39.0, L8) and its filtered empty (L10): with `tools: 'external'` the
 * inbox draws its toolbar nowhere and gives it as `tools.element`; without it nothing moves. A product filter with
 * nothing to show names the product and offers Show all products, in English and Spanish; with no product
 * filter the inbox keeps "You are all caught up." and "No notifications yet.".
 */
const page = new Page();
const { NotificationInbox } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const products = { delegate: 'Delegate', cdn: 'CDN', projects: 'Projects' };
const settled = inbox => page.until(() => inbox.element.querySelector('.bui-inbox-body').getAttribute('aria-busy') === 'false');

test('external tools leave the body and are one toolbar the product places, which still filters and marks', async () => {
	const notices = new Notices();
	const states = [];
	const inbox = new NotificationInbox({ adapter: notices.adapter, products, tools: 'external', onstate: state => states.push(state) }).mount(document.body);
	await settled(inbox);
	assert.equal(inbox.element.querySelector('.bui-inbox-tools'), null, 'nothing of the toolbar in the body');
	const header = document.createElement('div');
	document.body.prepend(header);
	header.append(inbox.tools.element);
	assert.equal(inbox.tools, inbox.tools, 'one toolbar for the life of the inbox');
	header.querySelectorAll('.bui-toggle')[1].click();
	await page.until(() => states.length === 1);
	assert.deepEqual(states[0], { state: 'all', product: '' });
	await settled(inbox);
	const select = header.querySelector('select');
	select.value = 'delegate';
	select.dispatchEvent(new Event('change'));
	await page.until(() => states.length === 2);
	await settled(inbox);
	inbox.state = { state: 'unread', product: 'delegate' };
	await settled(inbox);
	const everything = header.querySelector('.bui-inbox-tools .bui-button');
	assert.equal(everything.hidden, false, 'Mark all as read is in the header while something is unread');
	everything.click();
	await page.until(() => notices.calls.some(([name]) => name === 'read'));
	inbox.destroy();
	assert.equal(header.children.length, 0, 'destroying the inbox takes its toolbar with it');
});

test('without external tools the toolbar stays in the body, first, as before', async () => {
	const inbox = new NotificationInbox({ adapter: new Notices().adapter, products }).mount(document.body);
	await settled(inbox);
	assert.equal(inbox.element.firstElementChild, inbox.tools.element);
	assert.ok(inbox.element.querySelector('.bui-inbox-tools select'));
});

test('an outage hides the external toolbar, which comes back once the relay answers', async () => {
	const notices = new Notices();
	notices.absent = true;
	notices.reason = 'projects_unavailable';
	const inbox = new NotificationInbox({ adapter: notices.adapter, products, tools: 'external' }).mount(document.body);
	document.body.prepend(inbox.tools.element);
	await page.until(() => /did not answer/.test(inbox.element.textContent));
	assert.equal(inbox.tools.element.hidden, true, 'no filter that cannot work');
	notices.absent = false;
	await inbox.load();
	await settled(inbox);
	assert.equal(inbox.tools.element.hidden, false);
	inbox.destroy();
});

test('a product filter with nothing unread names the product and offers every product again', async () => {
	const notices = new Notices();
	const states = [];
	const inbox = new NotificationInbox({ adapter: notices.adapter, products, state: { state: 'unread', product: 'cdn' }, onstate: state => states.push(state) }).mount(document.body);
	await page.until(() => inbox.element.querySelector('.bui-empty'));
	const empty = inbox.element.querySelector('.bui-empty');
	assert.equal(empty.querySelector('.bui-empty-title').textContent, 'Nothing unread from CDN.');
	assert.doesNotMatch(inbox.element.textContent, /caught up/, 'never said as an inbox with nothing at all');
	const widen = empty.querySelector('.bui-empty-actions button');
	assert.equal(widen.textContent, 'Show all products');
	widen.click();
	assert.deepEqual(states.at(-1), { state: 'unread', product: '' });
	assert.equal(inbox.element.querySelector('select').value, '', 'the filter shows every product');
	assert.equal(document.activeElement, inbox.element.querySelector('select'), 'the focus goes to the filter it changed');
	await page.until(() => inbox.element.querySelector('.bui-notice'));
	assert.equal(notices.calls.filter(([name]) => name === 'list').at(-1)[1].product, null);
});

test('with All, a product with no notifications is said for that product; in Spanish too', async () => {
	const notices = new Notices();
	notices.items = notices.items.filter(item => item.product !== 'projects');
	const inbox = new NotificationInbox({ adapter: notices.adapter, products, state: { state: 'all', product: 'projects' } }).mount(document.body);
	await page.until(() => inbox.element.querySelector('.bui-empty'));
	assert.equal(inbox.element.querySelector('.bui-empty-title').textContent, 'No notifications from Projects.');
	inbox.destroy();
	const spanish = new NotificationInbox({ adapter: notices.adapter, products, labels: NotificationInbox.labels.es, state: { state: 'unread', product: 'cdn' } }).mount(document.body);
	await page.until(() => spanish.element.querySelector('.bui-empty'));
	assert.equal(spanish.element.querySelector('.bui-empty-title').textContent, 'Nada sin leer de CDN.');
	assert.equal(spanish.element.querySelector('.bui-empty-actions button').textContent, 'Mostrar todos los productos');
	spanish.state = { state: 'all', product: 'projects' };
	await page.until(() => /No hay notificaciones de Projects\./.test(spanish.element.textContent));
});

test('with no product filter the empty inbox says what it always said, with no way to widen', async () => {
	const notices = new Notices();
	notices.items = [];
	const inbox = new NotificationInbox({ adapter: notices.adapter, products }).mount(document.body);
	await page.until(() => inbox.element.querySelector('.bui-empty'));
	assert.equal(inbox.element.querySelector('.bui-empty-title').textContent, 'You are all caught up.');
	assert.equal(inbox.element.querySelector('.bui-empty-actions'), null);
	inbox.state = { state: 'all', product: '' };
	await page.until(() => /No notifications yet\./.test(inbox.element.textContent));
	assert.equal(inbox.element.querySelector('.bui-empty-actions'), null);
});

test('a filter for a product the inbox does not list names it by its identifier', async () => {
	const notices = new Notices();
	notices.items = [];
	const inbox = new NotificationInbox({ adapter: notices.adapter, products, state: { state: 'unread', product: 'snapshots' } }).mount(document.body);
	await page.until(() => inbox.element.querySelector('.bui-empty'));
	assert.equal(inbox.element.querySelector('.bui-empty-title').textContent, 'Nothing unread from snapshots.');
});
