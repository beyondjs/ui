import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { People } from './fixtures/people.mjs';
import { Notices } from './fixtures/notices.mjs';
import { rows } from './fixtures/rows.mjs';

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
/** Tag, sorted attributes and children: the markup without attribute order. */
const shape = node => (node.nodeType === 3 ? node.textContent : { tag: node.tagName, attributes: [...node.attributes].map(({ name, value }) => `${name}=${value}`).sort(), children: [...node.childNodes].map(shape) });

test('simple elements render the same markup as the DOM builders', async () => {
	await render(h('div', null, h(ui.Button, { label: 'Save', variant: 'primary', glyph: 'check' }), h(ui.Status, { label: 'Live', tone: 'success' }), h(ui.Badge, { label: 'Stale', tone: 'warning' }), h(ui.Callout, { tone: 'danger', title: 'Failed', body: 'Nothing changed.' }), h(ui.Loading, { label: 'Loading…' }), h(ui.Skeleton, { lines: 2 })));
	const [button, status, badge, callout, loading, skeleton] = host.firstChild.children;
	assert.deepEqual(shape(button), shape(new dom.Button({ label: 'Save', variant: 'primary', glyph: 'check' }).element));
	assert.deepEqual(shape(status), shape(dom.status('Live', 'success')));
	assert.deepEqual(shape(badge), shape(dom.badge('Stale', 'warning')));
	assert.deepEqual(shape(callout), shape(dom.callout({ tone: 'danger', title: 'Failed', body: 'Nothing changed.' })));
	assert.deepEqual(shape(loading), shape(dom.loading('Loading…')));
	assert.deepEqual(shape(skeleton), shape(dom.skeleton(2)));
});

test('Dialog opens from its prop, renders React children, reports Escape and cleans up', async () => {
	const closes = [];
	const view = open => h(ui.Dialog, { open, title: 'Rename area', onClose: value => closes.push(value), actions: h('button', { type: 'button' }, 'Save') }, h('input', { 'aria-label': 'Name' }));
	await render(view(true));
	const dialog = document.querySelector('dialog');
	assert.equal(document.querySelectorAll('dialog').length, 1, 'development double mount leaves one dialog');
	assert.equal(dialog.open, true);
	assert.equal(document.activeElement, dialog.querySelector('input'));
	assert.equal(dialog.querySelector('.bui-dialog-actions button').textContent, 'Save');
	await act(async () => page.key(dialog, 'Escape'));
	assert.deepEqual(closes, [null]);
	await render(view(false));
	await render(view(true));
	assert.equal(document.querySelector('dialog').open, true);
	await render(view(false));
	assert.deepEqual(closes, [null], 'closing from the prop does not report back');
	await act(() => root.unmount());
	root = null;
	assert.equal(document.querySelector('dialog'), null);
});

test('Picker is driven by the DOM class, exposes its choice and leaves nothing on unmount', async () => {
	const ref = React.createRef();
	const changes = [];
	await render(h(ui.Picker, { ref, label: 'People', source: new People().source, delay: 0, onChange: items => changes.push(items.map(item => item.id)) }));
	await page.until(() => host.querySelectorAll('[role="option"]').length === 20);
	assert.equal(host.querySelectorAll('.bui-picker').length, 1);
	await act(async () => host.querySelector('[role="option"]').click());
	assert.deepEqual(ref.current.value, ['p1']);
	assert.deepEqual(changes, [['p1']]);
	await act(() => root.unmount());
	root = null;
	assert.equal(host.children.length, 0);
});

test('Collection renders React cell content through portals and reports state', async () => {
	const states = [];
	const columns = [{ key: 'title', label: 'Request', primary: true }, { key: 'votes', label: 'Support', render: row => h('strong', { className: 'votes' }, `${row.votes} votes`) }];
	await render(h(ui.Collection, { label: 'Requests', columns, source: dom.Collection.local(rows), limit: 5, link: row => `#/r/${row.id}`, onState: state => states.push(state) }));
	await page.until(() => host.querySelectorAll('strong.votes').length === 5);
	assert.equal(host.querySelector('strong.votes').textContent, '0 votes');
	await act(async () => host.querySelectorAll('.bui-pager button')[1].click());
	await page.until(() => host.querySelector('strong.votes')?.textContent === '10 votes');
	assert.deepEqual(states.at(-1), { query: '', filters: {}, page: 2 });
});

