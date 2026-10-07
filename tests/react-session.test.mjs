import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';

/** `useSession` in React (0.8.0; since 0.9.0 the bar has no "Sign in": the dialog cannot be dismissed). */
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

test('useSession creates one Session once someone is signed in; its dialog cannot be dismissed and the bar keeps its account menu', async () => {
	let current = null;
	let returned = null;
	const ada = { id: 'acc_ada', name: 'Ada Lovelace' };
	function Product({ person }) {
		returned = ui.useSession({ product: 'delegate', person, read: async () => ({ state: 'ended', reason: 'expired' }), start: mode => (mode === 'silent' ? null : `about:blank#${mode}`) });
		current = returned.session;
		return h(ui.FamilyBar, { product: 'delegate', brand: { src: '/w.svg', href: '/' } });
	}
	await act(() => root.render(h(StrictMode, null, h(Product, { person: null }))));
	assert.equal(current, null, 'no session before someone is signed in');
	assert.deepEqual(Object.keys(returned), ['session']);
	await act(() => root.render(h(StrictMode, null, h(Product, { person: ada }))));
	assert.ok(current && !current.destroyed);
	void current.lost({ replay: 'read' });
	await act(() => page.until(() => document.querySelector('dialog.bui-session')?.open));
	await act(async () => page.key(document.querySelector('dialog.bui-session'), 'Escape'));
	assert.ok(document.querySelector('dialog.bui-session')?.open, 'Escape does not close it');
	assert.equal(current.state, 'asking');
	assert.equal(host.querySelector('.bui-family-signin'), null);
	await act(() => root.unmount());
	root = null;
	assert.ok(current.destroyed, 'unmounting destroys it');
});
