import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const { Landing } = await import('@beyond-js/ui/session/landed');
const { SessionProduct, ada } = await import('./support/session.mjs');
SessionProduct.context = { ui, page };
after(() => page.close());
beforeEach(() => page.reset());

const { dialog, button } = SessionProduct;

test('an expired session is renewed in a hidden frame with nothing shown, and what waited is sent again', async () => {
	const product = new SessionProduct();
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
	const product = new SessionProduct({ platform: false });
	const session = product.session();
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
});

test('the dialog cannot be dismissed, and what the page asks for meanwhile waits behind it and is sent once renewed', async () => {
	const product = new SessionProduct({ platform: false });
	const bar = new ui.FamilyBar({ product: 'conduict', brand: { src: '/w.svg', href: '/' } }).mount(document.body);
	const session = product.session({ other: () => {} });
	const write = session.lost({ replay: 'write' });
	await product.land();
	await page.until(() => dialog()?.open);
	assert.equal(dialog().querySelector('.bui-dialog-head .bui-icon-button'), null, 'no close button');
	assert.equal(dialog().getAttribute('closedby'), 'none');
	page.key(dialog(), 'Escape');
	dialog().dispatchEvent(new window.Event('cancel', { cancelable: true }));
	dialog().dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
	assert.ok(dialog().open, 'neither Escape, a close request nor a press outside closes it');
	assert.equal(session.state, 'asking');
	assert.ok(button('Use another account') && button('Continue as Ada'), 'it offers a way on instead');
	assert.equal(document.documentElement.dataset.session, undefined, 'the page is never marked as read without a session');
	assert.equal(bar.element.querySelector('.bui-family-signin'), null, 'the bar offers no Sign in of its own');
	assert.ok(bar.element.querySelector('.bui-family-account'), 'the account menu stays');
	// A page opened while the dialog asks (the browser's Back, a list that loads) waits instead of failing
	const read = session.lost({ replay: 'read' });
	const destructive = session.lost({ replay: false });
	button('Continue as Ada').click();
	button('Cancel').click();
	assert.equal(session.notice.phase, 'idle', 'cancelling the window returns to the dialog, never to the page');
	assert.ok(dialog().open);
	button('Continue as Ada').click();
	product.signin();
	assert.deepEqual(await Promise.all([write, read, destructive]), [true, true, false]);
	assert.equal(session.state, 'signed');
	session.destroy();
	bar.destroy();
});

test('a revoked session hides the page and cannot be closed; a suspended account is offered no sign-in', async () => {
	const product = new SessionProduct({ platform: false, ended: 'revoked' });
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

	const suspended = new SessionProduct({ reason: 'suspended' });
	let other = 0;
	const blocked = suspended.session({ accounts: 'https://accounts.example/account', other: () => (other += 1) });
	assert.equal(await blocked.lost({ reason: 'suspended', replay: 'read' }), false);
	assert.equal(blocked.state, 'ended');
	assert.equal(document.querySelector('iframe'), null, 'no renewal is tried for a suspended account');
	assert.equal(dialog().querySelector('.bui-dialog-title').textContent, 'Your Beyond account is suspended');
	assert.equal(button('Open Beyond Accounts')?.getAttribute('href'), 'https://accounts.example/account');
	assert.equal([...dialog().querySelectorAll('button')].filter(node => /Continue|Sign in/.test(node.textContent)).length, 0);
	page.key(dialog(), 'Escape');
	assert.ok(dialog().open, 'it cannot be closed');
	button('Use another account').click();
	assert.equal(other, 1, 'Use another account is its way on besides Beyond Accounts');
	blocked.destroy();
});

test('someone else signing in drops what was held and starts the product again for them', async () => {
	const product = new SessionProduct({ platform: false });
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
	const product = new SessionProduct();
	product.answer = { state: 'ended', reason: 'expired' };
	const session = product.session({ read: async () => Promise.reject(new Error('down')) });
	void session.lost({});
	await page.until(() => document.querySelector('iframe'));
	await page.until(() => dialog()?.open, 2000);
	assert.equal(session.kind, 'unavailable');
	assert.equal(dialog().querySelector('.bui-dialog-title').textContent, 'Beyond Accounts is not answering');
	assert.match(dialog().textContent, /This page tries again by itself/);
	assert.ok(button('Try again'));
	assert.equal(dialog().querySelector('.bui-dialog-head .bui-icon-button'), null, 'it cannot be closed either');
	page.key(dialog(), 'Escape');
	assert.ok(dialog().open);
	session.destroy();
});

test('a loop ends in the dialog: a second loss within the pause does not renew silently again', async () => {
	const product = new SessionProduct();
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

test('a look at the session finds it ended before the person acts, and answers with the state', async () => {
	const product = new SessionProduct({ platform: false });
	const session = product.session();
	assert.equal(await session.check(), 'renewing', 'a dropped live transport learns the session speaks, not it');
	await product.land();
	await page.until(() => dialog()?.open);
	assert.equal(session.state, 'asking');
	assert.equal(await session.check(), 'asking');
	session.destroy();

	const signed = new SessionProduct();
	signed.signin();
	const kept = signed.session();
	assert.equal(await kept.check(), 'signed', 'a signed session lets the transport say it is reconnecting');
	kept.destroy();
});

test('Spanish copy for the dialog', async () => {
	const product = new SessionProduct({ platform: false });
	const session = product.session({ labels: ui.Session.labels.es });
	void session.lost({});
	await product.land();
	await page.until(() => dialog()?.open);
	assert.equal(dialog().querySelector('.bui-dialog-title').textContent, 'Vuelve a iniciar sesión para continuar');
	assert.ok(button('Continuar como Ada'));
	session.destroy();
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

test('a dialog shown for an expired session and hidden by a renewal is not reused for a revoked one: the page is hidden', async () => {
	const product = new SessionProduct({ platform: false });
	const session = product.session();
	const first = session.lost({ replay: 'read' });
	await product.land();
	await page.until(() => dialog()?.open);
	assert.ok(!dialog().classList.contains('bui-session-opaque'));
	button('Continue as Ada').click();
	product.signin();
	assert.equal(await first, true);
	product.answer = { state: 'ended', reason: 'revoked' };
	void session.lost({ reason: 'revoked' });
	await page.until(() => dialog()?.open, 4000);
	assert.ok(dialog().classList.contains('bui-session-opaque'), 'the revoked dialog hides the page');
	assert.equal(dialog().querySelector('.bui-dialog-head .bui-icon-button'), null, 'and cannot be closed');
	session.destroy();
});
