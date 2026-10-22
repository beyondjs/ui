import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { rows, columns, filters, ToolsSource } from './fixtures/list-tools.mjs';

const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
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
	document.body.append(element);
	return element;
};

for (const name of ['Collection', 'DataTable']) {
	test(`${name} moves one external toolbar between outlets and releases it in StrictMode`, async () => {
		const first = outlet();
		const second = outlet();
		const source = new ToolsSource();
		const values = { label: 'Machines', columns, rows, source: source.read, tools: 'external' };
		await render(h(ui[name], { ...values, toolsTarget: first }));
		await act(() => page.until(() => first.querySelector('input[type="search"]')));
		const toolbar = first.firstElementChild;
		const field = first.querySelector('input[type="search"]');
		assert.equal(first.children.length, 1);
		assert.equal(host.querySelector('input[type="search"]'), null);
		await render(h(ui[name], { ...values, toolsTarget: second }));
		assert.equal(first.children.length, 0);
		assert.ok(second.firstElementChild === toolbar, 'moving the outlet preserves the toolbar instance');
		assert.ok(second.querySelector('input') === field, 'moving the outlet preserves the field');
		await render(h(ui[name], { ...values, toolsTarget: null }));
		assert.equal(second.children.length, 0);
		await render(h(ui[name], { ...values, toolsTarget: first }));
		assert.ok(first.firstElementChild === toolbar, 'reattaching preserves its stateful instance');
		await render(h(ui[name], { ...values, tools: 'expanded', toolsTarget: first }));
		assert.equal(first.children.length, 0, 'internal mode releases the external outlet');
		assert.equal(host.querySelectorAll('input[type="search"]').length, 1);
		await render(h(ui[name], { ...values, toolsTarget: first }));
		assert.equal(first.children.length, 1, 'returning to external mode places only the live tools');
		assert.equal(host.querySelector('input[type="search"]'), null);
		await act(() => root.unmount());
		root = null;
		assert.equal(first.children.length, 0);
	});
}

test('Collection restores query and filters in external tools without reporting a user change', async () => {
	const target = outlet();
	const source = new ToolsSource();
	const changes = [];
	const values = { label: 'Machines', columns, source: source.read, filters, tools: 'external', toolsTarget: target, onState: state => changes.push(state) };
	await render(h(ui.Collection, { ...values, state: { query: 'ced', filters: { owner: 'mine' }, page: 1 } }));
	await act(() => page.until(() => source.requests.length && target.querySelector('select')));
	assert.equal(target.querySelector('input').value, 'ced');
	assert.equal(target.querySelector('select').value, 'mine');
	await render(h(ui.Collection, { ...values, state: { query: 'bir', filters: { owner: 'other' }, page: 1 } }));
	assert.equal(target.querySelector('input').value, 'bir');
	assert.equal(target.querySelector('select').value, 'other');
	assert.deepEqual(changes, []);
	await act(() => page.until(() => source.requests.at(-1)?.query === 'bir'));
	assert.equal(source.requests.at(-1).filters.owner, 'other');
});

test('DataTable filters use the latest React predicate and preserve filter state in callbacks', async () => {
	const target = outlet();
	const changes = [];
	const values = { label: 'Machines', columns, tools: 'external', toolsTarget: target, state: { filters: { owner: 'mine' } }, onChange: state => changes.push(state) };
	const filter = match => [{ ...filters[0], match }];
	await render(h(ui.DataTable, { ...values, rows, filters: filter((row, value) => row.owner === value) }));
	assert.match(host.textContent, /Cedar/);
	assert.doesNotMatch(host.textContent, /Birch/);
	const field = target.querySelector('input');
	await act(() => target.querySelector('button[aria-label="Search Machines"]').click());
	await render(h(ui.DataTable, { ...values, rows, filters: filter((row, value) => row.owner !== value) }));
	assert.match(host.textContent, /Birch/);
	assert.doesNotMatch(host.textContent, /Cedar/);
	assert.ok(target.querySelector('input') === field, 'changing the predicate does not recreate tools');
	assert.ok(document.activeElement === field, 'predicate-only refresh keeps search focus');
	const select = target.querySelector('select');
	await act(() => {
		select.value = 'other';
		select.dispatchEvent(new Event('change', { bubbles: true }));
	});
	assert.equal(changes.at(-1).filters.owner, 'other');
	assert.equal(changes.at(-1).page, 1);
});

test('a React callback-ref outlet can appear after the collection mounts', async () => {
	function View() {
		const [target, setTarget] = React.useState(null);
		return h(React.Fragment, null,
			h('div', { ref: setTarget, 'data-outlet': '' }),
			h(ui.DataTable, { label: 'Machines', columns, rows, tools: 'external', toolsTarget: target })
		);
	}
	await render(h(View));
	assert.equal(host.querySelector('[data-outlet]').children.length, 1);
	assert.equal(host.querySelectorAll('input[type="search"]').length, 1);
});

test('DataTable with omitted rows and inline empty filters settles without a redraw loop', async () => {
	const view = () => h(ui.DataTable, { label: 'Machines', columns, filters: [] });
	await render(view());
	const tools = host.querySelector('.bui-list-tools');
	await render(view());
	assert.ok(host.querySelector('.bui-list-tools') === tools, 'equivalent empty filters keep the table');
	assert.equal(host.querySelectorAll('.bui-list-tools').length, 1);
});

test('predicate-only refresh preserves a controlled loading or failed state', async () => {
	const values = { label: 'Machines', columns, rows, state: { filters: { owner: 'mine' } } };
	for (const status of ['loading', { failed: 'Machines did not answer' }]) {
		await render(h(ui.DataTable, { ...values, status, filters: [{ ...filters[0], match: (row, value) => row.owner === value }] }));
		await render(h(ui.DataTable, { ...values, status, filters: [{ ...filters[0], match: (row, value) => row.owner !== value }] }));
		assert.equal(host.querySelector('.bui-data-table').dataset.status, status === 'loading' ? 'loading' : 'failed');
		assert.doesNotMatch(host.textContent, /Birch/);
	}
});
