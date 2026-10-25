import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * 0.32.1: what the review of 0.32.0's waits found (D183). A form with fields waits for its marked parts
 * too; it quiets and frees only what it quieted itself, so a product's own quiet state stands; a required
 * control that names the form from outside waits; a value written without a typed one, text the browser
 * could not read, a link that waits, a disabled first control and a Picker's caret are each answered.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const type = (control, value) => {
	control.value = value;
	control.dispatchEvent(new Event('input', { bubbles: true }));
};

test('a FocusedForm with fields waits for a part marked data-missing too, and holds its submission', async () => {
	const form = document.createElement('form');
	const title = new ui.Field({ label: 'Title', name: 'title', required: true, value: 'Release' });
	const picker = document.createElement('div');
	picker.setAttribute('data-missing', '');
	picker.append(Object.assign(document.createElement('input'), { type: 'search', 'aria-label': 'Search' }));
	const save = document.createElement('button');
	form.append(title.element, picker, save);
	document.body.append(form);
	const sent = [];
	const behavior = new ui.FocusedForm(form, { fields: [title], submit: values => (sent.push(values), Promise.resolve()) });
	assert.equal(behavior.missing, true);
	assert.equal(save.getAttribute('aria-disabled'), 'true');
	form.requestSubmit();
	assert.equal(sent.length, 0, 'nothing is sent while the part waits');
	assert.ok(document.activeElement === picker.querySelector('input'));
	picker.removeAttribute('data-missing');
	behavior.settle();
	form.requestSubmit();
	await page.until(() => !behavior.busy);
	assert.equal(sent.length, 1);
	behavior.destroy();
});

test('a product keeps its own quiet state: the form frees only the buttons it quieted, after a send too', async () => {
	const form = document.createElement('form');
	const domain = Object.assign(document.createElement('input'), { name: 'domain' });
	const save = document.createElement('button');
	form.append(domain, save);
	document.body.append(form);
	// The product draws Save quiet while its own optional field is empty, as Conduict's domain form does
	const draw = () => (domain.value.trim() ? save.removeAttribute('aria-disabled') : save.setAttribute('aria-disabled', 'true'));
	domain.addEventListener('input', draw);
	draw();
	const behavior = new ui.FocusedForm(form, { submit: () => Promise.resolve() });
	type(domain, 'acme.dev');
	type(domain, '');
	assert.equal(save.getAttribute('aria-disabled'), 'true', 'the form does not free what the product quieted');
	type(domain, 'acme.dev');
	form.requestSubmit();
	await page.until(() => !behavior.busy);
	type(domain, '');
	assert.equal(save.getAttribute('aria-disabled'), 'true', 'nor after a send');
	behavior.destroy();
	assert.equal(save.getAttribute('aria-disabled'), 'true', 'and destroy() leaves it as the product drew it');
});

test('a required control that names the form from outside waits with it, and one inside that names another does not', () => {
	const form = Object.assign(document.createElement('form'), { id: 'invite' });
	const other = Object.assign(document.createElement('form'), { id: 'other' });
	const elsewhere = Object.assign(document.createElement('input'), { required: true, 'aria-label': 'Elsewhere' });
	elsewhere.setAttribute('form', 'other');
	const save = document.createElement('button');
	form.append(elsewhere, save);
	const agree = Object.assign(document.createElement('input'), { type: 'checkbox', required: true, 'aria-label': 'I agree' });
	agree.setAttribute('form', 'invite');
	document.body.append(form, other, agree);
	const required = new ui.Required(form);
	assert.ok(required.first === agree, 'the box in the footer, not the control of the other form');
	agree.checked = true;
	agree.dispatchEvent(new Event('change', { bubbles: true }));
	required.settle();
	assert.equal(required.missing, false);
	required.destroy();
});

test('a value written without a typed one is told to the form: a late suggestion makes Create able', () => {
	const form = document.createElement('form');
	const name = new ui.Field({ label: 'Name', name: 'name', required: true, suggest: '' });
	const create = document.createElement('button');
	form.append(name.element, create);
	document.body.append(form);
	const behavior = new ui.FocusedForm(form, { fields: [name], submit: () => Promise.resolve() });
	assert.equal(create.getAttribute('aria-disabled'), 'true');
	name.suggest = 'storefront';
	assert.equal(name.control.value, 'storefront');
	assert.equal(create.hasAttribute('aria-disabled'), false, 'the suggestion is something written');
	behavior.destroy();
});

