import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/** `Status` (0.15.0, C2 and DQ-04): a closed set of states whose marks differ by shape as well as hue; `status()` and React `Status` follow; skeletons in the shape of what comes. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
const react = await import('@beyond-js/ui/react');
const { default: React } = await import('react');
const { renderToStaticMarkup } = await import('react-dom/server');
after(() => page.close());
beforeEach(() => page.reset());

const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rule = selector => [...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, names]) => names.split(',').map(name => name.trim()).includes(selector)).map(([, , body]) => body).join('\n');

test('every state has a tone, each tone its own shape, and the family words in English and Spanish', () => {
	const names = ['ready', 'busy', 'waking', 'asleep', 'attention', 'failed', 'unknown', 'success', 'running', 'idle', 'pending', 'stopped', 'done'];
	assert.deepEqual(Object.keys(ui.Status.states).sort(), [...names].sort());
	assert.deepEqual([...new Set(Object.values(ui.Status.states))].sort(), ['attention', 'failure', 'idle', 'progress', 'success', 'unknown']);
	for (const name of names) assert.ok(ui.Status.labels.en[name] && ui.Status.labels.es[name], name);
	assert.ok(Object.isFrozen(ui.Status.labels.en) && Object.isFrozen(ui.Status.states));
	const shapes = {
		success: /background:\s*var\(--color-success\)/,
		progress: /border-inline-end-color:\s*transparent/,
		attention: /rotate\(45deg\)/,
		failure: /border-radius:\s*2px/,
		idle: /1\.5px solid/,
		unknown: /1\.5px dashed/
	};
	for (const [tone, shape] of Object.entries(shapes)) assert.match(rule(`.bui-status-${tone} .bui-status-dot`), shape, tone);
	assert.match(rule('.bui-status-warning .bui-status-dot'), /rotate\(45deg\)/, "status()'s warning is drawn as attention");
	assert.match(rule('.bui-status-danger .bui-status-dot'), /border-radius:\s*2px/, 'and danger as a failure');
});

test('Status: the words carry the meaning, the mark is hidden; state and words patch in place; live says changes', () => {
	const status = new ui.Status({ state: 'busy' }).mount(document.body);
	const root = status.element;
	assert.equal(root.textContent, 'Busy');
	assert.ok(root.classList.contains('bui-status-progress'));
	assert.equal(root.dataset.state, 'busy');
	assert.equal(root.querySelector('.bui-status-dot').getAttribute('aria-hidden'), 'true');
	assert.equal(root.getAttribute('role'), null, 'silent unless live');
	status.state = 'failed';
	assert.equal(status.element, root, 'patched, not replaced');
	assert.deepEqual([root.textContent, root.dataset.tone, root.classList.contains('bui-status-progress')], ['Failed', 'failure', false]);
	status.label = 'Did not start';
	status.state = 'asleep';
	assert.equal(root.textContent, 'Did not start', "the product's words stay until it clears them");
	status.label = null;
	assert.equal(status.label, 'Asleep');
	status.state = 'exploded';
	assert.deepEqual([status.state, root.textContent], ['unknown', 'Unknown'], 'a name outside the set is unknown, never a guess');
	const live = new ui.Status({ state: 'waking', variant: 'badge', live: true, labels: ui.Status.labels.es }).mount(document.body);
	assert.equal(live.element.getAttribute('role'), 'status');
	assert.ok(live.element.classList.contains('bui-status-badge'));
	assert.equal(live.label, 'Despertando');
	status.destroy();
	assert.equal(root.isConnected, false);
});

test('React Status draws the same shapes and words; the earlier label and tone form is unchanged', () => {
	const h = React.createElement;
	assert.equal(renderToStaticMarkup(h(react.Status, { label: 'Ready', tone: 'success' })), ui.status('Ready', 'success').outerHTML);
	const markup = renderToStaticMarkup(h(react.Status, { state: 'attention', variant: 'badge' }));
	assert.equal(markup, new ui.Status({ state: 'attention', variant: 'badge' }).element.outerHTML);
	assert.match(renderToStaticMarkup(h(react.Status, { state: 'ready', labels: ui.Status.labels.es })), /Lista/);
});

test('skeletons take the shape of what comes: lines, list rows or table rows, the same in React', () => {
	assert.equal(ui.skeleton(2).querySelectorAll('.bui-skeleton-line').length, 2, 'skeleton(n) as before');
	const list = ui.skeleton({ rows: 3, kind: 'list' });
	assert.ok(list.classList.contains('bui-skeleton-list'));
	assert.equal(list.querySelectorAll('.bui-skeleton-row').length, 3);
	assert.equal(list.querySelectorAll('.bui-skeleton-mark').length, 3);
	assert.equal(ui.skeleton({ rows: 2, kind: 'table' }).querySelectorAll('.bui-skeleton-line').length, 6);
	assert.equal(ui.skeleton({ kind: 'grid' }).className, 'bui-skeleton', 'an unknown kind draws lines');
	assert.equal(list.getAttribute('aria-hidden'), 'true');
	const h = React.createElement;
	assert.equal(renderToStaticMarkup(h(react.Skeleton, { rows: 3, kind: 'list' })), list.outerHTML);
	assert.equal(renderToStaticMarkup(h(react.Skeleton, { lines: 2 })), ui.skeleton(2).outerHTML);
});
