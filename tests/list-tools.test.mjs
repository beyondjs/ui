import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
const { Collection, DataTable, icons } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());
const filters = [
	{ name: 'whose', label: 'Whose', all: 'Everyone', options: [{ value: 'mine', label: 'Mine' }], match: (row, value) => value !== 'mine' || row.mine },
	{ name: 'state', label: 'State', options: [{ value: 'ready', label: 'Ready' }, { value: 'asleep', label: 'Asleep' }], match: (row, value) => row.state === value }
];
const rows = [{ id: 'one', name: 'API', mine: true, state: 'ready' }, { id: 'two', name: 'Worker', mine: false, state: 'asleep' }];
const columns = [{ key: 'name', label: 'Machine', sort: true }];
const input = tools => tools.element.querySelector('input[type=search]');
const trigger = tools => tools.element.querySelector('.bui-list-search > button');
const type = (tools, value, options = {}) => { input(tools).value = value; input(tools).dispatchEvent(new page.window.InputEvent('input', { bubbles: true, ...options })); };
const choose = (tools, index, value) => { const select = tools.element.querySelectorAll('select')[index]; select.value = value; select.dispatchEvent(new Event('change', { bubbles: true })); };

test('search reveals a named field; Escape flushes without clearing and leaves a visible query', () => {
	const changes = [];
	const tools = new Collection.Tools({ label: 'Machines', onchange: state => changes.push(state) }).mount(document.body);
	assert.equal(trigger(tools).getAttribute('aria-label'), 'Search Machines');
	assert.ok(trigger(tools).hasAttribute('data-bui-hint'));
	assert.equal(input(tools).closest('[hidden]') !== null, true);
	trigger(tools).click();
	assert.equal(document.activeElement, input(tools));
	assert.equal(tools.element.querySelector('label').htmlFor, input(tools).id);
	type(tools, 'API');
	const escape = page.key(input(tools), 'Escape');
	assert.equal(escape.defaultPrevented, true, 'native search clear is prevented');
	assert.equal(document.activeElement, trigger(tools));
	assert.equal(changes.at(-1).query, 'API');
	const summary = tools.element.querySelector('.bui-list-query');
	assert.equal(summary.hidden, false);
	assert.equal(summary.textContent, 'Search: API');
	summary.click();
	assert.equal(input(tools).value, 'API');
	const clear = tools.element.querySelector('[aria-label="Clear search"]');
	clear.focus();
	page.key(clear, 'Escape');
	assert.equal(document.activeElement, trigger(tools), 'Escape closes from any control in the editor');
	assert.equal(input(tools).value, 'API');
	tools.element.querySelector('[aria-label="Clear search"]').click();
	assert.equal(changes.at(-1).query, '');
	assert.equal(document.activeElement, input(tools));
	tools.destroy();
});

test('restoring address state cancels pending input; composition does not submit incomplete text', async () => {
	const changes = [];
	const tools = new Collection.Tools({ label: 'Machines', delay: 0, onchange: state => changes.push(state) }).mount(document.body);
	tools.focus();
	type(tools, 'unfinished', { isComposing: true });
	assert.equal(page.key(input(tools), 'Escape', { isComposing: true }).defaultPrevented, false);
	await new Promise(resolve => setTimeout(resolve, 5));
	assert.equal(changes.length, 0);
	type(tools, 'stale');
	tools.state = { query: 'restored' };
	await new Promise(resolve => setTimeout(resolve, 5));
	assert.equal(changes.length, 0);
	assert.equal(input(tools).value, 'restored');
	tools.destroy();
});

test('real filters form a disclosure, preserve query, expose values and clear independently', () => {
	const changes = [];
	const tools = new Collection.Tools({ label: 'Machines', filters, state: { query: 'API', filters: { whose: 'mine' } }, onchange: state => changes.push(state) }).mount(document.body);
	const button = tools.element.querySelector('.bui-disclosure-button');
	assert.equal(button.textContent, 'Filters (1)');
	assert.ok(icons.includes('filter'));
	button.click();
	assert.equal(button.getAttribute('aria-expanded'), 'true');
	assert.equal(tools.element.querySelector('[role=menu]'), null, 'filter form is not an action menu');
	choose(tools, 1, 'asleep');
	assert.equal(changes.at(-1).query, 'API');
	assert.deepEqual(changes.at(-1).filters, { whose: 'mine', state: 'asleep' });
	page.key(tools.element.querySelector('select'), 'Escape');
	assert.equal(document.activeElement, button);
	assert.equal(button.getAttribute('aria-expanded'), 'false');
	const chips = [...tools.element.querySelectorAll('.bui-list-restriction')].filter(chip => !chip.hidden);
	assert.equal(chips.length, 2, 'restrictions remain outside the closed panel');
	chips[0].click();
	assert.equal(changes.at(-1).filters.state, 'asleep');
	assert.equal(changes.at(-1).filters.whose, '');
	button.click();
	tools.element.querySelector('.bui-disclosure-panel > button').click();
	assert.deepEqual(changes.at(-1), { query: 'API', filters: {} });
	tools.destroy();
});

