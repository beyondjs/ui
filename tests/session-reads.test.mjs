import { test, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * 0.47.0: `Session` never reads in a loop, and nothing of the package reads for a hidden page. Looks
 * share one read and a recent `signed` answer stands; the look before expiry runs once per expiry; a
 * request refused again soon after a renewal while the session still reads signed is not sent again;
 * a hidden page neither looks, retries nor refreshes the notification count, and does so once shown.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const { Watch } = await import('../src/dom/session/watch.js');
const { Retry } = await import('../src/dom/session/retry.js');
const { SessionProduct, ada } = await import('./support/session.mjs');
SessionProduct.context = { ui, page };
after(() => page.close());
beforeEach(() => page.reset());

const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

/** A document whose visibility a test sets, with the window events `Watch` listens to. */
class Visibility extends page.window.EventTarget {
	visibilityState = 'visible';
	defaultView = new page.window.EventTarget();

	set(state) {
		this.visibilityState = state;
		this.dispatchEvent(new page.window.Event('visibilitychange'));
	}
}

test('looks share one read, and a signed answer younger than fresh answers the next ones without reading', async () => {
	const product = new SessionProduct();
	product.signin();
	let release;
	const held = new Promise(resolve => (release = resolve));
	const session = product.session({ read: async () => (product.reads += 1, await held, product.answer) });
	const looks = [session.check(), session.check(), session.check()];
	release();
	assert.deepEqual(await Promise.all(looks), ['signed', 'signed', 'signed']);
	assert.equal(product.reads, 1, 'three looks while one read ran: one read');
	assert.equal(await session.check(), 'signed');
	assert.equal(product.reads, 1, 'a transport that drops again within fresh reads nothing');
	session.destroy();

	const strict = new SessionProduct();
	strict.signin();
	const always = strict.session({ fresh: 0 });
	await always.check();
	await always.check();
	assert.equal(strict.reads, 2, 'fresh: 0 reads on every look');
	always.destroy();
});

test('the last minute before a known expiry is read once, never in a loop', async () => {
	const product = new SessionProduct();
	const expires = new Date(Date.now() + 30_000).toISOString();
	product.answer = { state: 'signed', person: ada, expires };
	const session = product.session({ expires });
	await page.until(() => product.reads >= 1);
	await pause(150);
	assert.equal(product.reads, 1, 'a read that answers the same expiry schedules nothing');
	assert.equal(session.state, 'signed');
	session.destroy();
});

test('a request refused again soon after a renewal while the session reads signed is not sent again: no loop', async () => {
	const product = new SessionProduct();
	const session = product.session();
	const renewals = [];
	session.subscribe(event => event.type === 'renewed' && renewals.push(event));
	const first = session.lost({ replay: 'read' });
	await product.land();
	assert.equal(await first, true, 'the first refusal renews and is sent again');
	const before = product.reads;
	// A product that sends a refused request again for as long as `lost()` says so
	let sent = 0;
	while (sent < 50 && (await session.lost({ replay: 'read' }))) sent += 1;
	assert.equal(sent, 0, 'refused again while signed: not sent again');
	assert.equal(product.reads - before, 1, 'one read says the session still stands');
	assert.equal(session.state, 'signed', 'nothing is renewed: the refusal is the product’s to say in place');
	assert.equal(renewals.length, 1, 'no second renewal is announced');
	assert.equal(document.querySelector('iframe'), null, 'no frame');
	const together = await Promise.all([session.lost({ replay: 'read' }), session.lost({ replay: 'write' }), session.lost({ replay: 'read' })]);
	assert.deepEqual(together, [false, false, false]);
	assert.equal(product.reads - before, 2, 'refusals that arrive together share one read');
	session.destroy();
});

test('a session that ended soon after a renewal is still answered: refused again, it is read and asked for', async () => {
	const product = new SessionProduct({ platform: false });
	const session = product.session();
	const first = session.lost({ replay: 'read' });
	await product.land();
	await page.until(() => SessionProduct.dialog()?.open);
	SessionProduct.button('Continue as Ada').click();
	product.signin();
	assert.equal(await first, true);
	product.answer = { state: 'ended', reason: 'expired' };
	const again = session.lost({ replay: 'write' });
	await page.until(() => SessionProduct.dialog()?.open, 4000);
	assert.equal(session.state, 'asking');
	SessionProduct.button('Continue as Ada').click();
	product.signin();
	assert.equal(await again, true, 'what waited is sent once renewed');
	session.destroy();
});

test('a hidden page does not look at the session, and looks when shown', async t => {
	const document = new Visibility();
	let looks = 0;
	const watch = new Watch({ document, check: () => (looks += 1), spacing: 0, tick: 10 });
	t.after(() => watch.destroy());
	document.visibilityState = 'hidden';
	document.defaultView.dispatchEvent(new page.window.Event('online'));
	watch.expires = Date.now() + 1000;
	await pause(60);
	assert.equal(looks, 0, 'neither the network’s return nor the expiry look while hidden');
	document.set('visible');
	assert.equal(looks, 1, 'shown again, it looks once');
	watch.destroy();
});

test('the look before expiry waits for the spacing after the last look, and runs again for a new expiry', async t => {
	const document = new Visibility();
	let looks = 0;
	const watch = new Watch({ document, check: () => (looks += 1), spacing: 80 });
	t.after(() => watch.destroy());
	document.set('visible');
	assert.equal(looks, 1);
	const at = Date.now();
	watch.expires = at;
	await pause(30);
	assert.equal(looks, 1, 'not within the spacing');
	await pause(90);
	assert.equal(looks, 2, 'then once');
	watch.expires = new Date(at).toISOString();
	await pause(120);
	assert.equal(looks, 2, 'the same expiry is not looked at again');
	watch.expires = at + 1;
	await pause(120);
	assert.equal(looks, 3, 'a new expiry is');
	watch.destroy();
});

test('a retry that falls due while the page is hidden waits and runs once when shown', () => {
	mock.timers.enable({ apis: ['setTimeout'] });
	try {
		const document = new Visibility();
		let runs = 0;
		const retry = new Retry(() => (runs += 1), document);
		document.visibilityState = 'hidden';
		retry.schedule();
		mock.timers.tick(5_000);
		assert.equal(runs, 0, 'hidden: nothing is tried');
		document.set('hidden');
		assert.equal(runs, 0);
		document.set('visible');
		document.set('visible');
		assert.equal(runs, 1, 'shown: one try');
		retry.schedule();
		retry.reset();
		document.visibilityState = 'hidden';
		mock.timers.tick(60_000);
		document.set('visible');
		assert.equal(runs, 1, 'reset: nothing waits');
	} finally {
		mock.timers.reset();
	}
});

test('the notification count is not refreshed for a hidden page, and is read once when it is shown', async () => {
	let summaries = 0;
	const adapter = { summary: async () => (summaries += 1, { unread: 2 }), list: async () => ({ items: [] }), read: async () => {}, unread: async () => {}, open: async () => {} };
	const entry = new ui.NotificationEntry({ adapter, interval: 20 }).mount(document.body);
	await page.until(() => summaries >= 2);
	Object.defineProperty(page.document, 'visibilityState', { value: 'hidden', configurable: true });
	try {
		await pause(30);
		const hidden = summaries;
		await pause(120);
		assert.equal(summaries, hidden, 'no refresh while hidden');
		delete page.document.visibilityState;
		page.document.dispatchEvent(new page.window.Event('visibilitychange'));
		assert.equal(summaries, hidden + 1, 'shown: one refresh at once');
	} finally {
		delete page.document.visibilityState;
		entry.destroy();
	}
});
