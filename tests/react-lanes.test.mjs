import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';
import { start, crew } from './fixtures/lanes.mjs';

/** The React form of 0.27.0's `Lanes`, driven by its DOM class: one block under StrictMode, lanes patched by content, the latest onChoose, the ref's focus. */
const page = new Window();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
const dom = await import('@beyond-js/ui/dom');
const h = React.createElement;
const { act, StrictMode, createRef } = React;
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

const clock = new dom.Clock({ now: () => start + 102_000 });
const render = element => act(() => root.render(h(StrictMode, null, element)));
const buttons = () => [...document.querySelectorAll('.bui-lanes button.bui-lanes-lane')];

test('Lanes under StrictMode: one block, lanes patched by content with their buttons and focus kept, the latest onChoose', async () => {
	const chosen = [];
	const ref = createRef();
	const view = (lanes, choose, label = 'Subagents of this turn') => h(ui.Lanes, { ref, label, lanes, clock, locale: 'en', onChoose: choose });
	await render(view(crew(), key => chosen.push(`first:${key}`)));
	assert.equal(document.querySelectorAll('.bui-lanes').length, 1, 'development double mount leaves one block');
	assert.equal(document.querySelector('.bui-lanes').getAttribute('aria-label'), 'Subagents of this turn');
	const before = buttons();
	assert.equal(before.length, 6);
	before[2].focus();
	const changed = crew().map(lane => (lane.key === 'plan' ? { ...lane, now: 'Reading db/schema.sql' } : lane));
	await render(view(changed, key => chosen.push(`second:${key}`), 'Subagentes de este turno'));
	const after = buttons();
	before.forEach((button, index) => assert.ok(after[index] === button, `lane ${index} kept its button`));
	assert.ok(document.activeElement === before[2], 'focus stays on the patched lane');
	assert.equal(after[2].querySelector('.bui-lanes-now').textContent, ', Reading db/schema.sql');
	assert.equal(document.querySelector('.bui-lanes').getAttribute('aria-label'), 'Subagentes de este turno', 'the label in place');
	after[4].click();
	assert.deepEqual(chosen, ['second:fix'], 'onChoose read from the latest props');
	assert.equal(ref.current.focus('bench'), true);
	assert.ok(document.activeElement === after[5]);
	assert.equal(ref.current.focus('nothing'), false);
	assert.ok(ui.Lanes.labels === dom.Lanes.labels);
});

test('Lanes without a trace draws none, and turning it on keeps the lanes', async () => {
	await render(h(ui.Lanes, { label: 'Jobs', lanes: crew(), trace: false, clock }));
	const [first] = buttons();
	assert.equal(document.querySelector('.bui-lanes').hasAttribute('data-trace'), false);
	await render(h(ui.Lanes, { label: 'Jobs', lanes: crew(), trace: true, clock }));
	assert.ok(document.querySelector('.bui-lanes').hasAttribute('data-trace'));
	assert.ok(buttons()[0] === first);
});
