import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/**
 * ComposerChip (0.34.0): a chip that acts, for what goes with a message in a composer's tray ("Line comments
 * 2"), in the chips' geometry (D165) with no chevron; its face is always its accessible name (WCAG 2.5.3) and
 * its description is read after it; its whole face is its family tooltip only while a toolbar sets its label
 * aside, and its value is never cut (D179). Also its React form, on React 19 and 18.
 */
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ui = await import('@beyond-js/ui/dom');
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const adapter = await import('@beyond-js/ui/react');
const h = React.createElement;
const { act, StrictMode } = React;
let root = null;
after(() => page.close());
beforeEach(async () => {
	if (root) await act(() => root.unmount());
	root = null;
	page.reset();
});

const comments = (options = {}) => new ui.ComposerChip({ label: 'Line comments', value: 2, glyph: 'chat', ...options });
const set = (node, width) => (node.getBoundingClientRect = () => ({ width, height: 16, top: 0, left: 0, right: width, bottom: 16, x: 0, y: 0 }));
const shown = () => [...document.querySelectorAll('.bui-hint')].find(hint => !hint.hidden)?.textContent ?? null;

test('a button with its glyph, its muted label and its value, no chevron, its face its name, its description read after it, and its press', () => {
	const pressed = [];
	const chip = comments({ description: 'They go with your next message. Opens them in the conversation\'s changes.', onclick: event => pressed.push(event.type) }).mount(document.body);
	const button = chip.control;
	assert.equal(button.tagName, 'BUTTON');
	assert.equal(button.type, 'button', 'never a form submission');
	assert.ok(button.classList.contains('bui-composer-chip'));
	assert.ok(chip.element.classList.contains('bui-composer-chip-holder') && button.parentElement === chip.element);
	assert.deepEqual([...button.children].map(node => node.getAttribute('class')), ['bui-icon', 'bui-composer-chip-label', 'bui-composer-chip-value'], 'the glyph first, then the label and the value');
	assert.equal(button.querySelectorAll('svg').length, 1, 'no chevron: it opens no menu');
	assert.equal(button.querySelector('.bui-composer-chip-label').textContent, 'Line comments');
	assert.equal(button.querySelector('.bui-composer-chip-value').textContent, '2');
	assert.equal(button.hasAttribute('aria-label'), false, 'its face is its name: what a person reads is what they say');
	const described = document.getElementById(button.getAttribute('aria-describedby'));
	assert.ok(described && !button.contains(described) && described.classList.contains('bui-hidden'), 'its description beside it, hidden from sight, outside its name');
	assert.equal(described.textContent, 'They go with your next message. Opens them in the conversation\'s changes.');
	assert.equal(button.getAttribute('data-bui-tip'), 'Line comments: 2');
	button.click();
	assert.deepEqual(pressed, ['click']);
	chip.destroy();
	assert.equal(button.isConnected, false);
	assert.equal(described.isConnected, false, 'its description goes with it');
});

test('label, value and description are set in place, keeping the button and its focus', () => {
	const chip = comments().mount(document.body);
	const button = chip.control;
	assert.equal(button.hasAttribute('aria-describedby'), false, 'no description, nothing read after its name');
	button.focus();
	chip.value = 3;
	chip.label = 'Comments';
	chip.description = 'They go with your next message.';
	assert.ok(chip.control === button && document.activeElement === button, 'the same button keeps the focus');
	assert.equal(button.textContent, 'Comments3');
	assert.equal(button.getAttribute('data-bui-tip'), 'Comments: 3');
	assert.equal(document.getElementById(button.getAttribute('aria-describedby')).textContent, 'They go with your next message.');
	chip.description = null;
	assert.equal(button.hasAttribute('aria-describedby'), false);
	chip.label = null;
	assert.equal(button.querySelector('.bui-composer-chip-label').hidden, true, 'no label, no muted part');
	assert.equal(button.getAttribute('data-bui-tip'), '3');
	chip.value = 0;
	assert.equal(button.querySelector('.bui-composer-chip-value').textContent, '0', 'a count of none is said');
	chip.destroy();
});

test('its whole face is its tooltip only while its label is set aside; a face shown whole needs none', () => {
	const chip = comments().mount(document.body);
	const label = chip.control.querySelector('.bui-composer-chip-label');
	assert.ok(chip.control.hasAttribute('data-bui-hints'), 'its own tooltip root, so a toolbar\'s never shows it twice');
	set(label, 92);
	chip.control.focus();
	assert.equal(shown(), null, 'its face is whole');
	chip.control.blur();
	set(label, 1);
	chip.control.focus();
	assert.equal(shown(), 'Line comments: 2', 'set aside by a toolbar that shortens it');
	chip.destroy();
	assert.equal(shown(), null, 'gone with the chip');
});

