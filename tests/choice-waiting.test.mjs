import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Page } from './support/page.mjs';

/**
 * A chooser that waits and a held Send's place (0.34.0, D183): a `ChoiceMenu` or `ChoiceChip` that waits
 * for an earlier choice is quiet and still reachable, a press (a click, Enter or Space, ArrowDown or
 * ArrowUp) only puts the person at `place()` and opens nothing; and a composer whose sending is held
 * (`disabled`) puts a press on Send at its cause's `place()`, sending and saying nothing more.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const repositories = () => [{ value: 'web', label: 'acme/web' }, { value: 'api', label: 'acme/api' }];
const branches = () => [{ value: 'main', label: 'main', status: ['Default', 'neutral'] }, { value: 'fix', label: 'fix/redirect' }];
/** An earlier chip, the repository, and a branch chip that waits for it. */
function scene(options = {}) {
	const repository = new ui.ChoiceChip({ label: 'Repository', options: repositories() }).mount(document.body);
	const branch = new ui.ChoiceChip({ label: 'Branch', options: branches(), waiting: true, place: () => repository.control, ...options }).mount(document.body);
	return { repository, branch };
}

test('a chip that waits is quiet and reachable, and a click, Enter, Space or an arrow only puts the person at its place, opening nothing', () => {
	const { repository, branch } = scene();
	const button = branch.control;
	assert.equal(branch.waiting, true);
	assert.equal(button.getAttribute('aria-disabled'), 'true', 'quiet');
	assert.equal(button.disabled, false, 'still reachable by Tab, never natively disabled');
	const before = document.body.textContent;
	for (const press of [() => button.click(), () => page.key(button, 'ArrowDown'), () => page.key(button, 'ArrowUp')]) {
		button.focus();
		press();
		assert.equal(branch.expanded, false, 'its list does not open');
		assert.ok(document.activeElement === repository.control, 'the press puts the person at the earlier choice');
	}
	assert.equal(page.key(button, 'ArrowDown').defaultPrevented, true, 'an arrow never scrolls the page meanwhile');
	assert.equal(document.body.textContent, before, 'and says nothing');
	assert.equal(branch.open(), false, 'open() refuses while it waits');
	assert.equal(page.key(button, 'Home').defaultPrevented, false, 'other keys are left alone');
	repository.destroy();
	branch.destroy();
});

test('without place a press while it waits does nothing; leaving the wait opens it as before', () => {
	const chosen = [];
	const menu = new ui.ChoiceMenu({ label: 'Branch', options: branches(), waiting: true, onchange: value => chosen.push(value) }).mount(document.body);
	menu.control.focus();
	menu.control.click();
	page.key(menu.control, 'ArrowDown');
	assert.equal(menu.expanded, false);
	assert.ok(document.activeElement === menu.control, 'focus stays where it was');
	menu.waiting = false;
	assert.equal(menu.control.hasAttribute('aria-disabled'), false, 'able again');
	menu.control.click();
	assert.equal(menu.expanded, true, 'a press opens it');
	page.key(document.activeElement, 'Escape');
	assert.equal(menu.expanded, false);
	page.key(menu.control, 'ArrowUp');
	assert.equal(menu.expanded, true, 'and so does an arrow');
	document.activeElement.click();
	assert.equal(menu.expanded, false);
	menu.destroy();
});

test('becoming waiting while open closes the list without moving focus back to the button', () => {
	const { repository, branch } = scene({ waiting: false });
	branch.control.click();
	assert.equal(branch.expanded, true);
	const option = document.activeElement;
	assert.equal(option.getAttribute('role'), 'menuitemradio');
	branch.waiting = true;
	assert.equal(branch.expanded, false, 'the list closes');
	assert.equal(branch.element.querySelector('.bui-choice-list').hidden, true);
	assert.ok(document.activeElement !== branch.control, 'no refocus');
	assert.equal(branch.control.getAttribute('aria-expanded'), 'false');
	branch.waiting = true;
	assert.equal(branch.expanded, false, 'waiting again changes nothing');
	repository.destroy();
	branch.destroy();
});

