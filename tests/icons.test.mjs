import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Scene } from './fixtures/controls.mjs';
import { survey } from './support/names.mjs';

/** The icon catalog (D11): every name renders, sizes and labels, clear failures, and named icon-only controls. */
// Glyphs the package still shows without a visible label outside the closed list, on record for the
// owner (docs/components.md#icons): Help's question mark, and the family bar's account avatar before
// the person's name is known.
const pending = ['help', 'user'];
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

test('the catalog lists unique names and every one renders a 24 px grid glyph', () => {
	assert.ok(ui.icons.length >= 50, `${ui.icons.length} icons`);
	assert.equal(new Set(ui.icons).size, ui.icons.length);
	assert.ok(Object.isFrozen(ui.icons));
	const drawings = new Set();
	for (const name of ui.icons) {
		const svg = ui.icon(name);
		assert.equal(svg.getAttribute('viewBox'), '0 0 24 24', name);
		assert.equal(svg.getAttribute('data-icon'), name);
		const paths = [...svg.querySelectorAll('path')].map(path => path.getAttribute('d'));
		assert.ok(paths.length && paths.every(d => /^M[\d.]/.test(d)), `${name} has path data`);
		const drawing = paths.join('|');
		assert.ok(!drawings.has(drawing), `${name} duplicates another glyph`);
		drawings.add(drawing);
	}
	for (const name of ['close', 'menu', 'more', 'search', 'bell', 'chevron', 'pin', 'minimize', 'maximize', 'restore']) assert.ok(ui.icons.includes(name), `${name} is in the catalog`);
});

test('icon: 20 px and decorative by default, 16 and 24 on request, an image with a label', () => {
	const plain = ui.icon('search');
	assert.deepEqual(['width', 'height', 'data-size', 'aria-hidden', 'role', 'aria-label', 'focusable'].map(name => plain.getAttribute(name)), ['20', '20', '20', 'true', null, null, 'false']);
	assert.equal(plain.getAttribute('class'), 'bui-icon');
	for (const size of [16, 24]) assert.equal(ui.icon('search', { size }).getAttribute('data-size'), String(size));
	const named = ui.icon('bell', { size: 24, label: 'Notifications' });
	assert.equal(named.getAttribute('role'), 'img');
	assert.equal(named.getAttribute('aria-label'), 'Notifications');
	assert.equal(named.getAttribute('aria-hidden'), null);
});

test('icon: an unknown name, another size or an empty label fails clearly', () => {
	assert.throws(() => ui.icon('trash'), { name: 'TypeError', message: /Unknown icon "trash"/ });
	assert.throws(() => ui.icon(undefined), TypeError);
	assert.throws(() => ui.icon('toString'), TypeError, 'inherited object keys are not icons');
	assert.throws(() => ui.icon('close', { size: 18 }), { name: 'RangeError', message: /16, 20, 24/ });
	assert.throws(() => ui.icon('close', { label: '  ' }), TypeError);
	assert.throws(() => new ui.Button({ label: 'Delete', glyph: 'trash' }), /Unknown icon/, 'a component glyph fails the same way');
});

test('the components keep their own unsized glyphs', () => {
	const button = new ui.Button({ label: 'Save', glyph: 'check' });
	const mark = button.element.querySelector('svg');
	assert.equal(mark.getAttribute('data-icon'), 'check');
	assert.equal(mark.getAttribute('data-size'), null, 'sized by the button stylesheet');
	assert.equal(mark.getAttribute('aria-hidden'), 'true');
	button.destroy();
});

test('the closed list of glyphs shown without a visible label is part of the catalog', () => {
	assert.deepEqual([...ui.unlabeled], ['close', 'menu', 'more', 'search', 'bell', 'chevron', 'pin', 'minimize', 'maximize', 'restore']);
	assert.ok(ui.unlabeled.every(name => ui.icons.includes(name)));
});

test('every icon-only control of the components has an accessible name and a glyph of the closed list', async () => {
	const scene = await new Scene(ui).build();
	const controls = survey(false);
	const bare = controls.filter(control => control.bare);
	assert.ok(bare.length >= 6, `the scene shows icon-only controls (${bare.map(control => control.glyphs.join('+')).join(', ')})`);
	for (const control of bare) {
		assert.ok(control.name, `icon-only ${control.describe} has no accessible name`);
		assert.ok(control.glyphs.every(name => ui.unlabeled.includes(name) || pending.includes(name)), `${control.describe} shows ${control.glyphs} without a visible label`);
	}
	scene.destroy();
});

test('the icon-only check fails an unnamed icon-only button', () => {
	const bad = document.createElement('button');
	bad.append(ui.icon('close'));
	const named = document.createElement('button');
	named.setAttribute('aria-label', 'Close');
	named.append(ui.icon('close'));
	const labelled = document.createElement('button');
	labelled.append(ui.icon('plus'), Object.assign(document.createElement('span'), { textContent: 'New project' }));
	document.body.append(bad, named, labelled);
	const found = survey(false);
	assert.deepEqual(found.map(control => [control.bare, control.name]), [[true, ''], [true, 'Close'], [false, 'New project']]);
});
