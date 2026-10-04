import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { start, minute, at, preparing, blocked } from './fixtures/operations.mjs';
import { Listeners } from './support/listeners.mjs';
import { leaving } from './fixtures/family.mjs';

/** The React adapter of 0.5.0: the long-operation components, the sign-out of Beyond and the Select's whole name. */
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const dom = await import('@beyond-js/ui/dom');
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

const render = element => act(() => root.render(h(StrictMode, null, element)));
function clock(minutes) {
	let now = start + minutes * minute;
	const made = new ui.Clock({ now: () => now });
	made.at = value => act(() => {
		now = start + value * minute;
		made.tick();
	});
	return made;
}

test('Steps and Awaited render the DOM classes, follow their props and the clock, and leave one instance under StrictMode', async () => {
	const moving = clock(3);
	const ends = [];
	const view = (steps, ended = null) => h('div', null, h(ui.Steps, { label: 'Preparing', steps, clock: moving }), h(ui.Awaited, { title: 'Starting My first VM', since: at(2), expected: { median: 3 * minute, p90: 5 * minute }, steps, clock: moving, ended, onEnd: outcome => ends.push(outcome) }));
	await render(view(preparing));
	assert.equal(document.querySelectorAll('.bui-awaited').length, 1, 'development double mount leaves one card');
	assert.equal(document.querySelectorAll('.bui-steps').length, 2);
	assert.equal(document.querySelector('.bui-awaited-time').textContent, 'About 2 min left');
	await moving.at(7.5);
	assert.equal(document.querySelector('.bui-awaited-time').textContent, 'Taking longer than usual');
	await render(view(blocked));
	assert.equal(document.querySelector('.bui-steps [data-state="stalled"]').dataset.state, 'stalled');
	await render(view(blocked, 'done'));
	assert.equal(document.querySelector('.bui-awaited').dataset.state, 'done');
	assert.deepEqual(ends, ['done']);
	await act(() => root.unmount());
	root = null;
	assert.equal(moving.size, 0, 'unmounting releases the clock');
});

test('Awaited calls the latest check and reason action; Freshness and TechnicalDetails follow their props', async () => {
	const moving = clock(10);
	const calls = [];
	const view = tag => h('div', null,
		h(ui.Awaited, { title: 'Starting', since: at(0), expected: { median: minute, p90: 2 * minute }, clock: moving, check: async () => calls.push(`check:${tag}`), reason: { text: 'Cannot reach it.', action: { label: 'Open the estate', onSelect: () => calls.push(`way:${tag}`) } } }),
		h(ui.Freshness, { label: tag === 'b' ? 'Stopped' : 'Running', tone: 'success', checked: at(8), connected: tag === 'b' ? false : true, clock: moving }),
		h(ui.TechnicalDetails, { text: `words ${tag}`, request: 'req_1', time: at(9) }));
	await render(view('a'));
	await render(view('b'));
	await act(async () => document.querySelector('.bui-awaited-actions button').click());
	await act(async () => document.querySelector('.bui-awaited-reason .bui-button-primary').click());
	assert.deepEqual(calls, ['check:b', 'way:b']);
	assert.match(document.querySelector('.bui-freshness').textContent, /^Last known: Stopped · \d\d:\d\d$/);
	assert.equal(document.querySelector('.bui-details-text').textContent, 'words b');
});

test('FamilyBar: the { end, before, after } sign-out calls the latest props and goes to /leave', async () => {
	page.window.happyDOM.setURL('http://localhost/app?project=prj_shop');
	const visits = [];
	page.window.location.assign = address => visits.push(address);
	const calls = [];
	const view = tag => h(ui.FamilyBar, { product: 'cdn', brand: { src: '/w.svg', href: '/' }, descriptor: leaving, account: { signout: { before: () => (calls.push(`before:${tag}`), true), end: () => calls.push(`end:${tag}`) } } });
	await render(view('a'));
	await render(view('b'));
	assert.equal(document.querySelectorAll('.bui-family').length, 1, 'a new function is not a new bar');
	await act(async () => document.querySelector('.bui-family-signout').click());
	await page.until(() => visits.length);
	assert.deepEqual(calls, ['before:b', 'end:b']);
	const left = new URL(visits[0]);
	assert.equal(left.searchParams.get('product'), 'cdn');
	assert.equal(left.searchParams.get('return'), 'http://localhost/app?project=prj_shop');
});

