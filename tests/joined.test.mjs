import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { People } from './fixtures/people.mjs';

/** 0.33.0 (D163): a picker's search joins the page's notice, and an outage's place fits a table's cell. */
const page = new Page();
const environment = globalThis.IS_REACT_ACT_ENVIRONMENT;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { EmptyState, Picker, Recovery, DataTable } = await import('@beyond-js/ui/dom');
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const react = await import('@beyond-js/ui/react');
after(async () => {
	await page.close();
	if (environment === undefined) delete globalThis.IS_REACT_ACT_ENVIRONMENT;
	else globalThis.IS_REACT_ACT_ENVIRONMENT = environment;
});
beforeEach(() => page.reset());

const options = { events: null, page: null };
const settle = picker => page.until(() => picker.element.querySelector('[role="listbox"]').getAttribute('aria-busy') === 'false');
const outage = error => error.outage === true;
const details = error => ({ request: error.request, text: error.message });

/** People whose source does not answer while `down`, as an outage the page's notice owns. */
class Down extends People {
	down = true;
	get source() {
		const source = super.source;
		return async request => {
			if (this.down) throw Object.assign(new Error('Beyond Projects is unavailable'), { outage: true, request: 'req_pick' });
			return source(request);
		};
	}
}

test('a picker whose search did not answer joins the page’s notice and says so in place, with no Try again', async () => {
	const recovery = new Recovery({ title: 'Beyond Projects did not answer', again: options }).mount(document.body);
	const people = new Down();
	const picker = new Picker({ label: 'Repositories', source: people.source, delay: 0, recovery, outage, details }).mount(document.body);
	try {
		await page.until(() => recovery.size === 1);
		const status = picker.element.querySelector('.bui-picker-status');
		assert.equal(status.querySelector('.bui-empty-inline .bui-empty-said').textContent, 'Not available right now');
		assert.ok(status.querySelector('.bui-empty-mark .bui-icon'), 'the outage’s mark');
		assert.ok(!status.classList.contains('bui-picker-problem'), 'not a failure of its own');
		assert.ok([...picker.element.querySelectorAll('.bui-picker-foot button')].every(button => button.hidden), 'no Try again of its own');
		assert.match(recovery.element.querySelector('details').textContent, /Repositories.*req_pick/s, 'its read in the line’s Technical details');
		people.down = false;
		await recovery.now();
		await settle(picker);
		assert.equal(recovery.size, 0, 'it answered: it left the notice');
		assert.ok(picker.element.querySelectorAll('[role="option"]').length > 0);
		assert.equal(picker.element.querySelector('.bui-empty-inline'), null);
	} finally {
		picker.destroy();
		recovery.destroy();
	}
});

test('a picker keeps its own words for a failure that is not the notice’s, and its symptom leaves with it, in Spanish', async () => {
	const recovery = new Recovery({ title: 'Beyond Projects no respondió', labels: Recovery.labels.es, again: options });
	const people = new People();
	people.fail = true;
	const picker = new Picker({ label: 'Repositorios', source: people.source, delay: 0, recovery, outage, labels: Picker.labels.es }).mount(document.body);
	await settle(picker);
	assert.equal(picker.element.querySelector('.bui-picker-status').textContent, 'No se pudieron cargar las opciones.');
	assert.equal(recovery.size, 0);
	const down = new Down();
	const joined = new Picker({ label: 'Repositorios', source: down.source, delay: 0, recovery, outage, labels: Picker.labels.es }).mount(document.body);
	await page.until(() => recovery.size === 1);
	assert.equal(joined.element.querySelector('.bui-empty-said').textContent, 'No disponible en este momento');
	joined.gate = { title: 'Conecta GitHub', reason: 'Para listar tus repositorios.' };
	assert.equal(recovery.size, 0, 'a gate in place of the list takes its symptom with it');
	picker.destroy();
	joined.destroy();
	recovery.destroy();
});

test('an outage’s place fits a table’s cell as phrasing content, and the DataTable draws it', () => {
	const cell = new EmptyState({ kind: 'outage', inline: true });
	assert.equal(cell.element.localName, 'span');
	assert.ok([...cell.element.querySelectorAll('*')].every(node => ['span', 'svg', 'path', 'circle', 'line', 'polyline', 'rect'].includes(node.localName)), 'phrasing content only');
	assert.equal(cell.element.textContent, 'Not available right now');
	assert.equal(cell.element.querySelector('.bui-empty-mark').getAttribute('aria-hidden'), 'true');
	assert.equal(new EmptyState({ kind: 'outage', inline: true, labels: EmptyState.labels.es }).element.textContent, 'No disponible en este momento');
	assert.equal(new EmptyState({ kind: 'empty', title: 'No machines yet', inline: true }).element.localName, 'div', 'inline is an outage’s form only');
	const table = new DataTable({ label: 'Projects', columns: [{ key: 'name', label: 'Project', primary: true }, { key: 'work', label: 'Your work', render: () => new EmptyState({ kind: 'outage', inline: true }).element }], rows: [{ id: 'a', name: 'Atlas' }] }).mount(document.body);
	assert.equal(table.element.querySelector('.bui-empty-inline').textContent, 'Not available right now');
	table.destroy();
});

test('React: a Picker joins a notice from useRecovery even when it fails first, and EmptyState draws the inline place in a span host', async () => {
	const host = document.createElement('div');
	document.body.append(host);
	const root = createRoot(host);
	const people = new Down();
	let notice = null;
	function Page() {
		notice = react.useRecovery({ title: 'Beyond Projects did not answer', again: options });
		return React.createElement(React.Fragment, null,
			React.createElement(react.Recovery, { notice }),
			React.createElement(react.Picker, { label: 'Repositories', source: people.source, delay: 0, recovery: notice, outage, details }),
			React.createElement('p', null, React.createElement(react.EmptyState, { kind: 'outage', inline: true })));
	}
	// Under StrictMode the picker's first search fails before useRecovery's notice exists: it waits for it (0.33.0)
	await React.act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(Page))));
	await page.until(() => notice?.size === 1);
	assert.equal(host.querySelector('.bui-picker .bui-empty-said').textContent, 'Not available right now');
	assert.equal(host.querySelector('p > span.bui-host > .bui-empty-inline').textContent, 'Not available right now');
	people.down = false;
	await React.act(async () => notice.now());
	await page.until(() => notice.size === 0);
	await React.act(async () => root.unmount());
});
