import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { rows, filters } from './fixtures/list-tools.mjs';
import { clock } from './fixtures/periods.mjs';

/** 0.44.0 (D162 L8): one set of search and filters, standalone in React, driving more than one view. */
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
const { act, StrictMode, useState } = React;
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
const names = selector => [...host.querySelectorAll(`${selector} li`)].map(item => item.textContent);
const choose = async (select, value) => {
	select.value = value;
	await act(() => select.dispatchEvent(new Event('change')));
};

/** A page of the fixtures' machines drawn twice, as Packages' composition draws a graph and a table. */
function Composition({ state = null, onChange = null, delay = 0, owner = null }) {
	const tools = ui.useCollectionTools({ label: 'Packages', filters: owner ? filters.map(filter => ({ ...filter, label: owner })) : filters, state, onChange, delay });
	const { query, filters: chosen } = tools.state;
	const shown = rows.filter(row => (!query || row.name.toLowerCase().includes(query.toLowerCase())) && (!chosen.owner || row.owner === chosen.owner));
	const view = name => h('ul', { 'data-view': name }, shown.map(row => h('li', { key: row.id }, row.name)));
	return h('section', null, h('div', { ref: tools.ref, 'data-outlet': '' }), view('graph'), view('table'));
}

test('useCollectionTools places one toolbar whose state filters every view, and reports the person\'s changes', async () => {
	const changes = [];
	await render(h(Composition, { onChange: state => changes.push(state) }));
	await act(() => page.until(() => host.querySelector('[data-outlet] select')));
	assert.equal(host.querySelectorAll('.bui-list-tools').length, 1, 'StrictMode leaves one toolbar');
	await choose(host.querySelector('select'), 'mine');
	assert.deepEqual(names('[data-view="graph"]'), ['Cedar', 'Elm']);
	assert.deepEqual(names('[data-view="table"]'), ['Cedar', 'Elm'], 'one set of filters drives both views');
	assert.deepEqual(changes.at(-1), { query: '', filters: { owner: 'mine' } });
	const input = host.querySelector('input[type="search"]');
	input.value = 'el';
	await act(async () => {
		input.dispatchEvent(new Event('input'));
		await page.until(() => changes.at(-1)?.query === 'el');
	});
	assert.deepEqual(names('[data-view="table"]'), ['Elm']);
	await act(() => host.querySelector('.bui-list-restriction:not([hidden])').click());
	assert.deepEqual(changes.at(-1), { query: 'el', filters: { owner: '' } }, 'removing a filter keeps the query');
	await act(() => root.unmount());
	root = null;
	assert.equal(document.querySelector('.bui-list-tools'), null, 'unmounting releases the toolbar');
});

test('a state from the address is restored silently and its echo keeps the field and its focus', async () => {
	const changes = [];
	function Addressed() {
		const [state, setState] = useState({ query: 'ced', filters: { owner: 'mine' } });
		globalThis.address = setState;
		return h(Composition, { state, onChange: next => (changes.push(next), setState(next)) });
	}
	await render(h(Addressed));
	await act(() => page.until(() => host.querySelector('select')));
	assert.equal(host.querySelector('input[type="search"]').value, 'ced');
	assert.equal(host.querySelector('select').value, 'mine');
	assert.deepEqual(names('[data-view="graph"]'), ['Cedar']);
	const field = host.querySelector('input[type="search"]');
	await act(() => globalThis.address({ query: 'bir', filters: { owner: 'other' } }));
	assert.equal(host.querySelector('input[type="search"]'), field, 'the same field, not a new toolbar');
	assert.equal(field.value, 'bir');
	assert.deepEqual(names('[data-view="table"]'), ['Birch']);
	assert.deepEqual(changes, [], 'Back and Forward report no change of the person\'s');
	field.focus();
	await choose(host.querySelector('select'), '');
	assert.deepEqual(changes.at(-1), { query: 'bir', filters: { owner: '' } });
	assert.equal(host.querySelector('input[type="search"]'), field, 'the echoed state keeps the toolbar');
	delete globalThis.address;
});

test('<CollectionTools> draws where it is rendered, with a period filter, and its ref focuses the search', async () => {
	const handle = React.createRef();
	const changes = [];
	const period = { name: 'period', label: 'Period', kind: 'period', months: 2, now: clock };
	await render(h('header', null, h(ui.CollectionTools, { ref: handle, label: 'Usage', filters: [period], labels: ui.CollectionTools.labels.es, onChange: state => changes.push(state) })));
	await act(() => page.until(() => host.querySelector('header .bui-list-tools select')));
	assert.deepEqual([...host.querySelectorAll('option')].map(option => option.textContent), ['Cualquier fecha', 'Últimos 7 días', 'Últimos 30 días', 'Octubre de 2026', 'Septiembre de 2026']);
	await choose(host.querySelector('select'), '2026-09');
	assert.deepEqual(changes.at(-1), { query: '', filters: { period: '2026-09' } });
	assert.equal(ui.Period.range(changes.at(-1).filters.period).start.toISOString(), '2026-09-01T00:00:00.000Z');
	await act(() => handle.current.focus());
	assert.equal(document.activeElement, host.querySelector('input[type="search"]'));
});

test('a changed filter definition makes a new toolbar that keeps the person\'s state', async () => {
	await render(h(Composition));
	await act(() => page.until(() => host.querySelector('select')));
	await choose(host.querySelector('select'), 'other');
	const first = host.querySelector('.bui-list-tools');
	await render(h(Composition, { owner: 'Owner' }));
	await act(() => page.until(() => host.querySelector('.bui-list-tools') !== first));
	assert.equal(host.querySelectorAll('.bui-list-tools').length, 1);
	assert.equal(host.querySelector('select').value, 'other');
	assert.equal(host.querySelector('label.bui-field-label').textContent, 'Owner');
	assert.deepEqual(names('[data-view="graph"]'), ['Birch']);
});
