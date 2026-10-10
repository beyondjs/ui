import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';

/**
 * React parity of 0.14.0: the thread template's dock, the Sidebar's objects (their search read from the
 * latest props) and its shortcut, the Composer's tray, commands, recall and dictation option, a wide rail item.
 */
const page = new Window();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
const h = React.createElement;
const { act } = React;
let root = null;
let host = null;

after(() => page.close());
beforeEach(async () => {
	if (root) await act(() => root.unmount());
	page.reset();
	page.window.localStorage.clear();
	page.window.happyDOM.setViewport({ width: 1280, height: 800 });
	host = document.body.appendChild(document.createElement('div'));
	root = createRoot(host);
});
const settle = (ms = 0) => act(() => new Promise(resolve => setTimeout(resolve, ms)));

test('Page: the thread template docks React content as the DOM page does, with its end mark; a dock elsewhere is refused', async () => {
	await act(() => root.render(h(ui.Page, { template: 'thread', dock: h('p', { id: 'docked' }, 'Composer') }, h('p', null, 'The thread'))));
	const region = host.querySelector('.bui-page');
	assert.equal(region.dataset.width, 'thread');
	const main = host.querySelector('.bui-page-main');
	assert.equal(main.lastElementChild.className, 'bui-page-dock-end');
	assert.equal(main.lastElementChild.previousElementSibling.querySelector('#docked').textContent, 'Composer');
	assert.throws(() => ui.Page({ template: 'detail', dock: h('p') }), /thread template/);
});

test('Sidebar: an object group with its action and its search, whose source is read from the latest props; the shortcut as an option', async () => {
	const asked = [];
	const render = name => h(ui.Sidebar, { product: 'Conduict', shortcut: true, groups: [{ kind: 'object', key: 'conversations', heading: 'Conversations', action: { label: 'New', href: '#/new' }, search: { label: 'Search conversations', delay: 0, source: ({ query }) => (asked.push(`${name}:${query}`), []) }, groups: [{ kind: 'entries', key: 'recent', heading: 'Recent', items: [{ key: 'c1', label: 'Fix it', href: '#/c1' }] }] }] });
	await act(() => root.render(render('first')));
	await act(() => root.render(render('second')));
	const nav = host.querySelector('.bui-sidebar-panel nav');
	assert.equal(nav.querySelector('.bui-sidebar-object-action').textContent, 'New');
	page.key(document.body, 'k', { ctrlKey: true });
	const field = nav.querySelector('.bui-sidebar-object-head input');
	assert.equal(document.activeElement, field);
	field.value = 'fix';
	field.dispatchEvent(new page.window.Event('input', { bubbles: true }));
	await settle(5);
	assert.deepEqual(asked, ['second:fix'], 'the latest source');
	nav.querySelector('.bui-sidebar-fold').click();
	assert.equal(page.window.localStorage.getItem('bui-sidebar:Conduict:recent'), 'folded');
});

test('Composer: a tray of React content on the box’s lower edge, commands from the latest props, recall and Dictate', async () => {
	const ran = [];
	const make = (word, tray) =>
		h(ui.Composer, { label: 'Message', onSubmit: () => Promise.resolve(), tray, commands: [{ value: '/model', label: 'Model', run: () => ran.push(word) }], recall: () => `last ${word}` });
	await act(() => root.render(make('one', h('button', { type: 'button', id: 'chip' }, 'web · Ready'))));
	await act(() => root.render(make('two', h('button', { type: 'button', id: 'chip' }, 'web · Ready'))));
	const tray = host.querySelector('.bui-composer-tray');
	assert.equal(tray.hidden, false);
	assert.equal(tray.querySelector('#chip').textContent, 'web · Ready');
	const field = host.querySelector('textarea');
	field.value = '/mo';
	field.setSelectionRange(3, 3);
	field.dispatchEvent(new page.window.Event('input', { bubbles: true }));
	await settle(5);
	page.key(field, 'Enter');
	assert.deepEqual(ran, ['two'], 'the latest command');
	assert.equal(field.value, '');
	page.key(field, 'ArrowUp');
	await settle();
	assert.equal(field.value, 'last two');
	await act(() => root.render(make('two', null)));
	assert.equal(host.querySelector('.bui-composer-tray').hidden, true, 'the tray leaves');
	await act(() => root.render(h(ui.Composer, { label: 'Message', onSubmit: () => Promise.resolve(), dictation: { transcribe: async () => ({ text: '' }) } })));
	assert.ok(host.querySelector('.bui-dictation-button'), 'Dictate is drawn (offered where the browser can record)');
});

test('RailItem takes wide; ActionLine and Highlighter are public in React', async () => {
	await act(() => root.render(h(ui.Rail, null, h(ui.RailItem, { wide: true }, h('pre', null, 'npm test')))));
	assert.ok(host.querySelector('.bui-rail-item').hasAttribute('data-wide'));
	assert.equal(typeof ui.ActionLine, 'function');
	assert.equal(typeof ui.Highlighter, 'function');
	assert.equal(typeof ui.ComposerDictation, 'function');
	assert.equal(typeof ui.PageDock, 'function');
});
