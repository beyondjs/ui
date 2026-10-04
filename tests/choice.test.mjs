import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const environments = () => [
	{ value: 'web', label: 'web', detail: 'acme/web', status: ['Running', 'success'] },
	{ value: 'lab', label: 'lab', detail: 'No repository yet', status: ['Failed', 'danger'] },
	{ value: 'old', label: 'old', status: ['Deleted', 'neutral'], disabled: true, reason: 'Deleted environments take no work' }
];

test('ChoiceMenu names the choice and its state on the button; nothing chosen reads as the placeholder', () => {
	const menu = new ui.ChoiceMenu({ label: 'Environment', placeholder: 'Choose', options: environments() }).mount(document.body);
	assert.equal(menu.control.textContent, 'EnvironmentChoose');
	assert.equal(menu.chosen, null);
	menu.value = 'lab';
	assert.equal(menu.control.dataset.tone, 'danger');
	assert.match(menu.control.textContent, /^Environment.*lab.*Failed/);
	assert.ok(menu.control.querySelector('.bui-choice-state'), 'a state that asks for attention is shown');
	menu.value = 'web';
	assert.match(menu.control.textContent, /Running/, 'a calm state stays in the accessible name');
	assert.ok(menu.control.querySelector('.bui-hidden'), 'and is visually hidden');
});

test('ChoiceMenu opens on the chosen option as a menu of radio items, then actions after a separator', () => {
	let created = 0;
	const menu = new ui.ChoiceMenu({ label: 'Environment', value: 'lab', options: environments(), actions: [{ label: 'New environment…', run: () => created++ }] }).mount(document.body);
	menu.control.click();
	assert.equal(menu.expanded, true);
	const radios = [...menu.element.querySelectorAll('[role="menuitemradio"]')];
	assert.deepEqual(radios.map(node => node.getAttribute('aria-checked')), ['false', 'true', 'false']);
	assert.equal(document.activeElement, radios[1], 'focus lands on the chosen option');
	assert.ok(menu.element.querySelector('[role="separator"]'));
	const action = menu.element.querySelector('[role="menuitem"]');
	page.key(radios[1], 'End');
	assert.equal(document.activeElement, action);
	action.click();
	assert.equal(created, 1);
	assert.equal(menu.expanded, false);
	assert.equal(document.activeElement, menu.control, 'focus returns to the button');
	assert.equal(menu.value, 'lab', 'an action chooses nothing');
});

test('ChoiceMenu: choosing calls onchange once; a disabled option explains and is never chosen; Escape closes', () => {
	const chosen = [];
	const menu = new ui.ChoiceMenu({ label: 'Environment', options: environments(), onchange: value => chosen.push(value) }).mount(document.body);
	page.key(menu.control, 'ArrowDown');
	const radios = [...menu.element.querySelectorAll('[role="menuitemradio"]')];
	assert.equal(radios[2].getAttribute('aria-disabled'), 'true');
	assert.match(radios[2].textContent, /Deleted environments take no work/);
	radios[2].click();
	assert.deepEqual(chosen, []);
	radios[0].click();
	assert.deepEqual(chosen, ['web']);
	assert.equal(menu.value, 'web');
	menu.open();
	menu.element.querySelector('[aria-checked="true"]').click();
	assert.deepEqual(chosen, ['web'], 'the same choice again changes nothing');
	menu.open();
	page.key(document.activeElement, 'Escape');
	assert.equal(menu.expanded, false);
	assert.equal(document.activeElement, menu.control);
});

test('ChoiceMenu: a press outside closes it, a disabled button never opens, and destroy releases its listener', () => {
	const menu = new ui.ChoiceMenu({ label: 'AI engine', options: [{ value: 'claude', label: 'Claude Code' }, { value: 'codex', label: 'Codex' }] }).mount(document.body);
	menu.open();
	assert.equal(menu.listeners.size, 1);
	document.body.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true }));
	assert.equal(menu.expanded, false);
	menu.disabled = true;
	menu.open();
	assert.equal(menu.expanded, false);
	menu.destroy();
	assert.equal(menu.listeners.size, 0);
});

test('ChoiceMenu: replacing the options keeps the value only while an option has it', () => {
	const menu = new ui.ChoiceMenu({ label: 'Repository', value: 'rep_web', options: [{ value: 'rep_web', label: 'acme/web' }] }).mount(document.body);
	menu.options = [{ value: 'rep_api', label: 'acme/api' }, { value: 'rep_docs', label: 'acme/docs' }];
	assert.equal(menu.chosen, null);
	assert.match(menu.control.textContent, /Choose/);
});

test('ChoiceMenu: a live change while it is open keeps focus on the same option, and the keys keep working', () => {
	const menu = new ui.ChoiceMenu({ label: 'Environment', value: 'lab', options: environments() }).mount(document.body);
	menu.control.click();
	assert.equal(document.activeElement.textContent.startsWith('lab'), true);
	menu.options = [{ value: 'web', label: 'web', status: ['Stopped', 'neutral'] }, ...environments().slice(1)];
	assert.equal(menu.expanded, true);
	assert.ok(document.activeElement.textContent.startsWith('lab'), 'focus left the open menu');
	page.key(document.activeElement, 'Escape');
	assert.equal(document.activeElement, menu.control);
});
