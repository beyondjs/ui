import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Notices } from './fixtures/notices.mjs';

const page = new Page();
const { Again, NotificationEntry, NotificationInbox } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

test('an unavailable relay warns, says when it last tried and recovers in the open panel automatically', async t => {
	const steps = Again.steps;
	Again.steps = [25];
	t.after(() => (Again.steps = steps));
	const notices = new Notices();
	let reads = 0;
	const adapter = { ...notices.adapter, list: request => ++reads === 1 ? Promise.resolve({ available: false, reason: 'projects_unavailable' }) : notices.adapter.list(request) };
	const entry = new NotificationEntry({ adapter }).mount(document.body);
	t.after(() => entry.destroy());
	entry.button.click();
	await page.until(() => entry.panel.querySelector('.bui-callout-warning'));
	assert.match(entry.panel.querySelector('.bui-again').textContent, /Last tried/);
	await page.until(() => entry.panel.querySelector('.bui-notice'));
	assert.ok(reads >= 2, 'the open panel reads again without a press');
	assert.equal(entry.panel.querySelector('.bui-callout-warning'), null, 'recovery clears the cause');
	entry.close();
	assert.equal(entry.panel.querySelector('.bui-notice'), null, 'private items do not outlive the panel');
});

test('the full inbox says its outage in the page form, its read in Technical details, and recovers in Spanish (0.33.0)', async t => {
	const steps = Again.steps;
	Again.steps = [25];
	t.after(() => (Again.steps = steps));
	const notices = new Notices();
	let reads = 0;
	const adapter = { ...notices.adapter, list: request => ++reads === 1 ? Promise.resolve({ available: false, reason: 'accounts_unavailable', request: 'req_inbox' }) : notices.adapter.list(request) };
	const inbox = new NotificationInbox({ adapter, labels: NotificationInbox.labels.es, locale: 'es' }).mount(document.body);
	t.after(() => inbox.destroy());
	await page.until(() => inbox.element.querySelector('.bui-recovery:not([hidden])'));
	const notice = inbox.element.querySelector('.bui-recovery');
	assert.equal(notice.dataset.recovery, 'page', 'the page form: nothing else could be read');
	assert.equal(notice.querySelector('h2.bui-recovery-title').textContent, 'Beyond Accounts no respondió');
	assert.match(notice.querySelector('.bui-again').textContent, /Último intento/);
	assert.equal([...notice.querySelectorAll('button')].filter(button => !button.closest('details')).map(button => button.textContent.trim()).join(), 'Reintentar', 'one Try again');
	assert.equal(notice.querySelectorAll('details').length, 1, 'its read in the one Technical details');
	assert.match(notice.querySelector('details').textContent, /Detalles técnicos[\s\S]*req_inbox/);
	assert.equal(inbox.element.querySelector('.bui-callout'), null, 'no callout with its own line and Try again');
	assert.equal(inbox.element.querySelector('.bui-inbox-tools').hidden, true, 'no filter that cannot work');
	await page.until(() => inbox.element.querySelector('.bui-notice'));
	assert.ok(reads >= 2);
	assert.equal(notice.hidden, true, 'the page is given back once the relay answers');
	assert.equal(inbox.element.querySelector('.bui-inbox-tools').hidden, false);
});

test('the inbox keeps its page form while its own tries run, and a read that failed offline says the person is offline', async t => {
	const notices = new Notices();
	let answer = null;
	const adapter = { ...notices.adapter, list: () => new Promise((resolve, reject) => (answer = { resolve, reject })) };
	const online = Object.getOwnPropertyDescriptor(navigator, 'onLine');
	Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
	t.after(() => (online ? Object.defineProperty(navigator, 'onLine', online) : delete navigator.onLine));
	const inbox = new NotificationInbox({ adapter }).mount(document.body);
	t.after(() => inbox.destroy());
	answer.reject(new TypeError('Failed to fetch'));
	await page.until(() => inbox.element.querySelector('.bui-recovery:not([hidden])'));
	const notice = inbox.element.querySelector('.bui-recovery');
	assert.equal(notice.querySelector('.bui-recovery-title').textContent, 'You’re offline', 'no product is blamed');
	assert.match(notice.querySelector('.bui-again').textContent, /as soon as you’re back online$/);
	assert.equal(inbox.element.querySelector('.bui-callout-danger'), null, 'never the danger of a failure');
	void inbox.load();
	assert.equal(inbox.element.querySelector('.bui-recovery'), notice, 'a try keeps the page form, never a loading line in its place');
	answer.resolve({ items: [] });
	await page.until(() => !inbox.element.querySelector('.bui-recovery'));
});

test('missing setup and rejected access retain their cause without pretending an outage', async t => {
	const notices = new Notices();
	for (const reason of ['not_configured', 'not_platform_session', 'session_rejected']) {
		const adapter = { ...notices.adapter, list: async () => ({ available: false, reason }) };
		const entry = new NotificationEntry({ adapter }).mount(document.body);
		t.after(() => entry.destroy());
		entry.button.click();
		await page.until(() => entry.panel.querySelector('.bui-callout-info'));
		assert.equal(entry.panel.querySelector('.bui-again'), null, reason);
		assert.equal(entry.panel.querySelector('.bui-callout-warning'), null, reason);
		entry.destroy();
	}
});
