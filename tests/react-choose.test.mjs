import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';
import { Repositories, accounts } from './fixtures/repositories.mjs';
import { refs } from './fixtures/refs.mjs';

/** "Choose, never type" in React (0.7.0): the same markup and behavior as the DOM classes, with React content in their slots. */
const page = new Window();
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
const wait = check => act(() => page.until(check));
/** Tag, sorted attributes (ids replaced) and children: the markup without attribute order or generated ids. */
const shape = node => (node.nodeType === 3 ? node.textContent : { tag: node.tagName, attributes: [...node.attributes].map(({ name, value }) => `${name}=${/^(id|for)$/.test(name) ? 'id' : value}`).sort(), children: [...node.childNodes].map(shape) });

test('ChoiceMenu (CNT-94): options, value and actions from props, onChange and onSelect from the latest props', async () => {
	const seen = [];
	const options = [{ value: 'web', label: 'web', status: ['Ready', 'success'] }, { value: 'lab', label: 'lab', status: ['Failed', 'danger'] }];
	const view = tag => h(ui.ChoiceMenu, { label: 'Environment', options, value: 'lab', onChange: value => seen.push(`${tag}:${value}`), actions: [{ label: 'New environment…', onSelect: () => seen.push(`${tag}:new`) }] });
	await render(view('first'));
	await render(view('second'));
	const button = host.querySelector('.bui-choice-button');
	assert.match(button.textContent, /Environment.*lab.*Failed/);
	await act(() => button.click());
	await act(() => host.querySelector('[role="menuitemradio"]').click());
	await act(() => button.click());
	await act(() => host.querySelector('[role="menuitem"]').click());
	assert.deepEqual(seen, ['second:web', 'second:new']);
	await render(h(ui.ChoiceMenu, { label: 'Engine', options: [{ value: 'claude', label: 'Claude Code' }], labels: ui.ChoiceMenu.labels.es }));
	assert.ok(host.querySelector('.bui-choice-statement'), 'one option is a statement');
});

test('RefChooser: late refs end the loading placeholder, onRetry and onChange come from the latest props', async () => {
	const seen = [];
	await render(h(ui.RefChooser, { loading: true, onChange: value => seen.push(value) }));
	assert.ok(host.querySelector('.bui-skeleton'));
	await render(h(ui.RefChooser, { unavailable: { onRetry: () => seen.push('retry') }, onChange: value => seen.push(value) }));
	await act(() => host.querySelector('.bui-refs-actions .bui-button').click());
	await render(h(ui.RefChooser, { refs: refs(), value: 'main', onChange: value => seen.push(`late:${value}`) }));
	assert.equal(host.querySelector('.bui-choice-value').textContent, 'main');
	await act(() => host.querySelector('.bui-choice-button').click());
	const field = host.querySelector('.bui-choice-field');
	field.value = 'staging';
	await act(() => field.dispatchEvent(new Event('input')));
	await act(() => page.key(field, 'Enter'));
	assert.deepEqual(seen, ['retry', 'late:staging']);
});

test('Select and radio Choices state one option with the DOM markup; Field marks a value from useSuggestion', async () => {
	const options = [{ value: 'us-east4', label: 'Virginia (us-east4)' }];
	let typed = null;
	function Form() {
		const slug = ui.useSuggestion('storefront');
		typed = slug;
		return h('form', null, h(ui.Select, { name: 'region', options }), h(ui.Choices, { legend: 'Plan', type: 'radio', name: 'plan', options: [{ value: 'max', label: 'Max' }], value: null }), h(ui.Field, { label: 'Slug', suggested: slug.suggested }, h('input', { name: 'slug', value: slug.value, onChange: slug.onChange, onBlur: slug.onBlur })));
	}
	await render(h(Form));
	const form = host.querySelector('form');
	assert.deepEqual(shape(form.querySelector('.bui-statement')), shape(new dom.Select({ name: 'region', options }).element));
	assert.deepEqual(Object.fromEntries(new FormData(form)), { region: 'us-east4', plan: 'max', slug: 'storefront' });
	assert.equal(form.querySelector('.bui-field-suggested').textContent, 'Suggested');
	await act(() => typed.onChange('shop'));
	assert.equal(form.querySelector('input[name="slug"]').value, 'shop');
	assert.ok(!form.querySelector('.bui-field-suggested'), 'the mark leaves once the person edits it');
	await act(() => typed.onChange(''));
	await act(() => typed.onBlur({ target: { value: '' } }));
	assert.equal(form.querySelector('input[name="slug"]').value, 'storefront', 'an emptied field takes the suggestion back');
});

