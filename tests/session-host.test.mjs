import { test, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** `Session` where a host or a shell asks the person: the Beyond Desktop (`delegate`, 0.9.0) and an installed shell's own sign-in (`signin`, 0.8.2). */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const { SessionProduct } = await import('./support/session.mjs');
SessionProduct.context = { ui, page };
after(() => page.close());
beforeEach(() => page.reset());
const { dialog, button } = SessionProduct;

test('a host that asks for the window (the Desktop): its no ends the session with nothing shown', async () => {
	const product = new SessionProduct({ platform: false });
	const asked = [];
	const session = product.session({ silent: false, delegate: async request => (asked.push(request), false) });
	const read = session.lost({ reason: 'expired', replay: 'read' });
	assert.equal(await read, false, 'nothing held is sent into a window that is closing');
	assert.equal(session.state, 'ended');
	assert.equal(asked.length, 1);
	assert.equal(asked[0].address, 'about:blank#window');
	assert.equal(dialog(), null, 'the product never shows its own dialog in a frame');
	assert.equal(await session.lost({ replay: 'read' }), false);
	session.destroy();
});

test('a host that does not answer is asked again by itself, and its yes is confirmed with the product\'s read', async () => {
	mock.timers.enable({ apis: ['setTimeout'] });
	try {
		const product = new SessionProduct({ platform: false });
		let asked = 0;
		const session = product.session({
			silent: false,
			delegate: async () => {
				asked += 1;
				if (asked === 1) throw new Error('the host did not answer');
				product.signin();
				return true;
			}
		});
		const read = session.lost({ reason: 'expired', replay: 'read' });
		for (let turn = 0; turn < 20 && asked < 1; turn += 1) await Promise.resolve();
		await new Promise(resolve => setImmediate(resolve));
		assert.equal(asked, 1);
		assert.equal(session.state, 'asking', 'still asking, never open without a session');
		mock.timers.tick(5_000);
		assert.equal(await read, true);
		assert.equal(asked, 2);
		assert.equal(session.state, 'signed');
		assert.equal(dialog(), null);
		session.destroy();
	} finally {
		mock.timers.reset();
	}
});

test('a product\'s own sign-in behind Continue (an installed shell): the same dialog, then the page continues', async () => {
	const product = new SessionProduct({ platform: false });
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
