import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * React's `Form` (0.32.0, D183), the family's form for a product that sends its own submission: its submit
 * buttons wait quiet while something is still to give, a press only puts the caret there, `onSubmit` runs
 * once nothing waits, and a form inside its React tree (a dialog's, through a portal) submits only itself.
 */
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ReactDOM = await import('react-dom');
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

test('a required control left empty keeps its submit quiet and a press puts the caret there; onSubmit runs once it holds something', async () => {
	const sent = [];
	const ref = React.createRef();
	await render(h(ui.Form, { ref, id: 'name-form', onSubmit: event => (event.preventDefault(), sent.push(new FormData(event.currentTarget).get('name'))) }, h('input', { name: 'name', required: true, 'aria-label': 'Name' }), h('button', { type: 'submit' }, 'Save')));
	const form = host.querySelector('form');
	const input = form.querySelector('input');
	const save = form.querySelector('button');
	assert.ok(ref.current === form, 'the ref is the form element');
	assert.equal(form.noValidate, true, 'the browser\'s own messages never stand in for the product\'s');
	assert.equal(save.getAttribute('aria-disabled'), 'true');
	await act(async () => form.requestSubmit());
	assert.deepEqual(sent, [], 'nothing is sent');
	assert.ok(document.activeElement === input, 'the caret goes where the name is written');
	await act(async () => {
		input.value = 'Alpha';
		input.dispatchEvent(new Event('input', { bubbles: true }));
	});
	assert.equal(save.hasAttribute('aria-disabled'), false);
	await act(async () => form.requestSubmit());
	assert.deepEqual(sent, ['Alpha']);
});

test('a part the product marks data-missing waits across redraws, a footer that names the form waits with it, and a nested form submits only itself', async () => {
	const sent = [];
	let choose = null;
	function Probe() {
		const [chosen, setChosen] = React.useState(false);
		choose = setChosen;
		const inner = h('form', { className: 'inner', onSubmit: event => (event.preventDefault(), sent.push('inner')) }, h('button', { type: 'submit' }, 'Inner'));
		return h(React.Fragment, null,
			h(ui.Form, { id: 'adding', onSubmit: event => (event.preventDefault(), sent.push('outer')) },
				h('div', { 'data-missing': chosen ? null : '' }, h('input', { type: 'search', 'aria-label': 'Search' })),
				ReactDOM.createPortal(inner, document.body)),
			h('button', { type: 'submit', form: 'adding' }, 'Add'));
	}
	await render(h(Probe));
	const add = [...document.querySelectorAll('button')].find(button => button.textContent === 'Add');
	assert.equal(add.getAttribute('aria-disabled'), 'true', 'nothing chosen yet');
	await act(async () => document.querySelector('form.inner').requestSubmit());
	assert.deepEqual(sent, ['inner'], 'a dialog\'s form drawn through a portal submits only itself');
	await act(async () => host.querySelector('form').requestSubmit());
	assert.deepEqual(sent, ['inner']);
	assert.ok(document.activeElement === host.querySelector('input[type="search"]'), 'the press goes to where the choice is made');
	await act(async () => choose(true));
	assert.equal(add.hasAttribute('aria-disabled'), false, 'read again after the redraw');
	await act(async () => host.querySelector('form').requestSubmit());
	assert.deepEqual(sent, ['inner', 'outer']);
});
