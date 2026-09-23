import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Touches } from './support/touches.mjs';
import { People } from './fixtures/people.mjs';
import { Notices } from './fixtures/notices.mjs';
import { rows } from './fixtures/rows.mjs';

// React's development mode (`StrictMode`) destroys and recreates every DOM instance an adapter
// creates on mount, and an ancestor using `useSyncExternalStore` lets React 18 render the destroyed
// instance before the new one. These tests run on the installed React and, through
// `react18.test.mjs`, on React 18 (`BUI_REACT` names the major version the run must use).
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const dom = await import('@beyond-js/ui/dom');
const ui = await import('@beyond-js/ui/react');
const h = React.createElement;
const { act, StrictMode } = React;
const touches = new Touches([dom.Dialog, dom.Collection, dom.Picker, dom.NotificationEntry, dom.NotificationInbox, dom.ActionMenu, dom.Disclosure, dom.Help, dom.Tooltip, dom.Toaster, dom.Header]);
let root = null;
let host = null;

after(() => page.close());
beforeEach(async () => {
	if (root) await act(() => root.unmount());
	page.reset();
	touches.clear();
	host = document.createElement('div');
	document.body.append(host);
	root = createRoot(host);
});

/** An ancestor that reads an external store, as a product's language or session provider does. */
function Store({ children }) {
	React.useSyncExternalStore(
		() => () => {},
		() => 0
	);
	return children;
}

const render = element => act(() => root.render(h(StrictMode, null, h(Store, null, element))));
const settle = () => act(() => new Promise(resolve => setTimeout(resolve, 20)));

test('the run uses the intended React', () => {
	if (process.env.BUI_REACT) assert.equal(React.version.split('.')[0], process.env.BUI_REACT);
	else assert.ok(React.version);
});

test('Dialog under StrictMode and an external store stays open until the person closes it', async () => {
	const closes = [];
	await render(h(ui.Dialog, { open: true, title: 'Rename area', onClose: value => closes.push(value) }, h('input', { 'aria-label': 'Name' })));
	await settle();
	assert.deepEqual(closes, [], 'nothing reports a close the person did not make');
	assert.equal(document.querySelectorAll('dialog').length, 1);
	const dialog = document.querySelector('dialog');
	assert.equal(dialog.open, true);
	const input = dialog.querySelector('input');
	assert.equal(document.activeElement, input);
	input.value = 'Billing';
	assert.equal(dialog.querySelector('input').value, 'Billing', 'the field can be filled');
	await act(async () => page.key(dialog, 'Escape'));
	await settle();
	assert.deepEqual(closes, [null], 'the person closing it is reported once');
	assert.deepEqual(touches.list, [], 'no destroyed dialog was opened or changed');
});

test('Dialog reports neither its replacement nor its unmounting as a close', async () => {
	const closes = [];
	const view = size => h(ui.Dialog, { open: true, size, title: 'Rename area', onClose: value => closes.push(value) }, h('input', { 'aria-label': 'Name' }));
	await render(view('medium'));
	await render(view('large'));
	await settle();
	assert.deepEqual(closes, [], 'a changed shape replaces the dialog without a close');
	assert.equal(document.querySelectorAll('dialog').length, 1);
	assert.ok(document.querySelector('dialog').open && document.querySelector('dialog').classList.contains('bui-dialog-large'), 'the replacement is open');
	await act(() => root.unmount());
	root = null;
	await settle();
	assert.deepEqual(closes, [], 'unmounting an open dialog is not the person closing it');
	assert.equal(document.querySelector('dialog'), null);
});

test('Dialog closed from its prop and opened again reports only the person closing it', async () => {
	const closes = [];
	const view = open => h(ui.Dialog, { open, title: 'Rename area', onClose: value => closes.push(value) }, h('input', { 'aria-label': 'Name' }));
	await render(view(true));
	await render(view(false));
	await render(view(true));
	await settle();
	assert.deepEqual(closes, []);
	await act(async () => document.querySelector('dialog .bui-icon-button').click());
	await settle();
	assert.deepEqual(closes, [null]);
});

test('every adapter under StrictMode and an external store leaves destroyed instances untouched', async () => {
	const notices = new Notices();
	const people = new People();
	const picker = React.createRef();
	const entry = React.createRef();
	let toaster = null;
	function Everything({ step }) {
		toaster = ui.useToaster();
		const columns = React.useMemo(() => [{ key: 'title', label: 'Request', primary: true }, { key: 'votes', label: 'Support', render: row => h('strong', null, row.votes) }], []);
		return h(
			'div',
			null,
			h(ui.Header, { brand: { label: 'Beyond', href: '/' }, nav: [{ label: `Requests ${step}`, href: '/r', current: true }], notifications: h(ui.NotificationEntry, { ref: entry, adapter: notices.adapter, href: '/inbox' }), account: h(ui.Disclosure, { label: 'AN', name: 'Account' }, h('p', null, 'Ana')) }),
			h(ui.ActionMenu, { label: 'More', items: [{ label: `Duplicate ${step}`, onSelect: () => {} }] }),
			h(ui.Help, { topic: 'Identifier', text: 'Never changes.' }, h('em', null, 'More')),
			h(ui.Tooltip, { text: `Copy ${step}` }, h('button', { type: 'button' }, 'Copy')),
			h(ui.Picker, { ref: picker, label: 'People', source: people.source, delay: 0 }),
			h(ui.Collection, { label: 'Requests', columns, source: dom.Collection.local(rows), limit: 5, state: { page: step } }),
			h(ui.NotificationInbox, { adapter: notices.adapter, state: { state: step > 1 ? 'all' : 'unread' } })
		);
	}
	await render(h(Everything, { step: 1 }));
	await settle();
	await act(async () => {
		picker.current.refresh();
		entry.current.refresh();
		toaster.show('Saved');
	});
	await render(h(Everything, { step: 2 }));
	await settle();
	assert.deepEqual(touches.list, [], 'no member of a destroyed instance ran');
	assert.equal(host.querySelectorAll('.bui-picker').length, 1);
	assert.equal(host.querySelectorAll('header').length, 1);
	assert.equal(document.querySelectorAll('.bui-toaster').length, 1, 'one toaster region');
	assert.equal(document.querySelector('.bui-toaster .bui-toast-title')?.textContent, 'Saved', 'the live toaster shows the message');
	await page.until(() => host.querySelector('.bui-collection strong'));
	await page.until(() => /^6–10/.test(host.querySelector('.bui-pager-summary')?.textContent ?? ''));
});
