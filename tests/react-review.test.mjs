import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';

/** 0.7.4: the independent review of 0.7.0–0.7.3 (React). Each case fails without its fix. */
const page = new Window();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
const h = React.createElement;
const { act, StrictMode, useState } = React;
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

test('a SideSheet with labels passed inline is not rebuilt by a render: it stays open while busy (finding 1)', async () => {
	const view = busy => h(ui.SideSheet, { open: true, title: 'Add repositories', busy, labels: { close: 'Close' } }, h('input', { name: 'q', defaultValue: 'typed' }));
	await render(view(false));
	const sheet = document.querySelector('.bui-sheet');
	await render(view(true));
	await render(view(true));
	assert.equal(document.querySelector('.bui-sheet'), sheet, 'the same sheet');
	assert.equal(sheet.open, true, 'still open while busy');
	assert.equal(sheet.querySelector('input').value, 'typed', 'its content kept');
});

test('a SideSheet’s error is placed once, not again at every render (finding 9d)', async () => {
	const view = tick => h(ui.SideSheet, { open: true, title: 'Add repositories', error: h('p', null, 'Beyond Projects didn’t answer.'), 'data-tick': tick }, h('p', null, 'acme/web'));
	await render(view(1));
	const problem = document.querySelector('.bui-sheet-problem');
	const placed = problem.firstChild;
	let writes = 0;
	new page.window.MutationObserver(records => (writes += records.length)).observe(problem, { childList: true });
	await render(view(2));
	await render(view(3));
	await new Promise(resolve => setTimeout(resolve, 0));
	assert.equal(writes, 0, 'the alert region is not refilled');
	assert.equal(problem.firstChild, placed);
});

test('a controlled form hears the value of a stated single option (finding 8)', async () => {
	const heard = { choices: [], select: [], menu: [] };
	function Form() {
		const [choice, setChoice] = useState(null);
		const [selected, setSelected] = useState('');
		const [menu, setMenu] = useState(null);
		return h(
			'form',
			null,
			h(ui.Choices, { legend: 'Capacity', type: 'radio', name: 'size', options: [{ value: 'large', label: 'Large' }], value: choice, onChange: value => (heard.choices.push(value), setChoice(value)) }),
			h(ui.Select, { name: 'region', options: [{ value: 'us-east4', label: 'us-east4' }], value: selected, onChange: event => (heard.select.push(event.target.value), setSelected(event.target.value)) }),
			h(ui.ChoiceMenu, { label: 'Environment', options: [{ value: 'env-1', label: 'My first VM' }], value: menu, onChange: value => (heard.menu.push(value), setMenu(value)) })
		);
	}
	await render(h(Form));
	assert.deepEqual(heard.choices, ['large']);
	assert.deepEqual(heard.select, ['us-east4']);
	assert.deepEqual(heard.menu, ['env-1']);
	await render(h(Form));
	assert.deepEqual([heard.choices.length, heard.select.length, heard.menu.length], [1, 1, 1], 'once: the form now holds it');
});
