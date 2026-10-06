import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const { Landing } = await import('@beyond-js/ui/session/landed');
after(() => page.close());
beforeEach(() => page.reset());

const ada = { id: 'acc_ada', name: 'Ada Lovelace', email: 'ada@example.com' };

/**
 * A product as `Session` sees it: a session it reads, a hand-off whose silent attempt a landing
 * answers, and the sign-in window a press opens. `platform` says whether Beyond Accounts still has a
 * session; `after` is the answer the product reads once the person signed in again.
 */
class Product {
	answer = { state: 'ended', reason: 'expired' };
	platform = true;
	ended = null;
	opened = [];
	reads = 0;
	popup = null;

	constructor({ platform = true, ended = null, reason = 'expired' } = {}) {
		this.platform = platform;
		this.ended = ended;
		this.answer = { state: 'ended', reason };
		window.open = (url, name) => {
			this.opened.push(url);
			this.popup = { closed: false, opener: window, location: { replace: address => this.opened.push(address), href: 'about:blank' }, focus: () => {}, close: () => (this.popup.closed = true) };
			return this.popup;
		};
	}

	session(options = {}) {
		return new ui.Session({
			product: 'conduict',
			person: ada,
			read: async () => {
				this.reads += 1;
				return this.answer;
			},
			start: mode => `about:blank#${mode}`,
			wait: 300,
			interval: 20,
			...options
		});
	}

	/** Answers the hidden frame as the landing would. */
	async land() {
		await page.until(() => document.querySelector('iframe[data-session="renewal"]'));
		const frame = document.querySelector('iframe[data-session="renewal"]');
		if (this.platform) this.answer = { state: 'signed', person: ada };
		const data = { type: 'beyond-session', outcome: this.platform ? 'renewed' : 'interaction', ended: this.ended };
		window.dispatchEvent(new window.MessageEvent('message', { data, source: frame.contentWindow }));
	}

	signin(person = ada) {
		this.answer = { state: 'signed', person };
	}
}

const dialog = () => document.querySelector('dialog.bui-session');
const button = name => [...(dialog()?.querySelectorAll('button, a') ?? [])].find(node => node.textContent.trim() === name);

test('an expired session is renewed in a hidden frame with nothing shown, and what waited is sent again', async () => {
	const product = new Product();
	const session = product.session();
	const read = session.lost({ reason: 'expired', replay: 'read' });
	const write = session.lost({ reason: 'expired', replay: 'write' });
	const never = session.lost({ reason: 'expired', replay: false });
	await product.land();
	assert.deepEqual(await Promise.all([read, write, never]), [true, true, false]);
	assert.equal(session.state, 'signed');
	assert.equal(dialog(), null, 'no dialog for a silent renewal');
	assert.equal(document.querySelector('iframe'), null, 'the frame is removed');
	session.destroy();
});

test('without a Beyond session one dialog names the person; Continue opens the window and the page continues', async () => {
	const product = new Product({ platform: false });
	const bar = new ui.FamilyBar({ product: 'conduict', brand: { src: '/w.svg', href: '/' } }).mount(document.body);
	const session = product.session({ bar });
	const write = session.lost({ replay: 'write' });
	await product.land();
	await page.until(() => dialog()?.open);
	assert.equal(dialog().querySelector('.bui-dialog-title').textContent, 'Sign in again to continue');
	assert.match(dialog().textContent, /Ada Lovelace.*ada@example\.com/);
	assert.match(dialog().textContent, /What you were doing stays here\./);
	assert.ok(!dialog().classList.contains('bui-session-opaque'), 'the page stays visible behind an expired session');
	button('Continue as Ada').click();
	assert.equal(session.notice.phase, 'waiting');
	assert.deepEqual(product.opened, ['', 'about:blank#window']);
	assert.equal(product.popup.opener, null, 'the window loses its opener');
	product.signin();
	assert.equal(await write, true, 'a write held while the person signed in is sent');
	assert.equal(session.state, 'signed');
	assert.equal(dialog()?.open ?? false, false);
	session.destroy();
	bar.destroy();
});

