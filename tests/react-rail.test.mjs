import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';

/** The React forms of 0.12.0's rail: Rail, RailItem (driven by its DOM class) and RailMoment. */
const page = new Window();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
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

test('Rail, RailItem and RailMoment: one item under StrictMode, React children in its content, tone and glyph patched', async () => {
	const view = tone => h(ui.Rail, { label: 'Work' }, h(ui.RailItem, { glyph: 'clock', tone }, h('span', { className: 'said' }, 'Thought for 9 s')), h(ui.RailMoment, { text: '10:51', datetime: '2026-10-09T10:51:00Z' }));
	await render(view('neutral'));
	const rail = document.querySelector('.bui-rail');
	assert.equal(rail.getAttribute('aria-label'), 'Work');
	assert.equal(document.querySelectorAll('.bui-rail-item').length, 1, 'development double mount leaves one item');
	assert.equal(document.querySelector('.bui-rail-content .said').textContent, 'Thought for 9 s');
	assert.equal(document.querySelector('.bui-rail-mark svg').dataset.icon, 'clock');
	assert.equal(document.querySelector('.bui-rail-moment time').textContent, '10:51');
	await render(view('progress'));
	assert.equal(document.querySelector('.bui-rail-item').dataset.tone, 'progress');
	assert.ok(document.querySelector('.bui-rail-mark .bui-spinner'));
	assert.deepEqual([...ui.RailItem.tones], ['neutral', 'success', 'info', 'progress', 'warning', 'danger']);
});
