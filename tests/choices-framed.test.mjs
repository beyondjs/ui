import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/**
 * Choices drawn framed (0.46.0): `framed` in the DOM and in React draws the options as one framed box of rows, the
 * control first, its title (the label, whose target covers the row), the hint under it and the state as a tag at the
 * row's end, the hint and the state describing the control; a disabled option keeps its reason and never toggles; the
 * unframed group keeps its markup. Where the parts land, the chosen row's surface and the narrow row are measured in
 * the browser (`acceptance/checks/framing.mjs`, and the insets check's cards).
 */
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ui = await import('@beyond-js/ui/dom');
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const react = await import('@beyond-js/ui/react');
const h = React.createElement;
const { act, StrictMode } = React;
after(() => page.close());
beforeEach(() => page.reset());

const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const options = [
	{ value: 'read', label: 'Read your projects', hint: 'See projects, their members and settings.', status: ['Read only', 'neutral'] },
	{ value: 'run', label: 'Start machines', hint: 'Create and start machines for you.', status: ['Can incur costs', 'warning'] },
	{ value: 'delete', label: 'Delete projects', disabled: true, reason: 'Only an owner can allow this.' }
];
/** Tag, sorted attributes (generated ids replaced) and children: the markup without attribute order or ids; `checked` is the input's state, which React also writes as an attribute. */
const shape = node => (node.nodeType === 3 ? node.textContent : { tag: node.tagName, attributes: [...node.attributes].filter(({ name }) => name !== 'checked').map(({ name, value }) => `${name}=${/^(id|for|name|aria-describedby)$/.test(name) ? 'id' : value}`).sort(), children: [...node.childNodes].map(shape) });

test('DOM framed: one framed box of rows, the control first, its title, the hint under it and the state as a tag at the end, describing the control', () => {
	const group = new ui.Choices({ legend: 'Permissions', options, value: ['read'], framed: true }).mount(document.body);
	assert.equal(group.element.hasAttribute('data-framed'), true);
	const rows = [...group.element.querySelectorAll('.bui-choices-list > .bui-choice')];
	assert.equal(rows.length, 3);
	const [first, , last] = rows;
	assert.deepEqual([...first.children].map(node => node.localName + (node.className ? `.${node.className.split(' ').join('.')}` : '')), ['input', 'label.bui-choice-title', 'p.bui-choice-note', 'span.bui-status.bui-status-badge.bui-status-neutral']);
	const input = first.querySelector('input');
	const label = first.querySelector('label');
	assert.equal(label.htmlFor, input.id);
	assert.equal(label.textContent, 'Read your projects', 'the state is not in the title');
	const described = input.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent);
	assert.deepEqual(described, ['See projects, their members and settings.', 'Read only']);
	assert.equal(rows[1].querySelector('.bui-status').classList.contains('bui-status-warning'), true);
	assert.equal(rows[1].querySelector('.bui-status-dot').getAttribute('aria-hidden'), 'true');
	assert.equal(last.classList.contains('bui-choice-disabled'), true);
	assert.equal(last.querySelector('.bui-choice-note').textContent, 'Only an owner can allow this.');
	assert.equal(last.querySelector('.bui-status'), null, 'no state, no tag');
	assert.equal(document.getElementById(last.querySelector('input').getAttribute('aria-describedby')).textContent, 'Only an owner can allow this.');
	group.destroy();
});

test('DOM framed: a press on the title toggles its control and reports the value; a disabled option never toggles', () => {
	const seen = [];
	const group = new ui.Choices({ legend: 'Permissions', options, value: ['read'], framed: true, onchange: value => seen.push(value) }).mount(document.body);
	const [read, run, remove] = [...group.element.querySelectorAll('.bui-choice-title')];
	run.click();
	assert.deepEqual(group.value, ['read', 'run']);
	read.click();
	assert.deepEqual(group.value, ['run']);
	remove.click();
	assert.deepEqual(group.value, ['run'], 'the disabled option stays as it was');
	assert.deepEqual(seen, [['read', 'run'], ['run']]);
	group.value = ['read'];
	assert.equal(group.element.querySelector('input[value="read"]').checked, true);
	group.destroy();
});

test('DOM framed: a hint may be a node; radios are framed alike and one radio is still stated', () => {
	const hint = document.createElement('span');
	hint.append('Opens ', Object.assign(document.createElement('strong'), { textContent: 'every' }), ' project');
	const group = new ui.Choices({ legend: 'Access', type: 'radio', name: 'access', options: [{ value: 'some', label: 'Some projects', hint }, { value: 'all', label: 'All projects', hint: 'Including new ones.' }], value: 'some', framed: true }).mount(document.body);
	assert.equal(group.element.querySelector('.bui-choice-note strong').textContent, 'every');
	assert.equal(group.element.querySelectorAll('.bui-choice input[type="radio"]').length, 2);
	group.element.querySelectorAll('.bui-choice-title')[1].click();
	assert.equal(group.value, 'all');
	const one = new ui.Choices({ legend: 'Access', type: 'radio', options: [{ value: 'all', label: 'All projects' }], framed: true }).mount(document.body);
	assert.equal(one.stated, true);
	group.destroy();
	one.destroy();
});

