import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Notices } from './fixtures/notices.mjs';

/**
 * 0.44.0 (D185): the inbox's first read waits as a region's does, with the shared wait in the list's place, so
 * the opening and the grace see it; a read the person asked for (a filter) says its loading line at once.
 */
const page = new Page();
const { NotificationInbox } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

/** An adapter whose list answers only when `release()` is called. */
function held(notices) {
	const waiting = [];
	const adapter = { ...notices.adapter, list: request => new Promise(resolve => waiting.push(() => resolve(notices.adapter.list(request)))) };
	return { adapter, release: () => waiting.splice(0).forEach(resolve => resolve()), get pending() { return waiting.length; } };
}

test('the first read is the shared wait in the list\'s place, busy and announced; its answer replaces it', async () => {
	const relay = held(new Notices());
	const inbox = new NotificationInbox({ adapter: relay.adapter, locale: 'es', labels: NotificationInbox.labels.es }).mount(document.body);
	const body = inbox.element.querySelector('.bui-inbox-body');
	const wait = body.querySelector(':scope > .bui-waiting');
	assert.ok(wait, 'the shared wait, which the opening and the grace see');
	assert.equal(wait.querySelector('[role="status"]').textContent, 'Cargando notificaciones…');
	assert.ok(wait.querySelector('.bui-skeleton'), 'placeholders in the rows\' shape');
	assert.equal(body.querySelector('.bui-loading'), null, 'no loading line, which shows at once');
	assert.equal(body.getAttribute('aria-busy'), 'true');
	relay.release();
	await page.until(() => body.querySelector('.bui-notice'));
	assert.equal(body.querySelector('.bui-waiting'), null);
	assert.equal(body.getAttribute('aria-busy'), 'false');
	inbox.destroy();
});

test('a read the person asked for says the loading line at once, never the region\'s wait', async () => {
	const relay = held(new Notices());
	const inbox = new NotificationInbox({ adapter: relay.adapter }).mount(document.body);
	relay.release();
	const body = inbox.element.querySelector('.bui-inbox-body');
	await page.until(() => body.querySelector('.bui-notice'));
	inbox.element.querySelectorAll('.bui-toggle')[1].click();
	await page.until(() => relay.pending);
	assert.equal(body.querySelector('.bui-loading [role="status"], .bui-loading')?.textContent, 'Loading notifications…');
	assert.equal(body.querySelector('.bui-waiting'), null);
	relay.release();
	await page.until(() => body.querySelector('.bui-notice'));
	inbox.destroy();
});

test('a first read that fails is no wait: its failure, and the next read answers the person\'s Try again at once', async () => {
	const notices = new Notices();
	notices.down = true;
	const inbox = new NotificationInbox({ adapter: notices.adapter }).mount(document.body);
	const body = inbox.element.querySelector('.bui-inbox-body');
	await page.until(() => body.querySelector('.bui-callout-danger'));
	assert.equal(body.querySelector('.bui-waiting'), null);
	notices.down = false;
	body.querySelector('.bui-callout-danger button').click();
	assert.equal(body.querySelector('.bui-waiting'), null, 'Try again is the person\'s action');
	await page.until(() => body.querySelector('.bui-notice'));
	inbox.destroy();
});
