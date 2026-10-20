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

test('the full inbox has the same warning and automatic recovery in Spanish', async t => {
	const steps = Again.steps;
	Again.steps = [25];
	t.after(() => (Again.steps = steps));
	const notices = new Notices();
	let reads = 0;
	const adapter = { ...notices.adapter, list: request => ++reads === 1 ? Promise.resolve({ available: false, reason: 'accounts_unavailable' }) : notices.adapter.list(request) };
	const inbox = new NotificationInbox({ adapter, labels: NotificationInbox.labels.es, locale: 'es' }).mount(document.body);
	t.after(() => inbox.destroy());
	await page.until(() => inbox.element.querySelector('.bui-callout-warning'));
	assert.match(inbox.element.querySelector('.bui-again').textContent, /Último intento/);
	assert.match(inbox.element.textContent, /Reintentar/);
	await page.until(() => inbox.element.querySelector('.bui-notice'));
	assert.ok(reads >= 2);
	assert.equal(inbox.element.querySelector('.bui-callout-warning'), null);
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