test('text the browser could not read stops a submission with its own message, before or after what waits', () => {
	const form = document.createElement('form');
	const price = Object.assign(document.createElement('input'), { type: 'number', name: 'price', 'aria-label': 'Price' });
	Object.defineProperty(price, 'validity', { value: { badInput: true, valid: false, valueMissing: false } });
	let reported = 0;
	price.reportValidity = () => ((reported += 1), false);
	const note = Object.assign(document.createElement('input'), { name: 'note', required: true, 'aria-label': 'Note' });
	form.append(price, note, document.createElement('button'));
	document.body.append(form);
	const required = new ui.Required(form);
	assert.ok(required.unread === price);
	assert.equal(ui.Required.empty(price), false, 'unread text is not missing');
	const event = new Event('submit', { cancelable: true });
	assert.equal(required.hold(event), true);
	assert.equal(event.defaultPrevented, true, 'the product never reads it as empty');
	assert.equal(reported, 1, 'the browser says what it could not read');
	required.destroy();
});

test('a link that waits does not navigate and only goes to place(); a busy one holds its press too', () => {
	let followed = 0;
	const search = Object.assign(document.createElement('input'), { type: 'search' });
	document.body.append(search);
	const open = new ui.Button({ label: 'Open the release', href: '#release', waiting: true, place: () => search, onclick: () => (followed += 1) }).mount(document.body);
	const event = new MouseEvent('click', { bubbles: true, cancelable: true });
	open.element.dispatchEvent(event);
	assert.equal(event.defaultPrevented, true, 'it does not navigate');
	assert.equal(followed, 0);
	assert.ok(document.activeElement === search);
	assert.equal(open.element.getAttribute('aria-disabled'), 'true');
	open.waiting = false;
	open.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
	assert.equal(followed, 1);
	open.destroy();
});

test('a marked part takes the caret on its control that says so, never on a disabled one', () => {
	const form = document.createElement('form');
	const part = document.createElement('div');
	part.setAttribute('data-missing', '');
	const remove = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Remove REQ-1' });
	const off = Object.assign(document.createElement('input'), { disabled: true, 'aria-label': 'Off' });
	const search = Object.assign(document.createElement('input'), { type: 'search', 'aria-label': 'Search requests' });
	search.setAttribute('data-bui-caret', '');
	part.append(remove, off, search);
	form.append(part, document.createElement('button'));
	document.body.append(form);
	new ui.Required(form).focus();
	assert.ok(document.activeElement === search, 'a chosen item\'s Remove never takes the caret');
	search.removeAttribute('data-bui-caret');
	remove.disabled = true;
	new ui.Required(form).focus();
	assert.ok(document.activeElement === search, 'a disabled control is passed over');
	const picker = new ui.Picker({ label: 'Requests', source: () => Promise.resolve({ items: [] }) });
	assert.equal(picker.element.querySelector('.bui-picker-input').hasAttribute('data-bui-caret'), true, 'a Picker says where its caret goes');
	picker.destroy();
});

test('a SecretField tells its form with Required.change, never with an input event a product reads as typed', () => {
	const form = document.createElement('form');
	const value = new ui.SecretField({ label: 'Value', credential: 'value', required: true, stored: true });
	form.append(value.element, document.createElement('button'));
	document.body.append(form);
	const typed = [];
	const told = [];
	form.addEventListener('input', event => typed.push(event.target.tagName));
	form.addEventListener(ui.Required.change, event => told.push(event.target.tagName));
	value.element.querySelector('.bui-secret-stored .bui-link-button').click();
	assert.deepEqual(typed, [], 'no input event from its fieldset');
	assert.deepEqual(told, ['FIELDSET']);
});

test('a form reads what waits again in the next frame after its structure changes, and a password\'s spaces are characters', async () => {
	const form = document.createElement('form');
	const save = document.createElement('button');
	form.append(save);
	document.body.append(form);
	const required = new ui.Required(form);
	assert.equal(save.hasAttribute('aria-disabled'), false);
	// A redraw the form did not make swaps a choice for a typed field the person must fill
	const typed = Object.assign(document.createElement('input'), { required: true, 'aria-label': 'Version' });
	form.prepend(typed);
	await page.until(() => save.getAttribute('aria-disabled') === 'true');
	typed.removeAttribute('required');
	await page.until(() => !save.hasAttribute('aria-disabled'));
	required.destroy();
	const secret = Object.assign(document.createElement('input'), { type: 'password', required: true });
	secret.value = '   ';
	assert.equal(ui.Required.empty(secret), false, 'every character of a password counts');
	secret.value = '';
	assert.equal(ui.Required.empty(secret), true);
});
