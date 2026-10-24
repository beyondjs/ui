import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * The family's one way to wait for what is still to give (0.32.0, D183), shared so that no product keeps
 * its own copy: `Required` over a form (its required controls and the parts a product marks
 * `data-missing`, the submit buttons outside it that name it with `form`, a busy button kept as its work
 * draws it) and `Quiet` for one control that waits for a choice made elsewhere. `FocusedForm` is built
 * on `Required`.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const type = (control, value) => {
	control.value = value;
	control.dispatchEvent(new Event('input', { bubbles: true }));
};
const submit = form => {
	const event = new Event('submit', { bubbles: true, cancelable: true });
	form.dispatchEvent(event);
	return event;
};

test('a required control with nothing in it waits; one the browser does not validate and text it could not read never do', () => {
	const input = Object.assign(document.createElement('input'), { required: true });
	assert.equal(ui.Required.empty(input), true);
	input.value = '  ';
	assert.equal(ui.Required.empty(input), true, 'blanks are nothing');
	input.value = 'Alpha';
	assert.equal(ui.Required.empty(input), false);
	input.value = '';
	input.disabled = true;
	assert.equal(ui.Required.empty(input), false, 'a control the browser does not validate never waits');
	assert.equal(ui.Required.empty({ required: true, willValidate: true, validity: { badInput: true }, value: '' }), false, 'letters in a number are written: wrong, not missing');
	assert.equal(ui.Required.empty(Object.assign(document.createElement('input'), { value: '' })), false, 'an optional control never waits');
});

test('over a form: the submit buttons wait quiet, a dialog footer\'s that name the form included, and a press puts the caret in the first part that waits', () => {
	const form = Object.assign(document.createElement('form'), { id: 'invite' });
	const people = Object.assign(document.createElement('fieldset'), { innerHTML: '<legend>People</legend><button type="button">Choose people</button>' });
	people.setAttribute('data-missing', '');
	const note = Object.assign(document.createElement('input'), { name: 'note', required: true });
	const inside = document.createElement('button');
	form.append(people, note, inside);
	const footer = Object.assign(document.createElement('button'), { type: 'submit', textContent: 'Invite' });
	footer.setAttribute('form', 'invite');
	const other = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Cancel' });
	document.body.append(form, footer, other);
	const required = new ui.Required(form);
	assert.equal(required.missing, true);
	assert.deepEqual(required.buttons, [inside, footer], 'its own submit buttons and the footer\'s that names it');
	assert.equal(inside.getAttribute('aria-disabled'), 'true');
	assert.equal(footer.getAttribute('aria-disabled'), 'true');
	assert.equal(other.hasAttribute('aria-disabled'), false, 'a button that does not submit is not its to quiet');
	const held = submit(form);
	assert.equal(held.defaultPrevented, false, 'a submission is the product\'s until it asks hold()');
	assert.equal(required.hold(submit(form)), true);
	assert.ok(document.activeElement === people.querySelector('button'), 'a marked part takes the caret on its first control, in the page\'s order');
	people.removeAttribute('data-missing');
	required.settle();
	assert.equal(required.first, note, 'then the empty required control');
	type(note, 'Welcome');
	assert.equal(required.missing, false);
	assert.equal(footer.hasAttribute('aria-disabled'), false, 'heard on input');
	assert.equal(required.hold(submit(form)), false, 'nothing waits: the submission goes on');
	footer.setAttribute('data-busy', '');
	footer.setAttribute('aria-disabled', 'true');
	type(note, '');
	type(note, 'Back');
	assert.equal(footer.getAttribute('aria-disabled'), 'true', 'a busy button keeps what its work draws');
	required.destroy();
	type(note, '');
	assert.equal(inside.hasAttribute('aria-disabled'), false, 'destroy() leaves the buttons as they were and hears no more');
});