test('closing the dialog leaves the page readable: presses that act open it again, and the bar offers Sign in', async () => {
	const product = new Product({ platform: false });
	const bar = new ui.FamilyBar({ product: 'conduict', brand: { src: '/w.svg', href: '/' } }).mount(document.body);
	let pressed = 0;
	const act = document.createElement('button');
	act.textContent = 'Create environment';
	act.addEventListener('click', () => (pressed += 1));
	const free = Object.assign(document.createElement('button'), { textContent: 'Copy' });
	free.dataset.session = 'free';
	let copied = 0;
	free.addEventListener('click', () => (copied += 1));
	document.body.append(act, free);
	const session = product.session({ bar });
	const write = session.lost({ replay: 'write' });
	await product.land();
	await page.until(() => dialog()?.open);
	page.key(dialog(), 'Escape');
	assert.equal(await write, false, 'nothing held is sent after the dialog closed');
	assert.equal(session.state, 'reading');
	assert.equal(document.documentElement.dataset.session, 'reading');
	const signin = bar.element.querySelector('.bui-family-signin');
	assert.equal(signin?.textContent, 'Sign in');
	assert.equal(bar.element.querySelector('.bui-family-account'), null, 'no account menu while signed out');
	act.click();
	assert.equal(pressed, 0, 'the press did not act');
	assert.equal(session.state, 'asking');
	assert.ok(dialog()?.open, 'it opened the dialog again');
	page.key(dialog(), 'Escape');
	free.click();
	assert.equal(copied, 1, 'a control marked free still works');
	bar.element.querySelector('.bui-family-signin').click();
	assert.ok(dialog()?.open);
	const read = session.lost({ replay: 'read' });
	page.key(dialog(), 'Escape');
	assert.equal(await read, false, 'a read held while asking is not sent once the dialog closed');
	assert.equal(await session.lost({ replay: 'read' }), false, 'nor one asked while reading');
	session.destroy();
	bar.destroy();
});

test('a revoked session hides the page and cannot be closed; a suspended account is offered no sign-in', async () => {
	const product = new Product({ platform: false, ended: 'revoked' });
	const session = product.session({ other: () => {} });
	void session.lost({ reason: 'revoked' });
	await product.land();
	await page.until(() => dialog()?.open);
	assert.ok(dialog().classList.contains('bui-session-opaque'));
	assert.equal(dialog().querySelector('.bui-dialog-title').textContent, 'You were signed out of Beyond');
	assert.equal(dialog().querySelector('.bui-dialog-head .bui-icon-button'), null, 'no close button');
	page.key(dialog(), 'Escape');
	assert.ok(dialog().open, 'Escape does not close it');
	assert.ok(button('Use another account') && button('Continue as Ada'));
	session.destroy();

	const suspended = new Product({ reason: 'suspended' });
	const blocked = suspended.session({ accounts: 'https://accounts.example/account' });
	assert.equal(await blocked.lost({ reason: 'suspended', replay: 'read' }), false);
	assert.equal(blocked.state, 'ended');
	assert.equal(document.querySelector('iframe'), null, 'no renewal is tried for a suspended account');
	assert.equal(dialog().querySelector('.bui-dialog-title').textContent, 'Your Beyond account is suspended');
	assert.equal(button('Open Beyond Accounts')?.getAttribute('href'), 'https://accounts.example/account');
	assert.equal([...dialog().querySelectorAll('button')].filter(node => /Continue|Sign in/.test(node.textContent)).length, 0);
	blocked.destroy();
});

