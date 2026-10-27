import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Notices } from './fixtures/notices.mjs';

/**
 * React's parts for the list rules (0.39.0): `NotificationInbox`'s toolbar in a caller's outlet (L8),
 * `useRowKeys` on a product's own `ul.bui-rows` (L7) and `EndLine` after it (L5), in StrictMode.
 */
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
const dom = await import('@beyond-js/ui/dom');
const { act, StrictMode } = React;
const h = React.createElement;
let root;
let host;

beforeEach(async () => {
	if (root) await act(() => root.unmount());
	page.reset();
	host = document.createElement('div');
	document.body.append(host);
	root = createRoot(host);
});
after(async () => {
	if (root) await act(() => root.unmount());
	await page.close();
});
const render = view => act(() => root.render(h(StrictMode, null, view)));
const outlet = () => {
	const element = document.createElement('div');
	document.body.prepend(element);
	return element;
};
const products = { delegate: 'Delegate', cdn: 'CDN' };

test('NotificationInbox places its one toolbar in the outlet, moves it and releases it', async () => {
	const adapter = new Notices().adapter;
	const first = outlet();
	const second = outlet();
	await render(h(ui.NotificationInbox, { adapter, products, tools: 'external', toolsTarget: first }));
	await act(() => page.until(() => first.querySelector('.bui-inbox-tools')));
	const toolbar = first.firstElementChild;
	assert.equal(host.querySelector('.bui-inbox-tools'), null, 'nothing of it in the inbox');
	await render(h(ui.NotificationInbox, { adapter, products, tools: 'external', toolsTarget: second }));
	assert.equal(first.children.length, 0);
	assert.ok(second.firstElementChild === toolbar, 'the same toolbar, moved');
	await render(h(ui.NotificationInbox, { adapter, products }));
	await act(() => page.until(() => host.querySelector('.bui-inbox-tools')));
	assert.equal(second.children.length, 0, 'inline again, the outlet is left empty');
	await act(() => root.unmount());
	root = null;
	assert.equal(document.querySelector('.bui-inbox-tools'), null);
});

test('NotificationInbox in Spanish says a filtered empty for its product', async () => {
	const notices = new Notices();
	await render(h(ui.NotificationInbox, { adapter: notices.adapter, products, labels: ui.NotificationInbox.labels.es, state: { state: 'unread', product: 'cdn' } }));
	await act(() => page.until(() => host.querySelector('.bui-empty')));
	assert.equal(host.querySelector('.bui-empty-title').textContent, 'Nada sin leer de CDN.');
});

function Devices({ names }) {
	const keys = ui.useRowKeys();
	return h(React.Fragment, null,
		h('ul', { className: 'bui-rows', ref: keys }, names.map(name => h('li', { key: name, className: 'bui-row' }, h('a', { className: 'bui-row-title', href: `#${name}` }, name)))),
		h(ui.EndLine, { keys: names.length > 1 }));
}

test('useRowKeys moves between a product\'s own rows and lets go when the list leaves', async () => {
	await render(h(Devices, { names: ['Laptop', 'Phone', 'Tablet'] }));
	const links = [...host.querySelectorAll('.bui-row-title')];
	links[0].focus();
	page.key(links[0], 'ArrowDown');
	assert.equal(document.activeElement, links[1]);
	page.key(links[1], 'End');
	assert.equal(document.activeElement, links[2]);
	page.key(links[2], 'ArrowUp', { shiftKey: true });
	assert.equal(document.activeElement, links[2], 'a key with a modifier keeps its own meaning');
	const list = host.querySelector('ul');
	await act(() => root.unmount());
	root = null;
	document.body.append(list);
	const kept = [...list.querySelectorAll('.bui-row-title')];
	kept[0].focus();
	page.key(kept[0], 'ArrowDown');
	assert.equal(document.activeElement, kept[0], 'released when the list left');
	list.remove();
});

test('EndLine draws the DOM end line\'s markup, its keys only when asked, and Spanish', async () => {
	await render(h(Devices, { names: ['Laptop', 'Phone'] }));
	assert.equal(host.querySelector('.bui-rows-end').outerHTML, new dom.EndLine({ keys: true }).element.outerHTML);
	await render(h(Devices, { names: ['Laptop'] }));
	assert.equal(host.querySelector('.bui-rows-keys'), null);
	await render(h(ui.EndLine, { text: 'Nada anterior.', keys: true, labels: ui.EndLine.labels.es }));
	assert.equal(host.querySelector('.bui-rows-end').textContent, 'Nada anterior.↑ ↓ para moverte · Enter para abrir');
});
