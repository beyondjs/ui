import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/**
 * D179 (0.28.0): a visible action is named whole, its "…" only on a menu's entry that asks for more
 * before it acts, and an action's label is never cut by the layout. `Ellipses` warns about the first in
 * a development build; the stylesheet's cut texts are each a name, a value or a placeholder, never an
 * action's label.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

test('Ellipses warns once for a visible action that ends in "…", and never for a menu entry, a wait or what is hidden', async () => {
	const warned = [];
	const root = document.body.appendChild(document.createElement('div'));
	root.innerHTML = [
		'<button class="bui-button">Clone to a machine</button>',
		'<a class="bui-link-button" href="#">Use a commit or another ref</a>',
		'<div role="menu"><button role="menuitem">Rename…</button></div>',
		'<div role="listbox"><div role="option"><button>Choose…</button></div></div>',
		'<button class="bui-button" disabled>Saving…</button>',
		'<button class="bui-button" hidden>Hidden…</button>',
		'<button class="bui-button">Open<span class="bui-hidden">…</span></button>'
	].join('');
	const busy = new ui.Button({ label: 'Save', busy: true }).mount(root);
	assert.equal(busy.element.textContent.trim(), 'Save…', "a busy Button's wait");
	const ellipses = new ui.Ellipses({ root, warn: (message, action) => warned.push([message, action.textContent]) });
	assert.deepEqual(ellipses.check(), [], 'none outside a menu');
	const late = Object.assign(document.createElement('button'), { className: 'bui-button', textContent: 'Choose a copy…' });
	root.append(late);
	await new Promise(resolve => setTimeout(resolve, 40));
	assert.equal(warned.length, 1);
	assert.match(warned[0][0], /the action "Choose a copy…" ends in "…" outside a menu/);
	assert.match(warned[0][0], /D179/);
	ellipses.check();
	assert.equal(warned.length, 1, 'once per action');
	late.textContent = 'Open files...';
	assert.deepEqual(ellipses.check().map(item => item.text), ['Open files...'], 'three dots count as one');
	ellipses.destroy();
	busy.destroy();
	assert.equal(ui.Ellipses.enabled, false, 'off outside a development build');
});

test("RefChooser's escape keeps its \"…\" in the menu and is named whole as a visible action (D179)", () => {
	const root = document.body.appendChild(document.createElement('div'));
	const chooser = new ui.RefChooser({ refs: [{ name: 'main', default: true }, { name: 'develop' }] }).mount(root);
	chooser.control.click();
	assert.equal(chooser.element.querySelector('[role="menuitem"]').textContent, 'Use a commit or another ref…', "the menu's entry asks for more");
	const ellipses = new ui.Ellipses({ root, warn: () => {} });
	assert.deepEqual(ellipses.check(), []);
	chooser.unavailable = { retry: () => {} };
	assert.equal(chooser.element.querySelector('.bui-refs-escape').textContent, 'Use a commit or another ref');
	assert.deepEqual(ellipses.check(), [], 'the visible escape passes too');
	ellipses.destroy();
	chooser.destroy();
});

test('the stylesheet cuts with an ellipsis only names, values and a placeholder, never an action\'s label', () => {
	const cut = [...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, , body]) => /text-overflow:\s*ellipsis/.test(body)).flatMap(([, list]) => list.split(',').map(part => part.trim()));
	// Each reviewed for D179: a name or a value whole on hover, focus or the opened menu (D44), a
	// secondary line, or the composer's placeholder. A new one is reviewed before it joins.
	const reviewed = new Set([
		'.bui-page-compact-title',
		'.bui-composer-file-name',
		'.bui-composer-option-detail',
		'.bui-family-place',
		'.bui-lanes-head',
		'.bui-lanes-kind',
		'.bui-lanes-now',
		'.bui-lanes-time',
		'.bui-lanes-facts',
		'.bui-lanes-title',
		'.bui-row-title',
		'.bui-row-meta',
		'.bui-copy-value-start',
		'.bui-sidebar-meta',
		'.bui-composer-placeholder',
		'.bui-composer-summary',
		'.bui-composer[data-fit] .bui-composer-settings .bui-choice-value',
		'.bui-sidebar-entry .bui-sidebar-label'
	]);
	assert.deepEqual(cut.filter(selector => !reviewed.has(selector)), []);
	for (const selector of cut) assert.doesNotMatch(selector, /bui-(button|link-button|menu-button|chip-label|navmenu-label|option-label)\b/, selector);
});
