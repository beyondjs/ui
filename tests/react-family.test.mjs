import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { inside, outside, annotated } from './fixtures/family.mjs';

/** The React adapter of the family patterns: FamilyBar, ProductNav, Sidebar, Unavailable and availability. */
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
const brand = { src: '/brand/wordmark.svg', href: '/own-home' };
/** Tag, sorted attributes (ids replaced) and children: the markup without attribute order or generated ids. */
const shape = node => (node.nodeType === 3 ? node.textContent : { tag: node.tagName, attributes: [...node.attributes].map(({ name, value }) => `${name}=${/^(id|aria-labelledby)$/.test(name) ? 'id' : value}`).sort(), children: [...node.childNodes].map(shape) });

test('FamilyBar renders the descriptor prop, puts React notifications in its slot and redraws on change', async () => {
	const labels = { home: 'Inicio de Beyond' };
	const view = descriptor => h(ui.FamilyBar, { product: 'delegate', brand, descriptor, labels, notifications: h('button', { type: 'button', className: 'bell' }, 'Avisos'), account: { signout: () => {} } });
	await render(view(null));
	assert.equal(document.querySelectorAll('.bui-family').length, 1, 'development double mount leaves one bar');
	const bar = document.querySelector('.bui-family');
	assert.equal(bar.dataset.state, 'loading');
	assert.equal(bar.querySelector('.bui-header-brand').getAttribute('aria-label'), 'Inicio de Beyond');
	await render(view(inside));
	assert.equal(bar.dataset.state, 'ready');
	assert.equal(bar.querySelector('.bui-header-brand').getAttribute('href'), inside.links.home);
	const end = [...bar.querySelector('.bui-family-end').children];
	assert.deepEqual(end.map(node => node.className), ['bui-family-docs', 'bui-slot', 'bui-disclosure bui-navmenu bui-family-account']);
	assert.equal(end[1].querySelector('.bell').textContent, 'Avisos');
	await render(view(outside));
	assert.equal(bar.querySelector('.bui-family-wide [data-part="project"] .bui-navmenu-button').textContent, 'Choose a project', 'the new descriptor is drawn');
	await render(view({ unavailable: true }));
	assert.equal(bar.dataset.state, 'unavailable');
});

test('FamilyBar calls the latest sign out, account entries and onNavigate', async () => {
	const calls = [];
	const view = tag => h(ui.FamilyBar, {
		product: 'delegate',
		brand,
		descriptor: inside,
		account: { signout: () => calls.push(`signout:${tag}`), items: [{ label: 'Shortcuts', onSelect: () => calls.push(`keys:${tag}`) }] },
		onNavigate: item => calls.push(`go:${tag}:${item.href}`)
	});
	await render(view('a'));
	await render(view('b'));
	const bar = document.querySelector('.bui-family');
	const stop = event => event.preventDefault();
	document.addEventListener('click', stop);
	await act(async () => bar.querySelector('.bui-header-brand').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })));
	document.removeEventListener('click', stop);
	await act(async () => [...bar.querySelectorAll('[data-part="account"] button.bui-navmenu-item')].find(node => node.textContent === 'Shortcuts').click());
	await act(async () => bar.querySelector('.bui-family-signout').click());
	assert.deepEqual(calls, [`go:b:${inside.links.home}`, 'keys:b', 'signout:b']);
	await act(() => root.unmount());
	root = null;
	assert.equal(document.querySelector('.bui-family'), null, 'unmounting removes the bar');
});

test('ProductNav follows its items prop and reports plain clicks', async () => {
	const seen = [];
	const view = current => h(ui.ProductNav, { label: 'Delegate', onNavigate: item => seen.push(item.href), items: [{ label: 'Requests', href: '/requests', current: current === 0 }, { label: 'Versions', href: '/versions', current: current === 1 }] });
	await render(view(0));
	assert.equal(document.querySelectorAll('.bui-productnav').length, 1);
	assert.equal(document.querySelector('.bui-productnav [aria-current]').textContent, 'Requests');
	await render(view(1));
	assert.equal(document.querySelector('.bui-productnav [aria-current]').textContent, 'Versions');
	await act(async () => document.querySelectorAll('.bui-productnav a')[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })));
	assert.deepEqual(seen, ['/requests']);
});

