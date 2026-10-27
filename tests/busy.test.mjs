import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const said = button => button.element.textContent.trim();

test('a busy button says its label with one ellipsis, also when the label already ends in one (0.44.0)', () => {
	const plain = new ui.Button({ label: 'Save', busy: true }).mount(document.body);
	assert.equal(said(plain), 'Save…');
	const opening = new ui.Button({ label: 'Disconnect Claude Code…', busy: true }).mount(document.body);
	assert.equal(said(opening), 'Disconnect Claude Code…');
	const dotted = new ui.Button({ label: 'Take over this machine...', busy: true }).mount(document.body);
	assert.equal(said(dotted), 'Take over this machine…');
	opening.busy = false;
	assert.equal(said(opening), 'Disconnect Claude Code…', 'at rest the label is drawn as written');
});

test('a product\'s own busy words get the label without its ellipsis, and a node label is never touched', () => {
	const own = new ui.Button({ label: 'Conectar…', busy: true, labels: { busy: '{label} en curso' } }).mount(document.body);
	assert.equal(said(own), 'Conectar en curso');
	const node = document.createElement('strong');
	node.textContent = 'Ready…';
	const drawn = new ui.Button({ label: node, busy: true }).mount(document.body);
	assert.equal(said(drawn), 'Ready…');
});