test('DOM unframed: the group keeps its markup, the state inline after the label and no frame', () => {
	const group = new ui.Choices({ legend: 'AI engine', options: options.slice(0, 1) }).mount(document.body);
	assert.equal(group.element.hasAttribute('data-framed'), false);
	assert.deepEqual(shape(group.element.querySelector('.bui-choice')), {
		tag: 'DIV',
		attributes: ['class=bui-choice'],
		children: [
			{ tag: 'INPUT', attributes: ['aria-describedby=id', 'id=id', 'name=id', 'type=checkbox', 'value=read'], children: [] },
			{ tag: 'LABEL', attributes: ['for=id'], children: ['Read your projects', ' ', { tag: 'SPAN', attributes: ['class=bui-status bui-status-neutral'], children: [{ tag: 'SPAN', attributes: ['aria-hidden=true', 'class=bui-status-dot'], children: [] }, 'Read only'] }] },
			{ tag: 'P', attributes: ['class=bui-choice-note', 'id=id'], children: ['See projects, their members and settings.'] }
		]
	});
	group.destroy();
});

test('React framed: the DOM markup, hints and reasons as React content, onChange with the next value', async () => {
	const host = document.body.appendChild(document.createElement('div'));
	const root = createRoot(host);
	const seen = [];
	const view = (value, framed = true) => h(StrictMode, null, h(react.Choices, { legend: 'Permissions', options, value, framed, onChange: next => seen.push(next) }));
	await act(() => root.render(view(['read'])));
	const made = new ui.Choices({ legend: 'Permissions', options, value: ['read'], framed: true });
	assert.deepEqual(shape(host.querySelector('.bui-choices-list')), shape(made.element.querySelector('.bui-choices-list')));
	assert.equal(host.querySelector('fieldset').getAttribute('data-framed'), '');
	const input = host.querySelector('input[value="read"]');
	assert.deepEqual(input.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent), ['See projects, their members and settings.', 'Read only']);
	await act(() => host.querySelectorAll('.bui-choice-title')[1].click());
	assert.deepEqual(seen, [['read', 'run']]);
	await act(() => host.querySelectorAll('.bui-choice-title')[2].click());
	assert.equal(seen.length, 1, 'the disabled option never toggles');
	const rich = [{ value: 'read', label: 'Read your projects', hint: h('span', { className: 'fixture-hint' }, 'See projects ', h(react.Status, { state: 'ready' })) }];
	await act(() => root.render(h(react.Choices, { legend: 'Permissions', options: rich, value: [], framed: true })));
	assert.ok(host.querySelector('.bui-choice-note .fixture-hint .bui-status'), 'a hint may be React content');
	await act(() => root.render(view(['read'], false)));
	assert.equal(host.querySelector('fieldset').hasAttribute('data-framed'), false);
	assert.ok(host.querySelector('.bui-choice label .bui-status:not(.bui-status-badge)'), 'unframed, the state stays inline');
	made.destroy();
	await act(() => root.unmount());
});

test('the stylesheet frames the rows as a framed list, lifts the pointer\'s row, puts the chosen one on the selection and moves the tag under a narrow row\'s hint', () => {
	const rule = selector => {
		const at = sheet.indexOf(`${selector} {`);
		assert.notEqual(at, -1, `${selector} is drawn`);
		return sheet.slice(at, sheet.indexOf('}', at));
	};
	assert.match(rule('.bui-choices[data-framed] > .bui-choices-list'), /border: 1px solid var\(--color-border-strong\);[\s\S]*border-radius: var\(--radius-base\)/);
	assert.match(rule('.bui-choices[data-framed] .bui-choice + .bui-choice::before'), /border-top: 1px solid var\(--color-border-strong\)/);
	assert.match(rule('.bui-choices[data-framed] .bui-choice'), /padding: var\(--bui-choices-inset\)/);
	assert.match(rule('.bui-choices[data-framed] .bui-choice:not(.bui-choice-disabled, :has(> input:checked)):hover'), /background: var\(--overlay-lift\)/);
	assert.match(rule('.bui-choices[data-framed] .bui-choice:has(> input:checked)'), /background: var\(--color-surface-selected\)/);
	assert.match(rule('.bui-choices[data-framed] .bui-choice-title::after'), /position: absolute;\s*inset: 0/);
	assert.match(sheet, /@container bui-choice \(max-width: 30rem\)\s*\{\s*\.bui-choices\[data-framed\] \.bui-choice > \.bui-status \{[^}]*grid-row: 3/);
	const framed = readFileSync(new URL('../src/styles/choices-frame.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
	assert.doesNotMatch(framed, /transition|animation|transform|outline/, 'nothing moves, and no ring of its own');
});
