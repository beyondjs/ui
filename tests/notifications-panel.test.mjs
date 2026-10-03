import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Notices } from './fixtures/notices.mjs';

/** The 0.4.0 notification panel: empty, history, unavailable, slow and late answers. */
const page = new Page();
const { NotificationEntry } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const body = entry => entry.panel.querySelector('.bui-notify-body');
const all = entry => entry.panel.querySelector('.bui-notify-all');
const foot = entry => entry.panel.querySelector('.bui-notify-foot');
const settled = entry => page.until(() => body(entry).getAttribute('aria-busy') === 'false');

/** An adapter whose list answers only when `release()` is called. */
function gated(notices) {
	const waiting = [];
	const adapter = { ...notices.adapter, list: request => new Promise(resolve => waiting.push(() => resolve(notices.adapter.list(request)))) };
	return { adapter, release: () => waiting.splice(0).forEach(open => open()), get pending() { return waiting.length; } };
}

test('an empty inbox is one quiet line with no "View all"; with history it offers "View all"', async () => {
	const notices = new Notices();
	notices.items = [];
	const entry = new NotificationEntry({ adapter: notices.adapter, href: '/notifications' }).mount(document.body);
	entry.button.click();
	await settled(entry);
	const line = body(entry).querySelector('p.bui-notify-empty');
	assert.equal(line.textContent, 'No notifications yet.');
	assert.equal(body(entry).querySelectorAll('h1, h2, h3, h4, .bui-empty-title').length, 0, 'the empty message is not a heading');
	assert.equal(all(entry).hidden, true, 'nothing to see: no "View all"');
	assert.equal(foot(entry).hidden, true, 'an empty footer is not drawn');
	entry.close();
	notices.items = new Notices().items.map(item => ({ ...item, read: '2026-09-23T00:00:00Z' }));
	entry.button.click();
	await settled(entry);
	assert.equal(all(entry).hidden, false, 'read items are history: "View all" shows');
	assert.equal(entry.panel.querySelector('.bui-notify-foot .bui-link-button').hidden, true, 'nothing unread: no "Mark all as read"');
	entry.destroy();
});

test('unavailable offers "Try again", not "View all", and recovers', async () => {
	const notices = new Notices();
	notices.absent = true;
	const entry = new NotificationEntry({ adapter: notices.adapter, href: '/notifications' }).mount(document.body);
	entry.button.click();
	await settled(entry);
	assert.match(body(entry).textContent, /Notifications are unavailable right now\. Everything else works\./);
	assert.equal(all(entry).hidden, true);
	const again = [...body(entry).querySelectorAll('button')].find(node => node.textContent === 'Try again');
	assert.ok(again, 'Try again is offered');
	notices.absent = false;
	again.click();
	await page.until(() => body(entry).querySelector('.bui-notice'));
	await page.until(() => entry.count === 3);
	assert.equal(all(entry).hidden, false);
	entry.destroy();
});

test('a quick answer never shows the loading indicator; a slow one shows it after the delay and drops it with the answer', async t => {
	const delay = NotificationEntry.delay;
	t.after(() => (NotificationEntry.delay = delay));
	NotificationEntry.delay = 30;
	const quick = new NotificationEntry({ adapter: new Notices().adapter, href: '/n' }).mount(document.body);
	quick.button.click();
	assert.equal(body(quick).getAttribute('aria-busy'), 'true', 'busy while loading');
	await settled(quick);
	await new Promise(resolve => setTimeout(resolve, 60));
	assert.equal(body(quick).querySelector('.bui-loading'), null, 'no indicator after a quick answer, not even later');
	quick.destroy();
	const gate = gated(new Notices());
	const slow = new NotificationEntry({ adapter: gate.adapter, href: '/n' }).mount(document.body);
	slow.button.click();
	assert.equal(body(slow).querySelector('.bui-loading'), null, 'not at once');
	await page.until(() => body(slow).querySelector('.bui-loading'));
	assert.equal(body(slow).getAttribute('aria-busy'), 'true');
	gate.release();
	await settled(slow);
	assert.equal(body(slow).querySelector('.bui-loading'), null, 'never held after the result');
	assert.ok(body(slow).querySelector('.bui-notice'));
	slow.destroy();
});

test('an answer that arrives after Escape is discarded, and opening again loads afresh', async t => {
	const delay = NotificationEntry.delay;
	t.after(() => (NotificationEntry.delay = delay));
	NotificationEntry.delay = 10;
	const gate = gated(new Notices());
	const entry = new NotificationEntry({ adapter: gate.adapter, href: '/n' }).mount(document.body);
	entry.button.click();
	await page.until(() => body(entry).querySelector('.bui-loading'));
	page.key(entry.panel, 'Escape');
	assert.ok(document.activeElement === entry.button, 'Escape returns to the bell');
	assert.equal(body(entry).getAttribute('aria-busy'), 'false');
	gate.release();
	await new Promise(resolve => setTimeout(resolve, 30));
	assert.equal(body(entry).querySelector('.bui-notice'), null, 'the late answer is not drawn');
	assert.equal(body(entry).childElementCount, 0, 'nor is the indicator left behind');
	entry.button.click();
	assert.equal(gate.pending, 1, 'reopening asks again');
	gate.release();
	await settled(entry);
	assert.ok(body(entry).querySelector('.bui-notice'));
	entry.destroy();
});