test('SideSheet: children, actions and an error in place; onClose only when the person dismisses it', async () => {
	const closes = [];
	const view = (open, error = null) => h(ui.SideSheet, { open, title: 'Add repositories', error, actions: h('button', null, 'Add 1 repository'), onClose: value => closes.push(value) }, h('p', null, 'acme/web'));
	await render(view(true));
	const sheet = document.querySelector('.bui-sheet');
	assert.equal(sheet.open, true);
	assert.equal(sheet.querySelector('.bui-sheet-body').textContent, 'acme/web');
	assert.equal(sheet.querySelector('.bui-sheet-actions').textContent, 'Add 1 repository');
	await render(view(true, h('p', null, 'Beyond Projects didn’t answer.')));
	assert.equal(sheet.querySelector('.bui-sheet-problem').hidden, false);
	assert.match(sheet.querySelector('.bui-sheet-problem').textContent, /didn’t answer/);
	await render(view(false));
	assert.deepEqual(closes, [], 'closing through open reports nothing');
	await render(view(true));
	const shown = document.querySelector('.bui-sheet');
	await act(() => page.key(shown, 'Escape'));
	assert.deepEqual(closes, [null]);
});

test('Picker: the gate\'s action and the footer are React content; lifting the gate searches; Connect another runs the latest onSelect', async () => {
	const repositories = new Repositories();
	const seen = [];
	const view = (gate, tag) => h(ui.Picker, { label: 'Repositories', source: repositories.source, delay: 0, accounts: { items: accounts, connect: { label: 'Install on another GitHub organization', onSelect: () => seen.push(tag) } }, gate, footer: h('button', { type: 'button' }, 'Choose which repositories Beyond can see on GitHub') });
	const gate = { title: 'Connect GitHub to choose repositories', reason: 'Beyond reads only the repositories you choose.', action: h('button', { type: 'button', onClick: () => seen.push('connect') }, 'Continue to GitHub') };
	await render(view(gate, 'first'));
	assert.equal(repositories.requests.length, 0);
	const action = host.querySelector('.bui-picker-gate button');
	assert.equal(action.textContent, 'Continue to GitHub');
	await act(() => action.click());
	assert.match(host.querySelector('.bui-picker-escape').textContent, /Can’t find it\?.*Choose which repositories/);
	await render(view(null, 'second'));
	await wait(() => host.querySelectorAll('[role="option"]').length === 5);
	await act(() => host.querySelector('.bui-picker-from .bui-choice-button').click());
	await act(() => host.querySelector('.bui-picker-from [role="menuitem"]').click());
	assert.deepEqual(seen, ['connect', 'second']);
});

test('ListDetail renders the DOM class\'s markup; StatusRow takes its action as React content', async () => {
	await render(h('div', null, h(ui.ListDetail, { list: h('ul'), detail: h('p', null, 'acme/web'), label: 'Repository', back: { label: 'Repositories', href: '?view=repositories' } }), h(ui.StatusRow, { title: 'acme', state: { label: 'Active', tone: 'success' }, action: h('button', null, 'Check now') })));
	const made = new dom.ListDetail({ list: document.createElement('ul'), detail: Object.assign(document.createElement('p'), { textContent: 'acme/web' }), label: 'Repository', back: { label: 'Repositories', href: '?view=repositories' } });
	const strip = node => ({ ...shape(node), attributes: shape(node).attributes.filter(entry => entry !== 'hidden=') });
	assert.deepEqual(strip(host.querySelector('.bui-listdetail')), strip(made.element));
	assert.equal(host.querySelector('.bui-statusrow-actions button').textContent, 'Check now');
	made.destroy();
});