test('NotificationEntry shows the count and Header carries it in its slot', async () => {
	const notices = new Notices();
	const entry = h(ui.NotificationEntry, { adapter: notices.adapter, href: '/inbox', labels: undefined });
	await render(h(ui.Header, { brand: { label: 'Beyond', href: '/' }, context: [{ label: 'Northwind', href: '/o' }], notifications: entry, account: h('span', { className: 'who' }, 'Ana') }));
	await page.until(() => host.querySelector('.bui-count') && !host.querySelector('.bui-count').hidden);
	assert.equal(host.querySelectorAll('header').length, 1);
	assert.equal(host.querySelector('.bui-count').textContent, '3');
	assert.equal(host.querySelector('.bui-header-end .who').textContent, 'Ana');
});

test('NotificationEntry closes on View all with onView and from its ref', async () => {
	const notices = new Notices();
	const ref = React.createRef();
	const views = [];
	const bell = () => host.querySelector('.bui-notify > button');
	const panel = () => host.querySelector('.bui-notify .bui-disclosure-panel');
	await render(h(ui.NotificationEntry, { ref, adapter: notices.adapter, href: '#/inbox', onView: () => views.push(ref.current.expanded) }));
	await page.until(() => ref.current?.count === 3);
	await act(async () => bell().click());
	await page.until(() => panel().querySelector('.bui-notice'));
	assert.equal(ref.current.expanded, true);
	await act(async () => panel().querySelector('.bui-notify-all').click());
	assert.deepEqual(views, [false], 'closed before the product routes');
	assert.equal(panel().hidden, true);
	assert.ok(document.activeElement === bell(), 'focus is back on the bell');
	await act(async () => ref.current.open());
	await page.until(() => panel().querySelector('.bui-notice'));
	panel().querySelector('.bui-notice-open').focus();
	await act(async () => ref.current.close());
	assert.equal(ref.current.expanded, false);
	assert.equal(panel().hidden, true, 'the product closes it from React');
	assert.ok(document.activeElement === bell(), 'focus inside the panel returns to the bell');
	assert.equal(panel().querySelector('.bui-notice'), null, 'no item text is kept');
	await act(async () => ref.current.close());
	assert.equal(ref.current.expanded, false, 'closing a closed entry changes nothing');
});

test('FocusedForm renders its busy state and ignores a second submission', async () => {
	let release;
	let sent = 0;
	await render(h(ui.FocusedForm, { onSubmit: () => new Promise(resolve => ((release = resolve), sent++)) }, busy => h('button', { type: 'submit' }, busy ? 'Saving…' : 'Save')));
	const form = host.querySelector('form');
	await act(async () => form.requestSubmit());
	await act(async () => form.requestSubmit());
	assert.equal(sent, 1);
	assert.equal(form.querySelector('button').textContent, 'Saving…');
	await act(async () => release());
	await page.until(() => form.querySelector('button').textContent === 'Save');
});

test('useConfirm applies the product labels to every question', async () => {
	let ask = null;
	function Probe() {
		ask = ui.useConfirm({ accept: 'Aceptar', cancel: 'Cancelar' });
		return null;
	}
	await render(h(Probe));
	const answer = ask.confirm({ title: '¿Salir?' });
	const buttons = [...document.querySelectorAll('dialog button')].map(button => button.textContent);
	assert.ok(buttons.includes('Aceptar') && buttons.includes('Cancelar'));
	[...document.querySelectorAll('dialog button')].find(button => button.textContent === 'Cancelar').click();
	assert.equal(await answer, false);
});