test('FamilyBar: one sign-out entry in the open menu when the label changes as the descriptor arrives, after closings; unmounting leaves no listener', async t => {
	// The package's stylesheet floats the panels, so a closing panel leaves a picture of itself
	const style = document.createElement('style');
	style.textContent = '.bui-disclosure-panel { position: absolute; }';
	document.head.append(style);
	const listeners = new Listeners(page.window).install();
	t.after(() => (style.remove(), listeners.uninstall()));
	const signout = { before: () => true, end: () => {} };
	const items = [{ label: 'Workspace preferences', onSelect: () => {} }];
	// As Workspace drew it: "Sign out" while the descriptor loads, "Sign out of Beyond" once it names /leave
	const view = descriptor => h(ui.FamilyBar, { product: 'workspace', brand: { src: '/w.svg', href: '/' }, descriptor, account: { signout, label: descriptor ? null : 'Sign out', items } });
	const button = () => document.querySelector('.bui-family [data-part="account"] .bui-navmenu-button');
	const opened = async () => {
		if (button().getAttribute('aria-expanded') !== 'true') await act(async () => button().click());
		return document.querySelectorAll('.bui-family .bui-family-signout');
	};
	await render(view(null));
	await opened();
	await act(async () => page.key(button(), 'Escape'));
	await opened();
	await act(async () => [...document.querySelectorAll('.bui-family [data-part="account"] .bui-navmenu-item')].find(node => node.textContent === items[0].label).click());
	assert.equal((await opened()).length, 1, 'the open menu holds one sign-out entry, not pictures of earlier closings');
	assert.equal((await opened())[0].textContent, 'Sign out');
	await act(async () => page.key(button(), 'Escape'));
	await render(view(leaving));
	assert.equal(document.querySelectorAll('.bui-family').length, 1, 'the bar made again replaces the first');
	const entries = await opened();
	assert.equal(entries.length, 1, 'one entry once the descriptor arrived and the label changed');
	assert.equal(entries[0].textContent, 'Sign out of Beyond');
	await act(async () => page.key(button(), 'Escape'));
	await act(() => root.unmount());
	root = null;
	assert.equal(document.querySelectorAll('.bui-family, .bui-family-signout').length, 0, 'nothing of either bar is left, pictures included');
	await new Promise(resolve => setTimeout(resolve, 0));
	assert.deepEqual(listeners.present(), [], 'no listener left on the document or the window');
});

test('Select keeps the DOM markup and shows a cut chosen text whole', async () => {
	const shape = node => (node.nodeType === 3 ? node.textContent : { tag: node.tagName, attributes: [...node.attributes].map(({ name, value }) => `${name}=${value}`).sort(), children: [...node.childNodes].map(shape) });
	const options = [{ value: 'b', label: 'A very long environment name' }];
	await render(h(ui.Select, { options, defaultValue: 'b' }));
	const made = new dom.Select({ options });
	assert.deepEqual(shape(host.querySelector('.bui-select')), shape(made.element));
	made.destroy();
	const saved = page.window.HTMLCanvasElement.prototype.getContext;
	page.window.HTMLCanvasElement.prototype.getContext = () => ({ font: '', measureText: text => ({ width: text.length * 8 }) });
	const control = host.querySelector('select');
	Object.defineProperty(control, 'clientWidth', { value: 120, configurable: true });
	control.focus();
	const shown = [...document.querySelectorAll('.bui-tooltip')].filter(node => !node.hidden);
	assert.deepEqual(shown.map(node => node.textContent), ['A very long environment name']);
	await act(() => root.unmount());
	root = null;
	assert.equal(document.querySelectorAll('.bui-tooltip').length, 0, 'unmounting removes the tooltip');
	page.window.HTMLCanvasElement.prototype.getContext = saved;
});
