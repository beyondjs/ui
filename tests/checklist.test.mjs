import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/** `Checklist` and `EmptyState` (0.15.0, DQ-17): setup steps in order with their progress, and an empty place that tells no data, no match and no context apart. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const react = await import('@beyond-js/ui/react');
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
after(() => page.close());
beforeEach(() => page.reset());

const steps = (calls = []) => [
	{ key: 'machine', title: 'Create a machine', detail: 'Beyond runs it for you.', action: { label: 'Create a machine', run: () => calls.push('machine') } },
	{ key: 'engine', title: 'Connect Claude Code', action: { label: 'Connect', run: () => calls.push('engine') } },
	{ key: 'repository', title: 'Add a repository', action: { label: 'Add', href: '/repositories/new' } }
];
const states = list => [...list.element.querySelectorAll('.bui-checklist-step')].map(node => node.dataset.state);

test('the first step not done is current; done steps fold; the head says the progress', () => {
	const calls = [];
	const list = new ui.Checklist({ title: 'Set up this project', steps: steps(calls) }).mount(document.body);
	assert.deepEqual(states(list), ['current', 'todo', 'todo']);
	assert.equal(list.element.querySelector('.bui-checklist-progress').textContent, '0 of 3 done');
	assert.equal(list.element.querySelector('[aria-current="step"]').dataset.key, 'machine');
	list.element.querySelector('[data-key="machine"] .bui-checklist-action').click();
	assert.deepEqual(calls, ['machine']);
	assert.equal(list.element.querySelector('[data-key="repository"] a.bui-checklist-action').getAttribute('href'), '/repositories/new');
	list.steps = steps().map(step => (step.key === 'machine' ? { ...step, state: 'done' } : step));
	assert.deepEqual(states(list), ['done', 'current', 'todo']);
	const done = list.element.querySelector('[data-key="machine"]');
	assert.equal(done.querySelector('.bui-checklist-action'), null, 'a done step folds to its title');
	assert.equal(done.querySelector('.bui-checklist-detail'), null);
	assert.ok(done.querySelector('.bui-checklist-marker svg'), 'with a check');
	assert.match(done.querySelector('.bui-checklist-name').textContent, /Done/, 'its state in words for assistive technology');
	assert.equal(list.element.querySelector('.bui-checklist-progress').textContent, '1 of 3 done');
	assert.equal(list.element.querySelector('.bui-checklist-bar').style.getPropertyValue('--bui-checklist-done'), String(1 / 3));
	list.destroy();
});

test('a blocked step says why; focus on an action stays through a patch; the last step done completes it; Spanish', () => {
	const list = new ui.Checklist({ steps: steps(), labels: ui.Checklist.labels.es }).mount(document.body);
	const action = list.element.querySelector('[data-key="engine"] .bui-checklist-action');
	action.focus();
	list.steps = [{ ...steps()[0] }, { ...steps()[1], state: 'blocked', reason: 'Necesita una máquina' }, steps()[2]];
	assert.equal(document.activeElement.closest('[data-key]').dataset.key, 'engine', 'focus stayed on that step');
	assert.equal(list.element.querySelector('[data-key="engine"] .bui-checklist-reason').textContent, 'Necesita una máquina');
	assert.deepEqual(states(list), ['current', 'blocked', 'todo']);
	list.steps = steps().map(step => ({ ...step, state: 'done' }));
	assert.ok(list.element.hasAttribute('data-complete'));
	assert.equal(list.element.querySelector('.bui-checklist-progress').textContent, '3 de 3 hechos');
	for (const key of Object.keys(ui.Checklist.labels.en)) assert.ok(key in ui.Checklist.labels.es, key);
	list.steps = [];
	assert.equal(list.element.hasAttribute('data-complete'), false, 'nothing to do is not complete');
	list.destroy();
});

test('EmptyState tells its kinds apart, offers one action, clears a filter, and carries a first run', () => {
	const calls = [];
	const empty = new ui.EmptyState({ kind: 'empty', title: 'No machine yet', text: 'A machine runs your AI engines.', action: { label: 'Create a machine', run: () => calls.push('create') } }).mount(document.body);
	assert.equal(empty.element.dataset.kind, 'empty');
	assert.ok(empty.element.querySelector('.bui-button-primary'));
	empty.element.querySelector('.bui-button-primary').click();
	const match = new ui.EmptyState({ kind: 'match', title: 'No conversation matches “deploy”', clear: () => calls.push('clear'), labels: ui.EmptyState.labels.es }).mount(document.body);
	const clear = match.element.querySelector('.bui-button-quiet');
	assert.equal(clear.textContent, 'Quitar el filtro');
	clear.click();
	assert.deepEqual(calls, ['create', 'clear']);
	const context = new ui.EmptyState({ kind: 'context', title: 'Choose a project', clear: () => {} }).mount(document.body);
	assert.equal(context.element.querySelector('.bui-button-quiet'), null, 'clearing is only for a filter');
	const first = new ui.EmptyState({ title: 'Set up this project', checklist: { steps: steps() } }).mount(document.body);
	assert.ok(first.checklist instanceof ui.Checklist);
	assert.ok(first.element.contains(first.checklist.element));
	first.destroy();
	assert.equal(first.checklist.destroyed, true);
	const odd = new ui.EmptyState({ kind: 'nothing', title: 'Nothing' });
	assert.equal(odd.element.dataset.kind, 'empty', 'an unknown kind is no data');
});

test('React Checklist and EmptyState read actions from the latest props', async () => {
	const h = React.createElement;
	const host = document.createElement('div');
	document.body.append(host);
	const root = createRoot(host);
	const calls = [];
	const draw = mark => React.act(() => root.render(h('div', null, h(react.Checklist, { title: 'Set up', steps: [{ key: 'a', title: 'Create', action: { label: 'Create', onSelect: () => calls.push(mark) } }] }), h(react.EmptyState, { kind: 'match', title: 'No match', onClear: () => calls.push(`clear ${mark}`) }))));
	await draw('first');
	await draw('second');
	host.querySelector('.bui-checklist-action').click();
	host.querySelector('.bui-empty .bui-button-quiet').click();
	assert.deepEqual(calls, ['second', 'clear second']);
	await React.act(() => root.unmount());
});

test('the built stylesheet: a step\'s detail and a blocked step\'s reason stop at the reading measure, as a page\'s lead (0.42.0)', () => {
	const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
	/** The declarations of the rules whose selector list names this selector exactly, in the order the sheet holds them. */
	const rules = selector =>
		[...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, selectors]) => selectors.split(',').map(item => item.trim()).includes(selector)).map(([, , body]) => body);
	const widths = selector => rules(selector).flatMap(body => [...body.matchAll(/max-width:\s*([^;]+)/g)].map(([, value]) => value.trim()));
	for (const part of ['.bui-checklist-detail', '.bui-checklist-reason']) {
		assert.deepEqual(widths(part), ['var(--layout-measure)'], `${part} is held at the reading measure`);
		// Any other rule whose selector ends in the part, however it is reached (`.bui-checklist-step ${part}`), sets no width of its own
		const names = new RegExp(`\\${part}(?![\\w-])`);
		const others = [...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, selectors]) => !selectors.split(',').map(item => item.trim()).includes(part) && selectors.split(',').some(item => names.test(item.trim().split(/\s|>|\+|~/).at(-1))));
		assert.deepEqual(others.filter(([, , body]) => /(^|;)\s*(max-)?width\s*:/.test(body)).map(([, selectors]) => selectors.trim()), [], `no other rule widens ${part}`);
	}
	assert.deepEqual(widths('.bui-page-lead'), ['var(--layout-measure)'], 'the same measure as a page\'s lead');
	assert.deepEqual(widths('.bui-checklist'), ['var(--layout-form)'], 'the checklist itself keeps the form tier');
	assert.deepEqual(widths('.bui-checklist-name'), [], 'a step\'s title is a name, not prose');
});