test('someone else signing in drops what was held and starts the product again for them', async () => {
	const product = new Product({ platform: false });
	let changed = null;
	const session = product.session({ onchanged: person => (changed = person) });
	const write = session.lost({ replay: 'write' });
	await product.land();
	await page.until(() => dialog()?.open);
	button('Continue as Ada').click();
	product.signin({ id: 'acc_grace', name: 'Grace Hopper' });
	assert.equal(await write, false);
	assert.equal(changed?.id, 'acc_grace');
	assert.equal(session.person.id, 'acc_grace');
	session.destroy();
});

test('an unavailable Accounts is not a sign-out: it says so and tries again', async () => {
	const product = new Product();
	product.answer = { state: 'ended', reason: 'expired' };
	const session = product.session({ read: async () => Promise.reject(new Error('down')) });
	void session.lost({});
	await page.until(() => document.querySelector('iframe'));
	await page.until(() => dialog()?.open, 2000);
	assert.equal(session.kind, 'unavailable');
	assert.equal(dialog().querySelector('.bui-dialog-title').textContent, 'Beyond Accounts is not answering');
	assert.ok(button('Try again'));
	session.destroy();
});

test('a loop ends in the dialog: a second loss within the pause does not renew silently again', async () => {
	const product = new Product();
	const session = product.session();
	const first = session.lost({});
	await product.land();
	assert.equal(await first, true);
	product.answer = { state: 'ended', reason: 'expired' };
	void session.lost({});
	await page.until(() => dialog()?.open);
	assert.equal(document.querySelector('iframe'), null, 'no second frame');
	session.destroy();
});

test('a look at the session finds it ended before the person acts', async () => {
	const product = new Product({ platform: false });
	const session = product.session();
	await session.check();
	await product.land();
	await page.until(() => dialog()?.open);
	assert.equal(session.state, 'asking');
	session.destroy();
});

test('Spanish copy for the dialog and the bar', async () => {
	const product = new Product({ platform: false });
	const bar = new ui.FamilyBar({ product: 'conduict', brand: { src: '/w.svg', href: '/' }, labels: ui.FamilyBar.labels.es }).mount(document.body);
	const session = product.session({ bar, labels: ui.Session.labels.es });
	void session.lost({});
	await product.land();
	await page.until(() => dialog()?.open);
	assert.equal(dialog().querySelector('.bui-dialog-title').textContent, 'Vuelve a iniciar sesión para continuar');
	assert.ok(button('Continuar como Ada'));
	page.key(dialog(), 'Escape');
	assert.equal(bar.element.querySelector('.bui-family-signin')?.textContent, 'Iniciar sesión');
	session.destroy();
	bar.destroy();
});

test('the landing tells its parent and the channel the outcome, and nothing else', () => {
	const posted = [];
	const parent = { postMessage: (data, target) => posted.push([data, target]) };
	const view = { location: { search: '?session=interaction&ended=revoked&product=conduict&code=secret' }, parent, BroadcastChannel: class { postMessage(data) { posted.push([data, 'channel']); } close() {} }, document };
	new Landing(view).run();
	assert.deepEqual(posted, [
		[{ type: 'beyond-session', outcome: 'interaction', ended: 'revoked', product: 'conduict' }, '*'],
		[{ type: 'beyond-session', outcome: 'interaction', ended: 'revoked', product: 'conduict' }, 'channel']
	]);
	const odd = new Landing({ location: { search: '?session=hijack' }, parent: null });
	assert.equal(odd.message.outcome, 'failed', 'an unknown outcome is a failure');
});

test('a product\'s own sign-in behind Continue (an installed shell): the same dialog, then the page continues', async () => {
	const product = new Product({ platform: false });
	let asked = 0;
	const session = product.session({ start: mode => (mode === 'silent' ? null : null), signin: async () => {
		asked += 1;
		product.signin();
		return true;
	} });
	const write = session.lost({ replay: 'write' });
	await page.until(() => dialog()?.open);
	button('Continue as Ada').click();
	assert.equal(await write, true);
	assert.equal(asked, 1);
	assert.deepEqual(product.opened, [], 'no window is opened');
	assert.equal(dialog()?.open ?? false, false);
	session.destroy();
});
