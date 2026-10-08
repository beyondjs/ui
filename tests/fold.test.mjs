import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/** A narrow composer's Options (0.11.1): one named control that folds the settings and Attach, a disclosure with its tooltip, folded again by Escape and by a send; `compact: false` keeps 0.11.0. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const chip = () => new ui.ChoiceChip({ label: 'Model', options: [{ value: 'a', label: 'Opus 5.5' }, { value: 'b', label: 'Sonnet 5' }], value: 'a' });
const attach = { onfiles: () => undefined };
/** The control is shown by the stylesheet's container query, which happy-dom does not apply: a test says it. */
const shown = (button, value = true) => (button.getClientRects = () => (value ? [{ width: 32, height: 32 }] : []));

test('with settings or Attach, Options comes first in the toolbar: the more glyph, named, a disclosure that controls both, with the family tooltip', () => {
	const model = chip();
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), settings: [model], attach }).mount(document.body);
	const bar = composer.element.querySelector('.bui-composer-bar');
	const button = composer.fold.button;
	assert.ok(bar.firstElementChild === button, 'first in the toolbar, before its start');
	assert.equal(composer.element.querySelector('.bui-composer-start').contains(button), false, "the start's children are those of 0.11.0");
	assert.equal(button.getAttribute('aria-label'), 'Options');
	assert.ok(button.querySelector('svg'), 'the glyph alone');
	assert.ok(ui.unlabeled.includes('more'), 'on the closed list (D11)');
	assert.equal(button.getAttribute('aria-expanded'), 'false');
	assert.equal(button.getAttribute('role'), null, 'a disclosure button, not a menu');
	const controlled = button.getAttribute('aria-controls').split(' ').map(id => document.getElementById(id));
	assert.deepEqual(controlled.map(node => node.className.split(' ').find(name => name.startsWith('bui-composer-'))), ['bui-composer-attach', 'bui-composer-settings']);
	assert.ok(button.hasAttribute('data-bui-hint') && button.hasAttribute('data-bui-hints'), 'the family tooltip');
	assert.ok(composer.element.hasAttribute('data-compact'));
	assert.equal(composer.fold.open, false);
	composer.destroy();
	model.destroy();
});

test('pressing Options shows what it folds and says so; pressing it again folds them; focus stays on it', () => {
	const model = chip();
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), settings: [model] }).mount(document.body);
	const button = composer.fold.button;
	button.focus();
	button.click();
	assert.equal(composer.fold.open, true);
	assert.ok(composer.element.hasAttribute('data-options'));
	assert.equal(button.getAttribute('aria-expanded'), 'true');
	assert.ok(document.activeElement === button);
	assert.equal(document.querySelector('.bui-hint:not([hidden])'), null, 'no tooltip over what it opened');
	button.click();
	assert.equal(composer.fold.open, false);
	assert.equal(button.getAttribute('aria-expanded'), 'false');
	composer.destroy();
	model.destroy();
});

test('Escape on a shown setting folds them and returns focus to Options; an open menu takes Escape first; a hidden Options takes nothing', () => {
	const model = chip();
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), settings: [model] }).mount(document.body);
	const button = composer.fold.button;
	composer.fold.toggle(true);
	shown(button, false);
	const escape = page.key(model.control, 'Escape');
	assert.equal(escape.defaultPrevented, false, 'a hidden Options (wide composer) leaves Escape alone');
	assert.equal(composer.fold.open, true);
	shown(button);
	model.control.focus();
	page.key(model.control, 'ArrowDown');
	assert.equal(model.expanded, true);
	page.key(document.activeElement, 'Escape');
	assert.equal(model.expanded, false, 'the menu closed');
	assert.equal(composer.fold.open, true, 'what Options shows stays');
	page.key(model.control, 'Escape');
	assert.equal(composer.fold.open, false);
	assert.ok(document.activeElement === button, 'focus back on Options');
	page.key(composer.field, 'Escape');
	assert.equal(composer.fold.open, false, 'Escape in the field is not its own');
	composer.destroy();
	model.destroy();
});

test('a sent message folds them again; a refused one keeps them shown', async () => {
	const model = chip();
	let refuse = true;
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => (refuse ? Promise.reject(new Error('no')) : Promise.resolve()), settings: [model] }).mount(document.body);
	composer.fold.toggle(true);
	composer.value = 'Hello';
	assert.equal(await composer.submit(), false);
	assert.equal(composer.fold.open, true, 'refused: still shown');
	refuse = false;
	assert.equal(await composer.submit(), true);
	assert.equal(composer.fold.open, false, 'sent: folded');
	composer.destroy();
	model.destroy();
});

test('Options exists only while there is something to fold, and never with compact: false', () => {
	const tool = document.createElement('button');
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), tools: [tool] }).mount(document.body);
	assert.equal(composer.element.querySelector('.bui-composer-more'), null, 'tools alone are never folded');
	assert.equal(composer.element.hasAttribute('data-compact'), false);
	const model = chip();
	composer.settings = [model];
	assert.ok(composer.element.querySelector('.bui-composer-more'));
	composer.fold.toggle(true);
	composer.settings = [];
	assert.equal(composer.element.querySelector('.bui-composer-more'), null, 'removed with the last setting');
	assert.equal(composer.fold.open, false);
	composer.destroy();
	const wide = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), settings: [model], attach, compact: false }).mount(document.body);
	assert.equal(wide.element.querySelector('.bui-composer-more'), null);
	assert.equal(wide.element.hasAttribute('data-compact'), false);
	wide.destroy();
	model.destroy();
});

test('Spanish names it «Opciones»; a paste still attaches while Attach is folded; destroy releases its tooltip', () => {
	const files = [];
	const composer = new ui.Composer({ label: 'Mensaje', onsubmit: () => Promise.resolve(), labels: ui.Composer.labels.es, attach: { onfiles: list => files.push(...list) } }).mount(document.body);
	const button = composer.fold.button;
	assert.equal(button.getAttribute('aria-label'), 'Opciones');
	const data = { files: [new File(['x'], 'a.png', { type: 'image/png' })], types: ['Files'], getData: () => '' };
	const paste = new Event('paste', { bubbles: true, cancelable: true });
	Object.defineProperty(paste, 'clipboardData', { value: data });
	composer.field.dispatchEvent(paste);
	assert.equal(files.length, 1);
	button.focus();
	composer.destroy();
	assert.equal(document.querySelectorAll('.bui-hint').length, 0);
});

test('the stylesheet folds only below 30rem of composer, only a compact one, and gives the shown start the row beside Options', () => {
	const query = sheet.slice(sheet.indexOf('@container bui-composer (max-width: 30rem)'));
	assert.match(sheet, /\.bui-composer-more\s*\{[^}]*display:\s*none/);
	assert.match(query, /\.bui-composer\[data-compact\] \.bui-composer-more\s*\{[^}]*display:\s*inline-grid/);
	assert.match(query, /\.bui-composer\[data-compact\]:not\(\[data-options\]\) \.bui-composer-attach,\s*\.bui-composer\[data-compact\]:not\(\[data-options\]\) \.bui-composer-settings\s*\{[^}]*display:\s*none/);
	assert.match(query, /\.bui-composer\[data-compact\]\[data-options\] \.bui-composer-start\s*\{[^}]*flex-basis:\s*calc\(100% - var\(--bui-control\) - var\(--space-2\)\)/);
});