test('Unavailable renders the markup of the DOM class; availability is exported', async () => {
	const options = { title: 'Workspace is not open to you yet', reason: 'Development environments open by invitation.', owner: 'An owner of Northwind', code: 'NOT_ADMITTED', kind: 'association', level: 3 };
	await render(h(ui.Unavailable, { ...options, action: h('button', { type: 'button' }, 'Ask') }));
	const section = host.querySelector('section');
	const expected = new dom.Unavailable({ ...options, action: Object.assign(document.createElement('button'), { type: 'button', textContent: 'Ask' }) }).element;
	assert.deepEqual(shape(section), shape(expected));
	assert.equal(section.getAttribute('aria-labelledby'), section.querySelector('h3').id);
	assert.ok(ui.availability === dom.availability);
});

test('FamilyBar applies its notice prop and calls the latest action', async () => {
	const calls = [];
	const view = (text, tag) => h(ui.FamilyBar, { product: 'delegate', brand, descriptor: annotated, notice: text ? { text, action: { label: 'Try again', onSelect: () => calls.push(tag) } } : null, account: { signout: () => {} } });
	await render(view('Beyond Projects didn\'t answer.', 'a'));
	await render(view('Beyond Projects didn\'t answer.', 'b'));
	const bar = document.querySelector('.bui-family');
	const line = () => bar.querySelector('.bui-family-wide [data-part="project"] .bui-navmenu-notice');
	assert.equal(line().querySelector('span').textContent, 'Beyond Projects didn\'t answer.');
	await act(async () => line().querySelector('button').click());
	assert.deepEqual(calls, ['b']);
	await render(view(null));
	assert.equal(line(), null);
});

test('Sidebar renders its groups, follows its props and opens its drawer below the cut', async () => {
	const seen = [];
	const groups = current => [{ heading: 'Project', items: [{ label: 'Requests', href: '/requests', current: current === 0 }, { label: 'Versions', href: '/versions', current: current === 1 }] }];
	const view = (current, cut) => h('div', { className: 'bui-shell' }, h(ui.Sidebar, { product: 'Delegate', groups: groups(current), context: 'Storefront', cut, onNavigate: item => seen.push(item.href) }), h('main', null, 'content'));
	await render(view(0, 800));
	assert.equal(document.querySelectorAll('.bui-sidebar').length, 1, 'development double mount leaves one sidebar');
	const sidebar = document.querySelector('.bui-sidebar');
	assert.equal(sidebar.dataset.mode, 'permanent');
	assert.equal(sidebar.querySelector('.bui-sidebar-panel [aria-current="page"]').textContent, 'Requests');
	await render(view(1, 800));
	assert.equal(sidebar.querySelector('.bui-sidebar-panel [aria-current="page"]').textContent, 'Versions');
	assert.equal(sidebar.querySelector('.bui-sidebar-context-name').textContent, 'Storefront');
	await render(view(1, 1200));
	const drawer = document.querySelector('.bui-sidebar');
	assert.equal(drawer.dataset.mode, 'drawer', 'a new cut creates a new sidebar');
	await act(async () => drawer.querySelector('.bui-sidebar-button').click());
	assert.equal(drawer.querySelector('dialog').open, true);
	await act(async () => drawer.querySelector('dialog a[href="/requests"]').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })));
	assert.equal(drawer.querySelector('dialog').open, false);
	assert.deepEqual(seen, ['/requests']);
	await act(() => root.unmount());
	root = null;
	assert.equal(document.querySelector('.bui-sidebar'), null);
});
