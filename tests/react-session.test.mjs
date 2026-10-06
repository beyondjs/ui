import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';

/** `useSession` and the family bar's "Sign in" in React (0.8.0): one `Session`, the bar following it. */
const page = new Window();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
const h = React.createElement;
const { act, StrictMode } = React;
let root = null;
let host = null;

after(() => page.close());
beforeEach(async () => {
	if (root) await act(() => root.unmount());
	page.reset();
	host = document.createElement('div');
	document.body.append(host);
	root = createRoot(host);
});

test('useSession creates one Session once someone is signed in, and the bar offers Sign in while the person reads', async () => {
	let current = null;
	const ada = { id: 'acc_ada', name: 'Ada Lovelace' };
	function Product({ person }) {
		const { session, signin } = ui.useSession({ product: 'delegate', person, read: async () => ({ state: 'ended', reason: 'expired' }), start: mode => (mode === 'silent' ? null : `about:blank#${mode}`) });
		current = session;
		return h(ui.FamilyBar, { product: 'delegate', brand: { src: '/w.svg', href: '/' }, signin });
	}
	await act(() => root.render(h(StrictMode, null, h(Product, { person: null }))));
	assert.equal(current, null, 'no session before someone is signed in');
	await act(() => root.render(h(StrictMode, null, h(Product, { person: ada }))));
	assert.ok(current && !current.destroyed);
	const lost = current.lost({ replay: 'read' });
	await act(() => page.until(() => document.querySelector('dialog.bui-session')?.open));
	await act(async () => page.key(document.querySelector('dialog.bui-session'), 'Escape'));
	assert.equal(await lost, false);
	await act(() => page.until(() => host.querySelector('.bui-family-signin')));
	assert.equal(host.querySelector('.bui-family-account'), null);
	await act(async () => host.querySelector('.bui-family-signin').click());
	assert.ok(document.querySelector('dialog.bui-session')?.open, 'Sign in opens the dialog again');
	await act(() => root.unmount());
	root = null;
	assert.ok(current.destroyed, 'unmounting destroys it');
});
