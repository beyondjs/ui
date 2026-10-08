import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page as Window } from './support/page.mjs';

/** The React Diff (0.11.2): driven by the DOM class under StrictMode, one diff after the development double mount, a new patch applied with each file's open state kept, files given split, Spanish, released on unmount. */
const page = new Window();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
const dom = await import('@beyond-js/ui/dom');
const h = React.createElement;
const { act, StrictMode } = React;
const fixture = name => readFileSync(new URL(`./fixtures/diff/${name}.patch`, import.meta.url), 'utf8');
let root = null;

after(() => page.close());
beforeEach(async () => {
	if (root) await act(() => root.unmount());
	page.reset();
	const host = document.createElement('div');
	document.body.append(host);
	root = createRoot(host);
});
const render = element => act(() => root.render(h(StrictMode, null, element)));

test('Diff: one diff under StrictMode, a new patch keeps the open state by path, files given split, unmount removes it', async () => {
	assert.ok(ui.Diff.labels === dom.Diff.labels && ui.Diff.parse === dom.Diff.parse, 'the copy and the parser of the DOM class');
	await render(h(ui.Diff, { patch: fixture('git'), label: 'Changes of the conversation' }));
	assert.equal(document.querySelectorAll('.bui-diff').length, 1, 'the development double mount leaves one diff');
	const section = document.querySelector('.bui-diff');
	assert.equal(section.getAttribute('aria-label'), 'Changes of the conversation');
	assert.equal(section.querySelectorAll('.bui-diff-file').length, 3);
	const notes = () => [...document.querySelectorAll('.bui-diff-file')].find(node => node.dataset.path === 'docs/notes.md');
	notes().querySelector('.bui-diff-toggle').click();
	assert.equal(notes().hasAttribute('data-open'), false);
	await render(h(ui.Diff, { patch: fixture('git') + fixture('whitespace'), label: 'Changes of the conversation' }));
	assert.ok(document.querySelector('.bui-diff') === section, 'the same diff, updated');
	assert.equal(section.querySelectorAll('.bui-diff-file').length, 4);
	assert.equal(notes().hasAttribute('data-open'), false, 'the folded file stays folded');
	await render(h(ui.Diff, { files: [{ path: 'src/a.js', hunks: [{ old: 1, new: 1, lines: ['-a', '+b'] }] }], label: 'Changes of the conversation' }));
	assert.deepEqual([...section.querySelectorAll('.bui-diff-file')].map(node => node.dataset.path), ['src/a.js']);
	await act(() => root.unmount());
	root = null;
	assert.equal(document.querySelector('.bui-diff'), null);
});

test('Diff: Spanish through Diff.labels.es, the heading level and the summary as props', async () => {
	await render(h(ui.Diff, { patch: fixture('git'), labels: ui.Diff.labels.es, locale: 'es', level: 2, summary: false }));
	const section = document.querySelector('.bui-diff');
	assert.equal(section.getAttribute('aria-label'), 'Cambios');
	assert.equal(section.querySelector('.bui-diff-summary'), null);
	assert.equal(section.querySelectorAll('h2.bui-diff-heading').length, 3);
	assert.equal(section.querySelector('.bui-copy-button button').textContent, 'Copiar ruta');
	assert.equal(section.querySelector('.bui-diff-line[data-kind="add"] .bui-diff-said').textContent, 'Línea añadida 2: ');
});
