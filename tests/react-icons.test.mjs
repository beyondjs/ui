import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Shelf } from './fixtures/shelf.mjs';

/** The React side of the icon catalog and of Preferences: `Icon` renders the DOM markup; `usePreferences` follows changes. */
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
const shape = node => (node.nodeType === 3 ? node.textContent : { tag: node.tagName, attributes: [...node.attributes].map(({ name, value }) => `${name}=${value}`).sort(), children: [...node.childNodes].map(shape) });

test('Icon renders the markup of the DOM icon for every name, size and label', async () => {
	assert.ok(ui.icons === dom.icons && ui.unlabeled === dom.unlabeled, 'one catalog');
	await render(h('div', null, ...ui.icons.map(name => h(ui.Icon, { key: name, name }))));
	const drawn = [...host.firstChild.children];
	assert.equal(drawn.length, ui.icons.length);
	drawn.forEach((svg, index) => assert.deepEqual(shape(svg), shape(dom.icon(ui.icons[index]))));
	await render(h('div', null, h(ui.Icon, { name: 'bell', size: 24, label: 'Notifications' }), h(ui.Icon, { name: 'close', size: 16 })));
	const [named, small] = host.firstChild.children;
	assert.deepEqual(shape(named), shape(dom.icon('bell', { size: 24, label: 'Notifications' })));
	assert.equal(named.getAttribute('role'), 'img');
	assert.equal(small.getAttribute('data-size'), '16');
});

test('Icon fails clearly on an unknown name or size', () => {
	// Icon is a plain function component: the failure is thrown while it renders.
	assert.throws(() => ui.Icon({ name: 'trash' }), /Unknown icon "trash"/);
	assert.throws(() => ui.Icon({ name: 'close', size: 18 }), RangeError);
	assert.throws(() => ui.Icon({ name: 'close', label: '' }), TypeError);
});

test('usePreferences re-renders with the values in effect and releases on unmount', async () => {
	const preferences = new dom.Preferences({ key: 'beyond-desktop', fallback: { appearance: 'light', locale: 'en' }, storage: new Shelf() });
	preferences.restore();
	const View = () => {
		const { appearance, locale } = ui.usePreferences(preferences);
		return h('p', null, `${appearance} ${locale}`);
	};
	await render(h(View));
	assert.equal(host.textContent, 'light en');
	await act(() => preferences.apply({ appearance: 'dark', locale: 'es' }));
	assert.equal(host.textContent, 'dark es');
	await act(() => preferences.choose({ appearance: 'system' }));
	assert.equal(host.textContent, 'system es');
	await act(() => root.unmount());
	root = null;
	preferences.choose({ appearance: 'dark' });
	assert.equal(document.documentElement.getAttribute('data-beyond-mode'), 'dark');
	document.documentElement.removeAttribute('data-beyond-mode');
	document.documentElement.removeAttribute('lang');
});
