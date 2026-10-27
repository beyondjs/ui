import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { columns, filters, ToolsSource } from './fixtures/list-tools.mjs';

/** 0.44.0 (D162 L10): an empty collection's one action, the section's own, in the DOM and in React. */
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
const nothing = async () => ({ rows: [], total: 0 });
const settled = element => page.until(() => element.querySelector('.bui-collection-body')?.getAttribute('aria-busy') === 'false');

test('the DOM collection draws an action given as words as EmptyState does, in its actions row', async () => {
	const pressed = [];
	const list = new dom.Collection({ label: 'Requests', columns, source: nothing, empty: { title: 'No requests yet', action: { label: 'New request', run: event => pressed.push(event.type) } } }).mount(document.body);
	await settled(list.element);
	const button = list.element.querySelector('.bui-empty > .bui-empty-actions > button.bui-button-primary');
	assert.equal(button.textContent, 'New request');
	button.click();
	assert.deepEqual(pressed, ['click']);
	list.destroy();
	const linked = new dom.Collection({ label: 'Requests', columns, source: nothing, empty: { title: 'No requests yet', action: { label: 'New request', href: '#/requests/new' } } }).mount(document.body);
	await settled(linked.element);
	assert.equal(linked.element.querySelector('.bui-empty-actions a.bui-button-primary').getAttribute('href'), '#/requests/new');
	linked.destroy();
	const bare = new dom.Collection({ label: 'Requests', columns, source: nothing, empty: { title: 'No requests yet' } }).mount(document.body);
	await settled(bare.element);
	assert.equal(bare.element.querySelector('.bui-empty-actions'), null, 'no action, no empty row for one');
	bare.destroy();
});

test('React Collection holds the section\'s action: words with onSelect read when pressed, or a link', async () => {
	const pressed = [];
	const view = (onSelect, title = 'No requests yet') => h(ui.Collection, { label: 'Requests', columns, source: nothing, empty: { title, body: 'Requests you submit appear here.', action: { label: 'New request', onSelect } } });
	await render(view(() => pressed.push('first')));
	await act(() => settled(host));
	await render(view(() => pressed.push('latest'), 'Nothing to review'));
	const button = host.querySelector('.bui-empty-actions button');
	assert.equal(button.textContent, 'New request');
	button.click();
	assert.deepEqual(pressed, ['latest'], 'the press reads the latest props, without a new list');
	assert.match(host.querySelector('.bui-empty-title').textContent, /No requests yet/, 'the words follow the props at the next draw, not on every render');
	// A product that knows its action only later keys the list, as Delegate's lists do, or waits for the next read
	await render(h(ui.Collection, { key: 'linked', label: 'Requests', columns, source: nothing, empty: { title: 'No requests yet', action: { label: 'New request', href: '#/requests/new' } } }));
	await act(() => settled(host));
	assert.equal(host.querySelector('.bui-empty-actions a').getAttribute('href'), '#/requests/new');
});

test('React content as the action is rendered in place and replaced on each draw; a filtered empty offers none', async () => {
	const source = new ToolsSource();
	let empty = true;
	const read = async request => (empty ? { rows: [], total: 0 } : source.read(request));
	const action = label => h('button', { type: 'button', className: 'bui-button bui-button-primary', 'data-product': '' }, label);
	await render(h(ui.Collection, { label: 'Applications', columns, filters, source: read, empty: { title: 'No applications yet', action: action('Register application') } }));
	await act(() => page.until(() => host.querySelector('[data-product]')));
	assert.equal(host.querySelectorAll('[data-product]').length, 1);
	assert.equal(host.querySelector('.bui-empty-actions [data-product]').textContent, 'Register application');
	const select = host.querySelector('select');
	select.value = 'mine';
	await act(() => select.dispatchEvent(new Event('change')));
	await act(() => page.until(() => /Nothing matches/.test(host.textContent)));
	assert.equal(host.querySelector('[data-product]'), null, 'no match says Clear search and filters, never the first action');
	empty = false;
	host.querySelector('.bui-empty-actions button').click();
	await act(() => page.until(() => host.querySelectorAll('tbody tr').length === 3));
	assert.equal(host.querySelector('[data-product]'), null);
});

test('without an action the empty collection says the family\'s words and offers nothing', async () => {
	await render(h(ui.Collection, { label: 'Requests', columns, source: nothing }));
	await act(() => settled(host));
	assert.equal(host.querySelector('.bui-empty-title').textContent, 'Nothing here yet.');
	assert.equal(host.querySelector('.bui-empty-actions'), null);
});
