import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';

/** The React forms of 0.10.0: Composer, LiveText, ActivityRow and ActivityGroup, the Sidebar's entries and search, the Page's panel and PanelToggle, Steps without a region. */
const page = new Window();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
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
const key = (target, name, options = {}) => act(() => void target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...options })));

test('Composer: one box under StrictMode, the latest onSubmit, the text back on a rejection, React content in its slots, the ref', async () => {
	const ref = createRef();
	const sent = [];
	let refuse = false;
	const view = (tag, extra = {}) =>
		h(ui.Composer, {
			ref,
			label: 'Message to Codex',
			placeholder: `Message Codex ${tag}…`,
			status: h('span', null, h('a', { href: '#/connect' }, 'Connect Codex'), ' to send'),
			tools: h('button', { type: 'button' }, 'Environment: web'),
			extras: h('button', { type: 'button' }, 'Dictate'),
			actions: [{ id: 'send', label: 'Send', primary: true }, { id: 'wait', label: 'Send without starting' }],
			stop: { label: 'Interrupt', onSelect: () => sent.push(`stop:${tag}`) },
			onSubmit: message => (sent.push(`${tag}:${message.action}:${message.text}`), refuse ? Promise.reject(new Error('no')) : Promise.resolve()),
			...extra
		});
	await render(view('a'));
	assert.equal(document.querySelectorAll('.bui-composer').length, 1, 'development double mount leaves one box');
	await render(view('b'));
	const field = document.querySelector('.bui-composer-field');
	assert.equal(field.getAttribute('placeholder'), 'Message Codex b…');
	assert.ok(document.querySelector('.bui-composer-tools').textContent.includes('Environment: web'));
	assert.ok(document.querySelector('.bui-composer-extras').textContent.includes('Dictate'));
	assert.equal(document.querySelector('.bui-composer-status a').getAttribute('href'), '#/connect');
	field.value = 'Run the tests';
	await key(field, 'Enter');
	assert.deepEqual(sent, ['b:send:Run the tests'], 'the latest onSubmit');
	refuse = true;
	await act(async () => {
		field.value = 'Deploy';
		field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
		await new Promise(resolve => setTimeout(resolve, 0));
	});
	assert.equal(field.value, 'Deploy', 'a rejection gives the text back');
	await act(async () => document.querySelector('.bui-composer-stop').click());
	assert.equal(sent.at(-1), 'stop:b');
	await render(view('b', { value: 'Prefilled', disabled: { reason: 'Codex needs a sign-in.' } }));
	assert.equal(field.value, 'Prefilled', 'value is applied when it changes');
	assert.equal(document.querySelector('.bui-composer-reason').textContent, 'Codex needs a sign-in.');
	assert.equal(ref.current.value, 'Prefilled');
	await act(() => ref.current.focus());
	assert.ok(document.activeElement === field);
	assert.equal(ui.Composer.labels.es.send, 'Enviar');
});

test('LiveText: the text prop grows by appending, React content through render, settled and abandoned by state', async () => {
	const frames = [];
	const saved = globalThis.requestAnimationFrame;
	globalThis.requestAnimationFrame = work => frames.push(work);
	try {
		const ref = createRef();
		const view = (text, state = 'live', note = null) => h(ui.LiveText, { ref, text, state, note, render: value => h('p', { className: 'drawn' }, value.toUpperCase()) });
		await render(view('hello'));
		assert.equal(document.querySelectorAll('.bui-live').length, 1);
		assert.equal(document.querySelector('.drawn').textContent, 'HELLO');
		await render(view('hello wor'));
		await act(() => frames.splice(0).forEach(work => work()));
		assert.equal(ref.current.text, 'hello wor');
		assert.equal(document.querySelector('.drawn').textContent, 'HELLO WOR');
		assert.ok(document.querySelector('.bui-live-slot + .bui-live-mark'), 'the mark follows React content, never inside it');
		await render(view('hello world', 'settled'));
		assert.equal(ref.current.state, 'settled');
		assert.equal(document.querySelector('.drawn').textContent, 'HELLO WORLD');
		assert.equal(document.querySelector('.bui-live-mark'), null);
		await render(h(ui.LiveText, { text: 'half', state: 'abandoned', note: 'Interrupted · not kept' }));
		assert.equal(document.querySelector('.bui-live-note').textContent, 'Interrupted · not kept');
	} finally {
		globalThis.requestAnimationFrame = saved;
	}
});

