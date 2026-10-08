import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';

/** The React forms of 0.11.0: Facts' markup equal to the DOM class's, Meter, ChoiceChip, the Composer's settings, state line, attachments and suggestions, the compact header and the panel's head and wide form. */
const page = new Window();
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
	page.window.happyDOM.setViewport({ width: 1280, height: 800 });
	host = document.createElement('div');
	document.body.append(host);
	root = createRoot(host);
});

const render = element => act(() => root.render(h(StrictMode, null, element)));
const shape = node => (node.nodeType === 3 ? node.textContent : { tag: node.tagName, attributes: [...node.attributes].map(({ name, value }) => `${name}=${/^(id|aria-labelledby)$/.test(name) ? 'id' : value}`).sort(), children: [...node.childNodes].map(shape) });
const wait = ms => act(() => new Promise(resolve => setTimeout(resolve, ms)));

test("Facts renders the DOM class's markup, its action React content", async () => {
	const head = { title: 'Changes', value: '3 files · +52 −3', state: ['Not pushed', 'warning'] };
	await render(h(ui.Facts, { head, rows: [{ key: 'branch', label: 'Branch', value: 'conduict/fix', mono: true, action: h('button', { type: 'button', className: 'copy' }, 'Copy') }, { key: 'state', label: 'State', value: 'Stopped', stale: 'Not reported since 23:10' }] }));
	const button = dom.el('button', { type: 'button', class: 'copy', text: 'Copy' });
	const expected = new dom.Facts({ head, rows: [{ key: 'branch', label: 'Branch', value: 'conduict/fix', mono: true, action: button }, { key: 'state', label: 'State', value: 'Stopped', stale: 'Not reported since 23:10' }] });
	assert.deepEqual(shape(host.firstElementChild), shape(expected.element));
	await render(h(ui.Facts, { label: 'Environment', rows: [{ label: 'State', value: 'Running', stale: true }] }));
	const plain = new dom.Facts({ label: 'Environment', rows: [{ label: 'State', value: 'Running', stale: true }] });
	assert.deepEqual(shape(host.firstElementChild), shape(plain.element));
	assert.equal(ui.Facts.labels.es.stale, 'No actualizado');
});

test('Meter is the DOM class, updated by its props', async () => {
	await render(h(ui.Meter, { label: '5-hour window', value: 0.5 }));
	assert.equal(document.querySelectorAll('.bui-meter').length, 1);
	const track = document.querySelector('[role="meter"]');
	assert.equal(track.getAttribute('aria-valuenow'), '50');
	await render(h(ui.Meter, { label: '5-hour window', value: 0.9, stale: '23:10' }));
	assert.equal(document.querySelector('.bui-meter').dataset.level, 'warning');
	assert.equal(document.querySelector('.bui-meter-note').textContent, 'Not reported since 23:10');
});

test('ChoiceChip: its own state and the latest onChange', async () => {
	const seen = [];
	const view = (tag, state) => h(ui.ChoiceChip, { label: 'Model', options: [{ value: 'a', label: 'Opus 5.5' }, { value: 'b', label: 'Sonnet 5' }], value: 'a', state, onChange: value => seen.push(`${tag}:${value}`) });
	await render(view('one', ['Needs a sign-in', 'warning']));
	assert.equal(document.querySelectorAll('.bui-chip').length, 1);
	assert.equal(document.querySelector('.bui-chip-state').textContent, 'Needs a sign-in');
	await render(view('two', null));
	assert.equal(document.querySelector('.bui-chip-state'), null);
	await act(() => document.querySelector('.bui-choice-button').click());
	await act(() => document.querySelectorAll('[role="menuitemradio"]')[1].click());
	assert.deepEqual(seen, ['two:b']);
});

