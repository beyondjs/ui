import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

const page = new Page();
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const dom = await import('@beyond-js/ui/dom');
const ui = await import('@beyond-js/ui/react');
const h = React.createElement;
const { act } = React;

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

/** Tag, sorted attributes and children: the markup without attribute order. */
const shape = node => (node.nodeType === 3 ? node.textContent : { tag: node.tagName, attributes: [...node.attributes].map(({ name, value }) => `${name}=${value}`).sort(), children: [...node.childNodes].map(shape) });

test('a wait is an announced line above row-shaped placeholders on a raised frame', () => {
	const wait = dom.waiting();
	assert.ok(wait.hasAttribute('data-frame'));
	const label = wait.querySelector('.bui-waiting-label');
	assert.equal(label.getAttribute('role'), 'status');
	assert.equal(label.textContent, 'Loading…');
	const skeleton = wait.querySelector('.bui-skeleton');
	assert.equal(skeleton.getAttribute('aria-hidden'), 'true');
	assert.ok(skeleton.classList.contains('bui-skeleton-list'));
	assert.equal(skeleton.children.length, 1);
});

test('a wait takes the shape, the words and the frame it is given', () => {
	assert.equal(dom.waiting({ language: 'es' }).textContent, 'Cargando…');
	assert.equal(dom.waiting({ language: 'fr' }).textContent, 'Loading…');
	const named = dom.waiting({ label: dom.loading.text({ name: 'the machines' }), rows: 3, kind: 'table', frame: false });
	assert.equal(named.querySelector('[role=status]').textContent, 'Loading the machines…');
	assert.equal(named.hasAttribute('data-frame'), false);
	assert.equal(named.querySelectorAll('.bui-skeleton-table > .bui-skeleton-row').length, 3);
	assert.equal(dom.waiting(2).querySelectorAll('.bui-skeleton-row').length, 2);
});

test('a section waits in place: heading and actions kept, busy until its content arrives', () => {
	const action = document.createElement('button');
	const section = new dom.Section({ title: 'Recent', actions: [action], waiting: { rows: 2 } });
	const element = section.element;
	assert.equal(element.getAttribute('aria-busy'), 'true');
	assert.equal(element.querySelector('.bui-section-title').textContent, 'Recent');
	assert.ok(element.querySelector('.bui-section-actions').contains(action));
	assert.equal(element.querySelectorAll('.bui-section-body .bui-waiting .bui-skeleton-row').length, 2);
	const row = document.createElement('p');
	section.children = [row];
	assert.equal(element.hasAttribute('aria-busy'), false);
	assert.equal(element.querySelector('.bui-waiting'), null);
	assert.ok(element.contains(row));
	section.wait({ frame: false });
	assert.equal(element.getAttribute('aria-busy'), 'true');
	assert.equal(element.querySelector('.bui-waiting').hasAttribute('data-frame'), false);
	assert.equal(new dom.Section({ title: 'Working', waiting: true }).element.querySelector('.bui-waiting-label').textContent, 'Loading…');
});

test('React draws the same wait and section', async () => {
	await act(() => root.render(h('div', null, h(ui.Waiting, { rows: 2, kind: 'table', language: 'es' }), h(ui.Section, { title: 'Recent', waiting: true }, h('p', null, 'kept back')))));
	const [wait, section] = host.firstChild.children;
	assert.deepEqual(shape(wait), shape(dom.waiting({ rows: 2, kind: 'table', language: 'es' })));
	assert.equal(section.getAttribute('aria-busy'), 'true');
	assert.deepEqual(shape(section.querySelector('.bui-waiting')), shape(dom.waiting()));
	assert.doesNotMatch(section.textContent, /kept back/);
	await act(() => root.render(h(ui.Section, { title: 'Recent' }, h('p', null, 'arrived'))));
	assert.equal(host.querySelector('section').hasAttribute('aria-busy'), false);
	assert.match(host.textContent, /arrived/);
});

test('placeholders are drawn in the divider role and the framed wait is a raised surface', () => {
	const css = name => readFileSync(new URL(`../src/styles/${name}`, import.meta.url), 'utf8');
	assert.match(css('feedback.css'), /\.bui-skeleton-line \{[^}]*background: var\(--color-border-strong\)/);
	assert.match(css('status.css'), /\.bui-skeleton-mark \{[^}]*background: var\(--color-border-strong\)/);
	assert.match(css('links.css'), /\.bui-waiting\[data-frame\] \{[^}]*background: var\(--color-surface-raised\)/);
	assert.doesNotMatch(css('feedback.css'), /\.bui-waiting[^{]*\{[^}]*animation/);
});