test('an unavailable restored choice is visible and removable without exposing its identifier', () => {
	const disabled = filters.map(filter => ({ ...filter, options: filter.options.map(option => ({ ...option, disabled: true })) }));
	const tools = new Collection.Tools({ label: 'Machines', filters: disabled, state: { filters: { state: 'internal-unknown-id' } } }).mount(document.body);
	assert.match(tools.element.textContent, /State: Unavailable choice/);
	assert.equal(tools.element.textContent.includes('internal-unknown-id'), false);
	assert.equal(tools.element.querySelectorAll('select')[1].value, 'internal-unknown-id');
	choose(tools, 1, '');
	assert.equal(tools.state.filters.state, '', 'All remains a real reset even if the other choices are disabled');
	tools.destroy();
});

test('filtering flushes pending search once; destruction cancels a queued search', async () => {
	const changes = [];
	const tools = new Collection.Tools({ label: 'Machines', filters, delay: 0, onchange: state => changes.push(state) }).mount(document.body);
	type(tools, 'API');
	choose(tools, 0, 'mine');
	await new Promise(resolve => setTimeout(resolve, 5));
	assert.equal(changes.length, 1);
	assert.deepEqual(changes[0], { query: 'API', filters: { whose: 'mine' } });
	type(tools, 'Worker');
	tools.destroy();
	await new Promise(resolve => setTimeout(resolve, 5));
	assert.equal(changes.length, 1);
});

test('expanded search remains an editor; unsupported tools render no false affordance; Spanish keys agree', () => {
	const tools = new Collection.Tools({ label: 'Máquinas', compact: false, labels: Collection.Tools.labels.es }).mount(document.body);
	assert.equal(input(tools).placeholder, 'Buscar en Máquinas');
	tools.focus();
	type(tools, 'API');
	page.key(input(tools), 'Escape');
	assert.equal(input(tools).closest('[hidden]'), null);
	assert.equal(input(tools).value, 'API');
	assert.deepEqual(Object.keys(Collection.Tools.labels.en), Object.keys(Collection.Tools.labels.es));
	assert.equal(tools.element.querySelector('.bui-list-filters'), null);
	tools.destroy();
	const none = new Collection.Tools({ label: 'History', search: false });
	assert.equal(none.element.hidden, true);
	none.destroy();
});

test('DataTable applies finite filters and search, keeps tools on empty/loading, resets without losing sort', () => {
	const changes = [];
	const table = new DataTable({ label: 'Machines', columns, rows, filters, state: { filters: { whose: 'mine', state: 'asleep' }, sort: 'name', direction: 'descending' }, onchange: state => changes.push(state) }).mount(document.body);
	assert.equal(table.element.querySelector('.bui-empty').dataset.kind, 'match');
	assert.equal(table.tools.element.hidden, false);
	assert.match(table.element.querySelector('.bui-empty').textContent, /Clear search and filters/);
	table.element.querySelector('.bui-empty button').click();
	assert.equal(table.element.querySelectorAll('tbody tr').length, 2);
	assert.equal(changes.at(-1).sort, 'name');
	assert.equal(changes.at(-1).direction, 'descending');
	assert.deepEqual(changes.at(-1).filters, {});
	table.state = { query: 'API', filters: { whose: 'mine' } };
	table.status = 'loading';
	assert.equal(table.tools.element.hidden, false);
	table.rows = [];
	assert.equal(table.element.querySelector('.bui-empty').dataset.kind, 'match');
	assert.equal(table.tools.state.query, 'API');
	table.state = {};
	assert.equal(table.element.querySelector('.bui-empty').dataset.kind, 'empty');
	table.destroy();
});

test('externally placed Collection tools preserve source state, no matches and independent lifecycle', async () => {
	const calls = [];
	const changes = [];
	const list = new Collection({ label: 'Machines', columns, filters, tools: 'external', state: { query: 'API', filters: { state: 'asleep' } }, source: async state => { calls.push(state); return { rows: [], total: 0 }; }, onstate: state => changes.push(state) }).mount(document.body);
	const header = document.createElement('header');
	document.body.prepend(header);
	header.append(list.tools.element);
	await page.until(() => list.element.querySelector('.bui-empty'));
	assert.equal(list.element.querySelector('.bui-list-tools'), null);
	assert.equal(header.querySelectorAll('.bui-list-tools').length, 1);
	assert.equal(calls[0].query, 'API');
	assert.equal(calls[0].filters.state, 'asleep');
	list.element.querySelector('.bui-empty button').click();
	assert.deepEqual(changes.at(-1), { query: '', filters: {}, page: 1 });
	assert.equal(document.activeElement, input(list.tools));
	list.destroy();
	assert.equal(header.childElementCount, 0);
});
