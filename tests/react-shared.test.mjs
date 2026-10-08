import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';

/** The React forms of 0.11.1: `useHint` under StrictMode, `Age` and `Hint` re-exported, the Composer's Options and `compact={false}`, a cut suggestion list. */
const page = new Window();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
const dom = await import('@beyond-js/ui/dom');
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
const shown = () => [...document.querySelectorAll('.bui-hint')].filter(node => !node.hidden);

test('useHint gives a product\'s own glyph-only control the family tooltip, once under StrictMode, released on unmount', async () => {
	function Toolbar() {
		const ref = ui.useHint();
		return h('div', { ref, className: 'toolbar' }, h('button', { type: 'button', className: 'bui-icon-button', 'aria-label': 'Copy link', 'data-bui-hint': true }, h(ui.Icon, { name: 'more' })));
	}
	await render(h(Toolbar));
	const toolbar = document.querySelector('.toolbar');
	assert.ok(toolbar.hasAttribute('data-bui-hints'));
	toolbar.querySelector('button').focus();
	assert.equal(shown().length, 1, 'one hint, though the effect ran twice');
	assert.equal(shown()[0].textContent, 'Copy link');
	await act(() => root.unmount());
	root = null;
	assert.equal(document.querySelectorAll('.bui-hint').length, 0);
});

test('Age and Hint are the DOM classes, re-exported', () => {
	assert.ok(ui.Age === dom.Age);
	assert.ok(ui.Hint === dom.Hint);
	assert.equal(new ui.Age({ now: () => 600_000 }).of(0 + 1).label, '9 min');
});

test('Composer: Options first in the toolbar by default; compact={false} creates a box without it', async () => {
	const settings = h('button', { type: 'button', className: 'setting' }, 'Model Opus 5.5');
	const view = compact => h(ui.Composer, { label: 'Message to Codex', settings, attach: { onFiles: () => undefined }, onSubmit: () => Promise.resolve(), ...(compact === undefined ? {} : { compact }) });
	await render(view());
	const box = document.querySelector('.bui-composer');
	const more = box.querySelector('.bui-composer-bar > .bui-composer-more');
	assert.ok(more, 'Options in the toolbar');
	assert.equal(more.getAttribute('aria-label'), 'Options');
	assert.ok(box.hasAttribute('data-compact'));
	more.click();
	assert.equal(more.getAttribute('aria-expanded'), 'true');
	await render(view(false));
	assert.equal(document.querySelectorAll('.bui-composer').length, 1);
	assert.equal(document.querySelector('.bui-composer-more'), null);
	assert.equal(document.querySelector('.bui-composer').hasAttribute('data-compact'), false);
});

test('Composer: onSuggest may answer a cut list, which ends with its line', async () => {
	await render(h(ui.Composer, { label: 'Message', onSubmit: () => Promise.resolve(), onSuggest: () => Promise.resolve({ items: [{ value: '@a.js' }, { value: '@b.js' }], total: 9 }), suggest: { delay: 1, bound: 200 } }));
	const field = document.querySelector('.bui-composer-field');
	field.value = '@';
	field.setSelectionRange(1, 1);
	await act(() => void field.dispatchEvent(new page.window.InputEvent('input', { bubbles: true })));
	const line = document.querySelector('.bui-composer-suggest-line');
	await page.until(() => line.textContent === '2 of 9 · keep typing to narrow');
	assert.equal(line.hidden, false);
});
