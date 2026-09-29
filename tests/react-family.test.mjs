import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { inside, outside } from './fixtures/family.mjs';

/** The React adapter of the family patterns: FamilyBar, ProductNav, Unavailable and availability. */
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
	assert.equal(bar.querySelector('[data-part="project"]'), null, 'the new descriptor is drawn');
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