test('native disabled stays for a choice that can never be made, and one stated option is unaffected', () => {
	const menu = new ui.ChoiceMenu({ label: 'Branch', options: branches(), disabled: true, waiting: true, place: () => document.body }).mount(document.body);
	assert.equal(menu.control.disabled, true);
	assert.equal(menu.open(), false);
	menu.disabled = false;
	assert.equal(menu.open(), false, 'still waiting');
	menu.waiting = false;
	assert.equal(menu.open(), true);
	menu.destroy();
	const one = new ui.ChoiceMenu({ label: 'Branch', options: [branches()[0]], waiting: true }).mount(document.body);
	assert.equal(one.stated, true, 'one option is a statement, waiting or not');
	assert.equal(one.value, 'main');
	assert.equal(one.element.querySelector('.bui-choice-button'), null, 'nothing to press');
	one.destroy();
});

test("a waiting chip keeps its face: its own state and value redraw without opening or leaving the wait", () => {
	const { repository, branch } = scene();
	branch.state = ['Needs a repository', 'neutral'];
	branch.value = 'fix';
	assert.equal(branch.control.getAttribute('aria-disabled'), 'true');
	assert.match(branch.control.textContent, /fix\/redirect/);
	branch.options = branches();
	assert.equal(branch.waiting, true, 'new options keep the wait');
	repository.destroy();
	branch.destroy();
});

test('the stylesheet draws a waiting choice quiet, with no hover lift in a composer', () => {
	const choice = readFileSync(new URL('../src/styles/choice.css', import.meta.url), 'utf8');
	assert.match(choice, /\.bui-choice-button:disabled,\s*\.bui-choice-button\[aria-disabled='true'\]\s*\{[^}]*color:\s*var\(--color-text-muted\)/);
	assert.match(choice, /\.bui-choice-button:not\(:disabled, \[aria-disabled='true'\]\):hover/);
	const composing = readFileSync(new URL('../src/styles/composing.css', import.meta.url), 'utf8');
	assert.match(composing, /\.bui-composer \.bui-chip \.bui-choice-button:not\(:disabled, \[aria-disabled='true'\]\):hover/);
});

/** A composer whose sends are recorded and never answered. */
function composer(options = {}) {
	const sent = [];
	const box = new ui.Composer({ label: 'Message to Claude Code', onsubmit: message => (sent.push(message), new Promise(() => {})), ...options }).mount(document.body);
	return { box, sent, send: box.element.querySelector('.bui-composer-go') };
}

test('a held Send with place: a press puts the person there, sends nothing and says nothing more than its reason; Enter keeps focus in the field', () => {
	const machine = new ui.ChoiceChip({ label: 'Machine', options: [{ value: 'lab', label: 'lab' }], statement: false }).mount(document.body);
	const { box, sent, send } = composer({ value: 'Deploy it', disabled: { reason: 'Choose a machine first.', place: () => machine.control } });
	const reason = box.element.querySelector('.bui-composer-reason');
	assert.equal(send.getAttribute('aria-disabled'), 'true');
	assert.equal(send.disabled, false, 'reachable');
	assert.equal(reason.textContent, 'Choose a machine first.');
	const said = box.element.textContent;
	send.click();
	assert.ok(document.activeElement === machine.control, 'the press goes to what sending waits for');
	assert.equal(sent.length, 0, 'nothing is sent');
	assert.equal(box.element.textContent, said, 'nothing more is said');
	assert.equal(box.element.querySelector('.bui-composer-problem').hidden, true);
	box.focus();
	assert.equal(page.key(box.field, 'Enter').defaultPrevented, true);
	assert.equal(sent.length, 0, 'Enter never sends while held');
	assert.ok(document.activeElement === box.field, 'and focus stays in the field');
	box.disabled = null;
	send.click();
	assert.deepEqual(sent.map(message => message.text), ['Deploy it'], 'sent once nothing holds it');
	box.destroy();
	machine.destroy();
});

test('a held Send without place is as before: a press does nothing and sends nothing', async () => {
	const { box, sent, send } = composer({ value: 'Deploy it', disabled: { reason: 'Only an owner or admin can start web.' } });
	const outside = document.body.appendChild(document.createElement('button'));
	outside.focus();
	send.click();
	assert.equal(await box.submit(), false);
	assert.equal(sent.length, 0);
	assert.ok(document.activeElement === outside, 'focus is not moved');
	assert.deepEqual(Object.keys(box.disabled), ['reason'], 'the cause as given');
	box.destroy();
});