test('Composer: settings and a status action as React content, a { label, onSelect } action, attachments and onFiles, onSuggest, all from the latest props', async () => {
	const ref = createRef();
	const log = [];
	const view = (tag, extra = {}) =>
		h(ui.Composer, {
			ref,
			label: 'Message to Claude Code',
			onSubmit: () => Promise.resolve(),
			settings: h('button', { type: 'button', className: 'model' }, `Model ${tag}`),
			status: { text: `My first VM is stopped (${tag})`, action: { label: 'Start', onSelect: () => log.push(`start:${tag}`) } },
			attach: { onFiles: (files, via) => log.push(`${tag}:${via}:${files.length}`), onRemove: item => log.push(`remove:${tag}:${item.key}`) },
			attachments: [{ key: 'a', name: 'a.png', state: 'ready' }],
			onSuggest: query => (log.push(`ask:${tag}:${query}`), [{ value: '@src/a.js' }]),
			suggest: { delay: 1 },
			...extra
		});
	await render(view('one'));
	await render(view('two'));
	assert.equal(document.querySelectorAll('.bui-composer').length, 1);
	assert.equal(document.querySelector('.bui-composer-settings .model').textContent, 'Model two');
	assert.equal(document.querySelector('.bui-composer-status').textContent, 'My first VM is stopped (two)');
	await act(() => document.querySelector('.bui-composer-status-action button').click());
	await act(() => document.querySelector('.bui-composer-file-remove').click());
	const field = document.querySelector('.bui-composer-field');
	const paste = new Event('paste', { bubbles: true, cancelable: true });
	Object.defineProperty(paste, 'clipboardData', { value: { files: [new page.window.File(['x'], 'p.png', { type: 'image/png' })], getData: () => '' } });
	await act(() => field.dispatchEvent(paste));
	field.value = '@sr';
	field.setSelectionRange(3, 3);
	await act(() => field.dispatchEvent(new page.window.InputEvent('input', { bubbles: true })));
	await wait(20);
	assert.deepEqual(log, ['start:two', 'remove:two:a', 'two:paste:1', 'ask:two:sr']);
	assert.equal(document.querySelectorAll('[role="option"]').length, 1);
	await render(view('two', { status: { text: h('b', null, 'Bold state'), action: h('a', { href: '#/start' }, 'Start it') }, attachments: [] }));
	assert.equal(document.querySelector('.bui-composer-status b').textContent, 'Bold state');
	assert.equal(document.querySelector('.bui-composer-status-action a').getAttribute('href'), '#/start');
	assert.equal(document.querySelector('.bui-composer-files').hidden, true);
	let opened = 0;
	document.querySelector('.bui-composer input[type="file"]').click = () => opened++;
	await act(() => ref.current.attach());
	assert.equal(opened, 1);
});

test('PageHeader compact renders the line before the header inside the Page; the panel has its head and its wide form follows the prop', async () => {
	const view = wide =>
		h(ui.Page, { width: 'thread', header: h(ui.PageHeader, { title: 'Fix the redirect', status: h(ui.Status, { label: 'Working', tone: 'progress' }), compact: { actions: h('button', { type: 'button' }, 'Create pull request') } }), aside: h('p', null, 'Changes'), label: 'Details', panel: { cut: 1000, title: 'Details', head: true, wide } }, h('p', null, 'Thread'));
	await render(view(false));
	const page = document.querySelector('.bui-page');
	assert.equal(page.dataset.width, 'thread');
	const bar = page.querySelector('.bui-page-compact');
	assert.ok(bar.nextElementSibling.matches('header.bui-page-header'), 'right before the header');
	assert.equal(bar.querySelector('.bui-page-compact-title').textContent, 'Fix the redirect');
	assert.equal(bar.querySelector('.bui-page-compact-status').textContent, 'Working');
	assert.equal(bar.querySelector('.bui-page-compact-actions').textContent, 'Create pull request');
	assert.equal(bar.querySelector('.bui-page-compact-text').getAttribute('aria-hidden'), 'true');
	assert.equal(page.querySelector('.bui-page-panel-head h2').textContent, 'Details');
	assert.ok(!page.hasAttribute('data-panel-wide'));
	await render(view(true));
	assert.ok(document.querySelector('.bui-page').hasAttribute('data-panel-wide'));
});