test('ActivityRow and ActivityGroup: React content built on first open, updates keep it open, rows patched by key', async () => {
	let builds = 0;
	const view = title => h('div', null,
		h(ui.ActivityRow, { glyph: 'terminal', title, meta: 'exit 0', state: 'done', duration: 3000, body: () => (builds++, h('p', { className: 'output' }, `output of ${title}`)) }),
		h(ui.ActivityRow, { glyph: 'code', title: 'Edited src/a.js', meta: '+1 −1', body: [{ label: 'Diff', text: '-a\n+b' }] }),
		h(ui.ActivityGroup, { glyph: 'file', title: count => `Read ${count} files`, rows: [{ key: 'a', glyph: 'file', title: 'Read a.js' }, { key: 'b', glyph: 'file', title: 'Read b.js', state: title.endsWith('2') ? 'running' : 'done' }] }));
	await render(view('Ran npm test 1'));
	const [command, edit] = document.querySelectorAll('.bui-activity:not(.bui-activity-group) > .bui-activity-head');
	assert.equal(document.querySelector('.output'), null, 'nothing built before opening');
	await act(() => command.click());
	assert.equal(document.querySelector('.output').textContent, 'output of Ran npm test 1');
	await render(view('Ran npm test 2'));
	assert.equal(command.getAttribute('aria-expanded'), 'true', 'an update keeps it open');
	assert.equal(command.querySelector('.bui-activity-title').textContent, 'Ran npm test 2');
	assert.equal(document.querySelector('.output').textContent, 'output of Ran npm test 2', 'the body follows React');
	await act(() => edit.click());
	assert.equal(document.querySelector('.bui-activity-label').textContent, 'Diff');
	const group = document.querySelector('.bui-activity-group');
	assert.equal(group.querySelector('.bui-activity-title').textContent, 'Read 2 files');
	assert.equal(group.dataset.state, 'running');
	assert.equal(group.querySelectorAll('.bui-activity-list > li').length, 2);
	assert.ok(builds >= 1);
	assert.equal(ui.ActivityRow.labels.es.running, 'En curso');
});

test('Sidebar: entries, the top action and a search whose source is read from the latest props', async () => {
	const asked = [];
	const view = tag => h('div', { className: 'bui-shell' },
		h(ui.Sidebar, { product: 'Conduict', groups: [{ kind: 'entries', key: 'recent', heading: 'Recent', items: [{ key: 'c1', label: `Fix ${tag}`, href: '#/c1', mark: { label: 'Needs you', tone: 'warning' } }] }], action: { label: 'New conversation', href: '#/new' }, search: { label: 'Search conversations', delay: 1, source: async ({ query }) => (asked.push(`${tag}:${query}`), []) } }),
		h('main', null, 'content'));
	await render(view('a'));
	const nav = document.querySelector('.bui-sidebar-panel nav');
	const kept = nav.querySelector('.bui-sidebar-entry');
	await render(view('b'));
	assert.ok(nav.querySelector('.bui-sidebar-entry') === kept, 'patched, not redrawn');
	assert.equal(kept.querySelector('.bui-sidebar-label').textContent, 'Fix b');
	assert.equal(nav.querySelector('.bui-sidebar-action').textContent, 'New conversation');
	const field = nav.querySelector('input[type="search"]');
	await act(async () => {
		field.value = 'checkout';
		field.dispatchEvent(new Event('input'));
		await page.until(() => asked.length);
	});
	assert.deepEqual(asked, ['b:checkout']);
});

test('Page with panel: beside with React content, PanelToggle hides it and reports, panelRef opens its sheet below the cut', async () => {
	const panelRef = createRef();
	const changes = [];
	const view = () => h(ui.Page, { header: h(ui.PageHeader, { title: 'Fix the checkout', actions: h(ui.PanelToggle, { label: 'Details' }) }), aside: h('section', { className: 'facts' }, 'Environment web'), label: 'Conversation details', panel: { cut: 1000, title: 'Details', onChange: shown => changes.push(shown) }, panelRef }, h('p', null, 'Thread'));
	await render(view());
	const aside = document.querySelector('.bui-page-body > aside.bui-page-panel');
	assert.ok(aside.querySelector('.facts'), 'React content in the panel');
	assert.equal(document.querySelectorAll('.bui-page-panel').length, 1, 'one panel under StrictMode');
	const toggle = [...document.querySelectorAll('button')].find(node => node.textContent === 'Details');
	assert.equal(toggle.getAttribute('aria-expanded'), 'true');
	await act(() => toggle.click());
	assert.equal(aside.hidden, true);
	assert.deepEqual(changes, [false]);
	page.window.happyDOM.setViewport({ width: 800, height: 800 });
	await act(() => void page.window.dispatchEvent(new Event('resize')));
	assert.equal(panelRef.current.mode, 'sheet');
	await act(() => panelRef.current.open());
	const sheet = document.querySelector('dialog.bui-sheet[open]');
	assert.ok(sheet?.querySelector('.facts'), 'the same React content in the sheet');
	await act(() => panelRef.current.close());
	assert.ok(aside.querySelector('.facts'));
});

test('Steps without a region of its own', async () => {
	await render(h(ui.Steps, { label: 'Plan', steps: [{ label: 'Write the test', state: 'progress' }], announce: false }));
	assert.equal(document.querySelector('.bui-steps [aria-live]'), null);
	for (const name of ['Composer', 'LiveText', 'ActivityRow', 'ActivityGroup']) assert.ok(ui[name].labels?.es, `${name}.labels.es`);
});