test('a composer\'s tray holds it while it has something to say, and takes it away with null', () => {
	const chip = comments();
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), tray: [chip] }).mount(document.body);
	const tray = composer.element.querySelector('.bui-composer-tray');
	assert.ok(chip.element.parentElement === tray && chip.control.parentElement === chip.element);
	assert.equal(tray.hidden, false);
	composer.tray = null;
	assert.equal(tray.hidden, true);
	assert.equal(chip.control.isConnected, false);
	composer.destroy();
	chip.destroy();
});

test('the tray\'s choice chips, which show their value alone, say their whole face in the family tooltip, as the settings\' do, and a chip that acts keeps its own', () => {
	const repository = new ui.ChoiceChip({ label: 'Repository', options: [{ value: 'web', label: 'acme/web' }], value: 'web', statement: false });
	const chip = comments();
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), tray: [repository, chip] }).mount(document.body);
	page.key(document.body, 'Tab');
	repository.control.focus();
	assert.equal(shown(), 'Repository: acme/web', 'its label is in its name and its tooltip');
	repository.control.blur();
	set(chip.control.querySelector('.bui-composer-chip-label'), 92);
	chip.control.focus();
	assert.equal(shown(), null, 'the chip that acts shows its face whole, so no tooltip, and never a second one');
	const box = composer.element.querySelector('.bui-composer-box');
	assert.ok(box.hasAttribute('data-bui-hints') && chip.control.hasAttribute('data-bui-hints'), 'the box\'s tooltip and the chip\'s own');
	composer.destroy();
	assert.equal(box.hasAttribute('data-bui-hints'), false, 'the box is left as it was');
	repository.destroy();
	chip.destroy();
});

test('the stylesheet draws it in the chips\' geometry, sets its label aside in a shortened toolbar and never cuts its value', () => {
	const sheet = readFileSync(new URL('../src/styles/composing.css', import.meta.url), 'utf8');
	const rule = /\.bui-composer-chip \{([^}]*)\}/.exec(sheet)?.[1] ?? '';
	assert.match(rule, /min-height:\s*var\(--bui-target\)/, 'one target tall');
	assert.match(rule, /border:\s*1px solid var\(--color-border\)/, 'the quiet edge');
	assert.match(rule, /border-radius:\s*var\(--radius-round\)/);
	assert.match(sheet, /\.bui-composer\[data-fit\] \.bui-composer-settings \.bui-composer-chip-label \{[^}]*clip:\s*rect\(0 0 0 0\)/);
	assert.doesNotMatch(sheet, /\.bui-composer-chip[^{]*\{[^}]*text-overflow/, 'an action is named whole (D179)');
	assert.match(readFileSync(new URL('../src/styles/composing.css', import.meta.url), 'utf8'), /\.bui-composer-chip-label \{[^}]*color:\s*var\(--color-text-muted\)/);
});

test('React ComposerChip: the DOM chip, its onClick from the latest props, its words and description set in place and a new glyph a new chip', async () => {
	const host = document.body.appendChild(document.createElement('div'));
	root = createRoot(host);
	const pressed = [];
	const view = (props, tag) => h(StrictMode, null, h(adapter.ComposerChip, { label: 'Line comments', value: 2, onClick: () => pressed.push(tag), ...props }));
	await act(() => root.render(view({}, 'one')));
	const button = host.querySelector('.bui-composer-chip');
	assert.equal(host.querySelectorAll('.bui-composer-chip').length, 1, 'one chip under StrictMode');
	assert.equal(button.textContent, 'Line comments2');
	await act(() => root.render(view({ value: 3, description: 'Van con tu próximo mensaje.' }, 'two')));
	assert.ok(host.querySelector('.bui-composer-chip') === button, 'set in place');
	assert.equal(button.hasAttribute('aria-label'), false);
	assert.equal(document.getElementById(button.getAttribute('aria-describedby')).textContent, 'Van con tu próximo mensaje.');
	await act(async () => button.click());
	assert.deepEqual(pressed, ['two'], 'the latest onClick');
	await act(() => root.render(view({ glyph: 'chat' }, 'three')));
	assert.ok(host.querySelector('.bui-composer-chip') !== button, 'a new glyph makes a new chip');
	assert.equal(host.querySelectorAll('.bui-composer-chip svg').length, 1);
});