test('a marked choice takes the caret on what is chosen, and a radio group with nothing chosen waits', () => {
	const form = document.createElement('form');
	form.innerHTML = '<div data-missing><label><input type="radio" name="size" value="s">Small</label><label><input type="radio" name="size" value="m" checked>Medium</label></div><button>Create</button>';
	document.body.append(form);
	const required = new ui.Required(form);
	required.focus();
	assert.ok(document.activeElement === form.querySelector('input:checked'));
	const group = document.createElement('form');
	group.innerHTML = '<input type="radio" name="tone" value="calm" required><input type="radio" name="tone" value="bold" required><button>Save</button>';
	document.body.append(group);
	const tone = new ui.Required(group);
	assert.equal(tone.missing, true);
	group.querySelector('input[value="bold"]').checked = true;
	group.querySelector('input[value="bold"]').dispatchEvent(new Event('change', { bubbles: true }));
	assert.equal(tone.missing, false);
	assert.equal(group.querySelector('button').hasAttribute('aria-disabled'), false);
});

test('given fields, a form waits for theirs; FocusedForm waits for a marked part and quiets a footer that names it', async () => {
	const form = Object.assign(document.createElement('form'), { id: 'adding' });
	const picker = document.createElement('div');
	picker.setAttribute('data-missing', '');
	picker.append(Object.assign(document.createElement('input'), { type: 'search', 'aria-label': 'Search repositories' }));
	form.append(picker);
	const add = Object.assign(document.createElement('button'), { type: 'submit', textContent: 'Add' });
	add.setAttribute('form', 'adding');
	document.body.append(form, add);
	const sent = [];
	const behavior = new ui.FocusedForm(form, { submit: values => (sent.push(values), Promise.resolve()) });
	assert.equal(add.getAttribute('aria-disabled'), 'true', 'a footer that names the form waits with it');
	form.requestSubmit();
	assert.equal(sent.length, 0);
	assert.ok(document.activeElement === picker.querySelector('input'), 'a press goes to where the choice is made');
	picker.removeAttribute('data-missing');
	behavior.settle();
	assert.equal(add.hasAttribute('aria-disabled'), false);
	form.requestSubmit();
	await page.until(() => !behavior.busy);
	assert.equal(sent.length, 1);
	behavior.destroy();
	const name = new ui.Field({ label: 'Name', name: 'name', required: true });
	const other = document.createElement('form');
	other.append(name.element, document.createElement('button'));
	document.body.append(other);
	const fielded = new ui.Required(other, { fields: [name] });
	assert.equal(fielded.first, name);
	assert.equal(fielded.focus(), true);
	assert.ok(document.activeElement === name.control);
});

test('Quiet: a control waits for a choice made elsewhere; a press while it waits only puts the person where they choose', () => {
	let chosen = 0;
	let added = 0;
	const search = Object.assign(document.createElement('input'), { type: 'search' });
	const button = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Add' });
	button.addEventListener('click', () => (added += 1));
	document.body.append(search, button);
	const quiet = new ui.Quiet(button, { waiting: () => chosen === 0, place: () => search });
	assert.equal(quiet.waiting, true);
	assert.equal(button.getAttribute('aria-disabled'), 'true');
	assert.equal(button.disabled, false, 'still reachable');
	button.click();
	assert.equal(added, 0, 'the product\'s own handler never runs while it waits');
	assert.ok(document.activeElement === search, 'the press puts the person where they choose');
	chosen = 2;
	quiet.settle();
	assert.equal(button.hasAttribute('aria-disabled'), false);
	button.click();
	assert.equal(added, 1);
	quiet.destroy();
	chosen = 0;
	button.click();
	assert.equal(added, 2, 'destroy() releases the press');
	const form = document.createElement('form');
	const note = Object.assign(document.createElement('input'), { name: 'note' });
	const send = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Send' });
	form.append(note);
	document.body.append(form, send);
	let pressed = 0;
	send.addEventListener('click', () => (pressed += 1));
	new ui.Quiet(send, { waiting: () => !note.value.trim(), form });
	assert.equal(send.getAttribute('aria-disabled'), 'true');
	send.click();
	assert.equal(pressed, 1, 'without `place` the press stays the product\'s');
	type(note, 'Hello');
	assert.equal(send.hasAttribute('aria-disabled'), false, 'heard on the form\'s input');
	assert.throws(() => new ui.Quiet(send, {}), TypeError);
});
