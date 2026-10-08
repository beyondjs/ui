import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** ChoiceChip (0.11.0): a compact choice on ChoiceMenu with its value and a state in words, its own state, the menu's keyboard and statements. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const models = () => [
	{ value: 'opus', label: 'Opus 5.5', detail: 'The most capable', status: ['Default', 'neutral'] },
	{ value: 'sonnet', label: 'Sonnet 5', detail: 'Faster' },
	{ value: 'haiku', label: 'Haiku 5', detail: 'Not in this plan', disabled: true, reason: 'Your plan does not include it' }
];

test('a chip shows a muted label, its value and the state in words with its dot beside it, never a dot alone', () => {
	const chip = new ui.ChoiceChip({ label: 'Model', options: models(), value: 'opus' }).mount(document.body);
	assert.ok(chip instanceof ui.ChoiceMenu, 'built on ChoiceMenu');
	assert.ok(chip.element.classList.contains('bui-chip'));
	const button = chip.control;
	assert.equal(button.querySelector('.bui-choice-label').textContent, 'Model');
	assert.equal(button.querySelector('.bui-choice-value').textContent, 'Opus 5.5');
	const state = button.querySelector('.bui-chip-state');
	assert.equal(state.textContent, 'Default', 'a calm state is shown too, in words');
	assert.ok(state.querySelector('.bui-status-dot'), 'the dot sits beside its word');
	assert.equal(button.querySelectorAll('.bui-status-dot').length, 1);
	assert.equal(button.getAttribute('aria-haspopup'), 'menu');
	assert.match(button.textContent, /^ModelOpus 5\.5Default$/, 'the accessible name says the label, the value and the state');
	chip.value = 'sonnet';
	assert.equal(button.querySelector('.bui-chip-state'), null, 'no state, no mark');
	assert.equal(button.querySelector('.bui-status-dot'), null);
	chip.destroy();
});

test("the chip's own state stands over the chosen option's, and changing it calls nothing", () => {
	const chosen = [];
	const chip = new ui.ChoiceChip({ label: 'AI engine', options: [{ value: 'claude', label: 'Claude Code', status: ['Ready', 'success'] }, { value: 'codex', label: 'Codex' }], value: 'claude', state: ['Needs a sign-in', 'warning'], onchange: value => chosen.push(value) }).mount(document.body);
	assert.equal(chip.control.querySelector('.bui-chip-state').textContent, 'Needs a sign-in');
	assert.equal(chip.control.dataset.tone, 'warning');
	assert.deepEqual(chip.state, ['Needs a sign-in', 'warning']);
	chip.state = null;
	assert.equal(chip.control.querySelector('.bui-chip-state').textContent, 'Ready', "back to the option's");
	assert.deepEqual(chosen, []);
	chip.destroy();
});

test('the menu by keyboard: options with their description, state and a disabled one with its reason; Enter chooses, Escape returns focus', () => {
	const chosen = [];
	const chip = new ui.ChoiceChip({ label: 'Model', options: models(), value: 'opus', onchange: value => chosen.push(value) }).mount(document.body);
	page.key(chip.control, 'ArrowDown');
	assert.equal(chip.expanded, true);
	const items = [...chip.element.querySelectorAll('[role="menuitemradio"]')];
	assert.ok(document.activeElement === items[0], 'focus on the chosen option');
	assert.match(items[0].textContent, /Opus 5\.5.*Default.*The most capable/);
	assert.equal(items[2].getAttribute('aria-disabled'), 'true');
	assert.match(items[2].textContent, /Your plan does not include it/);
	page.key(items[0], 'ArrowDown');
	assert.ok(document.activeElement === items[1]);
	page.key(items[1], 'ArrowDown');
	document.activeElement.click();
	assert.deepEqual(chosen, [], 'a disabled option is never chosen');
	page.key(items[2], 'ArrowUp');
	document.activeElement.click();
	assert.deepEqual(chosen, ['sonnet']);
	assert.ok(document.activeElement === chip.control, 'focus back on the chip');
	chip.open();
	page.key(document.activeElement, 'Escape');
	assert.equal(chip.expanded, false);
	assert.ok(document.activeElement === chip.control);
	chip.destroy();
});

test('one option is stated, with its state; Spanish copy is ChoiceMenu\'s', () => {
	const chip = new ui.ChoiceChip({ label: 'Autonomy', options: [{ value: 'ask', label: 'Ask me', status: ['Default', 'neutral'] }], name: 'autonomy' }).mount(document.body);
	assert.equal(chip.stated, true);
	assert.equal(chip.value, 'ask');
	assert.match(chip.element.textContent, /Autonomy.*Ask me.*Default/);
	assert.equal(chip.element.querySelector('input[type="hidden"]').value, 'ask');
	chip.destroy();
	assert.equal(ui.ChoiceChip.labels, ui.ChoiceMenu.labels);
});
