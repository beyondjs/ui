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
	// Enter's keydown and Space's keyup reach a button as its click, the platform's activation, which happy-dom
	// does not make: the test makes that click after the key (the browser check presses the real keys)
	const activate = key => () => (assert.equal(page.key(button, key).defaultPrevented, false, `${key} is the platform's`), button.click());
	for (const press of [() => button.click(), activate('Enter'), activate(' '), () => page.key(button, 'ArrowDown'), () => page.key(button, 'ArrowUp')]) {
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

test('becoming waiting while open closes the list, a person in it put back on the quiet button, never on the body', () => {
	const { repository, branch } = scene({ waiting: false });
	branch.control.click();
	assert.equal(branch.expanded, true);
	assert.equal(document.activeElement.getAttribute('role'), 'menuitemradio');
	branch.waiting = true;
	assert.equal(branch.expanded, false, 'the list closes');
	assert.equal(branch.element.querySelector('.bui-choice-list').hidden, true);
	assert.ok(document.activeElement === branch.control, 'focus that was in the list goes back to the quiet button');
	assert.equal(branch.control.getAttribute('aria-expanded'), 'false');
	branch.waiting = false;
	branch.control.click();
	repository.control.focus();
	branch.waiting = true;
	assert.ok(document.activeElement === repository.control, 'focus outside the list is left where it is');
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

test('a ref chooser that waits draws its quiet menu with its placeholder, whatever its refs, loading or unavailable say, a press going to place', () => {
	const repository = new ui.ChoiceChip({ label: 'Repository', options: [{ value: 'web', label: 'acme/web' }], statement: false }).mount(document.body);
	for (const state of [{ refs: [] }, { refs: [], loading: true }, { refs: [], unavailable: { text: 'Couldn\'t read the branches.', retry: () => undefined } }, { refs: [{ name: 'main', default: true }] }]) {
		const refs = new ui.RefChooser({ ...state, layout: 'inline', waiting: true, place: () => repository.control }).mount(document.body);
		const said = refs.element.textContent;
		assert.ok(refs.control.isConnected, `${JSON.stringify(state)}: the quiet menu is drawn`);
		assert.equal(refs.control.getAttribute('aria-disabled'), 'true');
		assert.doesNotMatch(said, /No branches|Loading|Couldn.t read|Try again/, `${JSON.stringify(state)}: no state of the refs is said while it waits`);
		assert.equal(refs.element.querySelectorAll('.bui-refs-escape, .bui-skeleton').length, 0, 'nothing else drawn');
		assert.match(refs.control.textContent, /Choose a branch|Branch/, 'its placeholder');
		refs.control.click();
		assert.ok(document.activeElement === repository.control, 'a press goes to the repository');
		refs.other();
		assert.equal(refs.element.querySelector('.bui-refs-other').hidden, true, 'other() opens nothing while it waits');
		refs.destroy();
	}
	repository.destroy();
});

test('a ref chooser\'s wait ends into its refs\' state; waiting again closes an open escape field, the person put back on the quiet button', () => {
	const repository = new ui.ChoiceChip({ label: 'Repository', options: [{ value: 'web', label: 'acme/web' }], statement: false }).mount(document.body);
	const refs = new ui.RefChooser({ refs: [], unavailable: { text: 'Couldn\'t read the branches.' }, layout: 'inline', waiting: true, place: () => repository.control }).mount(document.body);
	refs.control.focus();
	refs.waiting = false;
	assert.match(refs.element.textContent, /Couldn't read the branches/, 'the wait over, the refs\' state is said');
	const escape = refs.element.querySelector('.bui-refs-escape');
	assert.ok(document.activeElement === escape, 'the quiet button\'s focus goes to the first control there, never the body');
	escape.click();
	const field = refs.element.querySelector('.bui-refs-other');
	assert.equal(field.hidden, false, 'the escape opens its field');
	field.querySelector('input').focus();
	refs.waiting = true;
	assert.equal(field.hidden, true, 'waiting again closes it');
	assert.ok(document.activeElement === refs.control, 'and puts the person back on the quiet button');
	refs.destroy();
	repository.destroy();
});

test('the other ways to send wait with a held Send: quiet, the reason said once beside Send, a press closing the menu and going to place', () => {
	const machine = new ui.ChoiceChip({ label: 'Machine', options: [{ value: 'lab', label: 'lab' }], statement: false }).mount(document.body);
	const { box, sent } = composer({ value: 'Deploy it', actions: [{ id: 'start', label: 'Start and send', primary: true }, { id: 'wait', label: 'Send without starting' }], disabled: { reason: 'Choose a machine first.', place: () => machine.control } });
	const split = box.element.querySelector('.bui-composer-send .bui-menu-button');
	split.click();
	const item = box.element.querySelector('.bui-composer-send [role="menuitem"]');
	assert.equal(item.getAttribute('aria-disabled'), 'true', 'quiet, as Send is');
	assert.equal(box.element.querySelectorAll('.bui-composer-send .bui-menu-reason').length, 0, 'the reason is said once, beside Send (D101)');
	assert.equal(box.element.querySelector('.bui-composer-reason').textContent, 'Choose a machine first.');
	item.click();
	assert.equal(box.element.querySelector('.bui-composer-send .bui-menu').hidden, true, 'the press closes the menu');
	assert.ok(document.activeElement === machine.control, 'and goes where sending waits');
	assert.equal(sent.length, 0);
	box.disabled = { reason: 'Only an owner or admin can start web.' };
	split.click();
	const held = box.element.querySelector('.bui-composer-send [role="menuitem"]');
	assert.equal(held.getAttribute('aria-disabled'), 'true');
	assert.equal(box.element.querySelectorAll('.bui-composer-send .bui-menu-reason').length, 0, 'no reason under it either');
	held.click();
	assert.equal(sent.length, 0, 'without a place a press does nothing');
	box.disabled = null;
	split.click();
	box.element.querySelector('.bui-composer-send [role="menuitem"]').click();
	assert.deepEqual(sent.map(message => message.action), ['wait'], 'once nothing holds it, it sends');
	box.destroy();
	machine.destroy();
});

test('an ActionMenu item that waits looks quiet and still answers a press, which closes the menu and runs it; a disabled one does nothing', () => {
	const ran = [];
	const menu = new ui.ActionMenu({ label: 'More', items: [{ label: 'Send without starting', waiting: true, run: () => ran.push('waiting') }, { label: 'Archive', disabled: true, run: () => ran.push('disabled') }] }).mount(document.body);
	menu.element.querySelector('button').click();
	const [waiting, disabled] = menu.element.querySelectorAll('[role="menuitem"]');
	assert.equal(waiting.getAttribute('aria-disabled'), 'true');
	assert.equal(waiting.tagName, 'BUTTON', 'never a link');
	disabled.click();
	assert.deepEqual(ran, []);
	assert.equal(menu.expanded, true, 'a disabled item keeps the menu');
	waiting.click();
	assert.deepEqual(ran, ['waiting']);
	assert.equal(menu.expanded, false, 'the press closed it');
	menu.destroy();
});