test('0.7.1: a React statement keeps the hint and state with the DOM markup; AwaitedLine in React; the labels on the adapters', async () => {
	const options = [{ value: 'claude', label: 'Claude Code', hint: 'Connected · Max plan', status: ['Ready', 'success'] }];
	const clock = new dom.Clock({ now: () => Date.parse('2026-10-04T12:01:00Z') });
	const ended = [];
	const view = finished => h('div', null, h(ui.Choices, { legend: 'AI engine', type: 'radio', name: 'engine', options, value: null }), h(ui.AwaitedLine, { title: 'Cloning', since: '2026-10-04T12:00:00Z', expected: { median: 120_000, p90: 240_000 }, clock, ended: finished, onEnd: outcome => ended.push(outcome) }));
	await render(view(null));
	const strip = node => JSON.parse(JSON.stringify(shape(node)).replace(/aria-describedby=[^"]*/g, 'aria-describedby=id'));
	const made = new dom.Choices({ legend: 'AI engine', type: 'radio', name: 'engine', options });
	assert.deepEqual(strip(host.querySelector('.bui-statement')), strip(made.element.querySelector('.bui-statement')));
	const output = host.querySelector('.bui-statement output');
	assert.equal(document.getElementById(output.getAttribute('aria-describedby')).textContent, 'Connected · Max plan');
	assert.equal(host.querySelector('.bui-line').textContent.replace(/\s+/g, ' ').includes('1 min so far · usually about 2 min'), true);
	await render(view('done'));
	assert.deepEqual(ended, ['done']);
	assert.equal(ui.useConfirm.labels.es.accept, 'Confirmar');
	assert.equal(ui.Dialog.labels.es.close, 'Cerrar');
	assert.equal(ui.Unavailable.labels.es.owner, 'Quién puede cambiarlo: ');
	assert.equal(ui.useToaster.labels.es.region, 'Mensajes');
	assert.equal(ui.AwaitedLine.labels.es.done, 'Listo');
	await render(h(ui.Unavailable, { title: 'No disponible', reason: 'Motivo', owner: 'Propietarios', labels: ui.Unavailable.labels.es }));
	assert.match(host.textContent, /Quién puede cambiarlo: Propietarios/);
});

test('0.7.2: React Consequence renders the DOM builder\'s markup; the Spanish sets are on the React components', async () => {
	const parts = { affected: ['2 running conversations stop'], lost: 'The machine', costing: 'The disk snapshot', recovery: 'Deletion cannot be undone.' };
	await render(h('div', null, h(ui.Consequence, { parts, labels: ui.Consequence.labels.es }), h(ui.Consequence, { parts: {} })));
	assert.deepEqual(shape(host.firstChild.firstChild), shape(dom.consequence(parts, dom.consequence.labels.es)));
	assert.equal(host.firstChild.childNodes.length, 1, 'nothing stated, nothing rendered');
	for (const name of ['FamilyBar', 'NotificationEntry', 'NotificationInbox', 'Header', 'Help', 'Sidebar', 'ProductNav', 'Tabs', 'PageHeader', 'FocusedForm', 'Field', 'Collection', 'Picker', 'Consequence', 'Loading']) assert.ok(ui[name].labels?.es, `${name}.labels.es`);
	assert.ok(ui.consequence === dom.consequence);
	await render(h(ui.Loading, { label: ui.Loading.labels.es }));
	assert.equal(host.textContent, 'Cargando…');
});
