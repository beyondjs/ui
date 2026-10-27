import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * The React forms of what a page holds while its object's first read runs (0.44.0, LOAD-01, D185): the
 * DOM classes' markup for a pending title, a reserved action, a facts line holding a control, a waiting part
 * of a section and a held arrival line, the title's focus kept until it lands, and the sidebar's objects
 * waiting through `Sidebar`. Under `StrictMode`, so the development double-mount is part of every case.
 */
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const dom = await import('@beyond-js/ui/dom');
const ui = await import('@beyond-js/ui/react');
const h = React.createElement;
const { act, StrictMode, createRef } = React;
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
/** Tag, sorted attributes (ids replaced) and children: the markup without attribute order or generated ids. */
const shape = node => (node.nodeType === 3 ? node.textContent : { tag: node.tagName, attributes: [...node.attributes].map(({ name, value }) => `${name}=${/^(id|aria-labelledby)$/.test(name) ? 'id' : value}`).sort(), children: [...node.childNodes].map(shape) });
/** The DOM element without the parts it keeps hidden, which React leaves out */
const shown = element => {
	for (const node of element.querySelectorAll('[hidden]')) node.remove();
	return element;
};

test('PageHeader waiting, a Reserved action and a facts line holding a control: the DOM header\'s markup', async () => {
	await render(h(ui.PageHeader, { title: null, waiting: true, facts: h('span', null, 'Compared with'), actions: h(ui.Reserved, null, h(ui.Button, { label: 'Restore', variant: 'primary' })) }));
	const expected = new dom.PageHeader({ title: null, waiting: true, facts: [dom.el('span', { text: 'Compared with' })], actions: [dom.reserved(new dom.Button({ label: 'Restore', variant: 'primary' }))] });
	assert.deepEqual(shape(host.firstElementChild), shape(shown(expected.element)));
	assert.equal(host.querySelector('.bui-page-facts').tagName, 'DIV');
	await render(h(ui.PageHeader, { title: 'Snapshot', facts: h('span', null, 'Compared with'), actions: h(ui.Button, { label: 'Restore', variant: 'primary' }) }));
	const settled = new dom.PageHeader({ title: 'Snapshot', facts: [dom.el('span', { text: 'Compared with' })], actions: [new dom.Button({ label: 'Restore', variant: 'primary' })] });
	assert.deepEqual(shape(host.firstElementChild), shape(shown(settled.element)), 'and once read');
	await render(h(ui.PageHeader, { title: null, waiting: true, labels: ui.PageHeader.labels.es }));
	assert.equal(host.querySelector('.bui-page-heading .bui-hidden').textContent, 'Cargando…');
});

test('a focus asked of a pending title through headingRef lands once the title does', async () => {
	const link = document.body.appendChild(dom.el('a', { href: '#/web', text: 'web' }));
	const heading = createRef();
	await render(h(ui.PageHeader, { title: null, waiting: true, headingRef: heading, compact: true }));
	assert.equal(heading.current.hasAttribute('tabindex'), false);
	link.focus();
	heading.current.focus({ preventScroll: true });
	assert.equal(document.activeElement, link, 'nothing named "Loading…" takes the focus');
	await render(h(ui.PageHeader, { title: 'web', headingRef: heading, compact: true }));
	assert.equal(document.activeElement, heading.current, 'the focus lands with the title');
	assert.equal(heading.current.getAttribute('tabindex'), '-1');
	assert.equal(host.querySelector('.bui-page-compact-title').textContent, 'web');
	await render(h(ui.PageHeader, { title: null, waiting: true, headingRef: heading }));
	await act(() => root.unmount());
	root = null;
	assert.equal(heading.current, null, 'the ref is cleared on unmount');
});

test('Reserved holds the action inert and hidden from assistive technology', async () => {
	await render(h(ui.Reserved, null, h('button', { type: 'button' }, 'Open')));
	const held = host.firstElementChild;
	assert.deepEqual(shape(held), shape(dom.reserved(dom.el('button', { type: 'button', text: 'Open' }))));
});

test('SectionPart waits beside what is drawn, the Section busy while it waits, with the DOM section\'s markup', async () => {
	const view = waiting => h(ui.Section, { title: 'Devices' }, h('button', { type: 'button' }, 'Sign out of other devices'), h(ui.SectionPart, { waiting }, h('ul', null, h('li', null, 'This Mac'))));
	await render(view({ rows: 2 }));
	const section = new dom.Section({ title: 'Devices' });
	const part = section.part({ waiting: { rows: 2 } });
	section.children = [dom.el('button', { type: 'button', text: 'Sign out of other devices' }), part.element];
	assert.deepEqual(shape(host.firstElementChild), shape(section.element));
	assert.equal(host.firstElementChild.getAttribute('aria-busy'), 'true');
	await render(view(null));
	assert.equal(host.firstElementChild.hasAttribute('aria-busy'), false, 'not busy once read');
	assert.equal(host.querySelector('.bui-section-part').textContent, 'This Mac');
	await render(view(true));
	assert.equal(host.firstElementChild.getAttribute('aria-busy'), 'true', 'waits again');
	await render(h(ui.Section, { title: 'Devices', unavailable: true }, h(ui.SectionPart, { waiting: true })));
	assert.equal(host.firstElementChild.hasAttribute('aria-busy'), false, 'an outage takes the body');
	await render(h(ui.SectionPart, { waiting: true }));
	assert.equal(host.querySelector('.bui-waiting') !== null, true, 'outside a section it still draws its wait');
});

test('Arrival with no way back yet holds its place unseen, then shows', async () => {
	await render(h(ui.Arrival, { product: 'Beyond Projects', href: null }));
	const line = () => host.querySelector('.bui-arrival');
	assert.deepEqual(['data-held', 'inert', 'aria-hidden'].map(name => line().hasAttribute(name)), [true, true, true]);
	await render(h(ui.Arrival, { product: 'Beyond Projects', href: '/projects/p1' }));
	assert.deepEqual(['data-held', 'inert', 'aria-hidden'].map(name => line().hasAttribute(name)), [false, false, false]);
	assert.equal(line().querySelector('a').getAttribute('href'), '/projects/p1');
});

test('Sidebar objects wait in their groups\' place through React', async () => {
	const view = state => h(ui.Sidebar, { product: 'Beyond Home', groups: [{ kind: 'object', key: 'projects', heading: 'Projects', ...state }] });
	await render(view({ waiting: true }));
	const group = () => host.querySelector('.bui-sidebar-panel .bui-sidebar-object');
	assert.equal(group().getAttribute('aria-busy'), 'true');
	assert.equal(group().querySelector('.bui-waiting [role="status"]').textContent, 'Loading…');
	await render(view({ groups: [{ kind: 'entries', key: 'all', items: [{ key: 'a', label: 'Storefront', href: '#/a' }] }] }));
	await act(() => new Promise(resolve => setTimeout(resolve, 0)));
	assert.equal(group().querySelector('.bui-waiting'), null);
	assert.equal(group().hasAttribute('aria-busy'), false);
});
