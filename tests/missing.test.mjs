import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * Nothing still to write is a failure in no form (0.32.0, D183): a required `Field` with nothing in it is
 * `missing`, and `check()` answers false without a message and without asking `validate`; a
 * `FocusedForm` keeps its submit quiet (`aria-disabled`, still reachable) while a required field is
 * empty and a submission puts the caret in the first empty one, saying nothing; only a wrong value is
 * said. A required `SecretField` still to give is `missing` the same way. A composer's files may wait for
 * words (`attach.words`): Send stays quiet and the field says them.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const type = (control, value) => {
	control.value = value;
	control.dispatchEvent(new Event('input', { bubbles: true }));
};

test('a required field with nothing written is missing, and check() says nothing of it nor asks validate', () => {
	const asked = [];
	const name = new ui.Field({ label: 'Name', name: 'name', required: true, validate: value => (asked.push(value), value === 'x' ? 'Choose another name.' : null) });
	document.body.append(name.element);
	assert.equal(name.missing, true);
	assert.equal(name.check(), false);
	assert.equal(name.element.querySelector('.bui-field-error').hidden, true, 'no sentence, no alert glyph');
	assert.equal(name.control.hasAttribute('aria-invalid'), false);
	assert.deepEqual(asked, [], 'validate is for a value, not for its absence');
	name.control.value = '   ';
	assert.equal(name.missing, true, 'blanks are nothing');
	name.control.value = 'x';
	assert.equal(name.missing, false);
	assert.equal(name.check(), false);
	assert.match(name.element.textContent, /Choose another name/, 'a wrong value is said');
	type(name.control, '');
	assert.equal(name.element.querySelector('.bui-field-error').hidden, true, 'emptied again: the error goes, nothing replaces it');
	const optional = new ui.Field({ label: 'Note', name: 'note' });
	assert.equal(optional.missing, false, 'an optional field is never missing');
	assert.equal(optional.check(), true);
});

test('a required box unchecked and a required choice with nothing chosen are missing too', () => {
	const box = document.createElement('input');
	box.type = 'checkbox';
	box.required = true;
	const agree = new ui.Field({ label: 'I agree', control: box });
	document.body.append(agree.element);
	assert.equal(agree.missing, true);
	box.checked = true;
	assert.equal(agree.missing, false);
	const select = document.createElement('select');
	select.required = true;
	select.append(Object.assign(document.createElement('option'), { value: '', textContent: 'Choose' }), Object.assign(document.createElement('option'), { value: 'eu', textContent: 'Europe' }));
	const region = new ui.Field({ label: 'Region', control: select });
	document.body.append(region.element);
	assert.equal(region.missing, true);
	select.value = 'eu';
	assert.equal(region.missing, false);
});

test('a focused form waits quiet while a required field is empty, and a submission puts the caret there, saying nothing', async () => {
	const form = document.createElement('form');
	const name = new ui.Field({ label: 'Name', name: 'name', required: true });
	const email = new ui.Field({ label: 'Email', name: 'email', required: true, validate: value => (value.includes('@') ? null : 'Use an email address.') });
	const submit = document.createElement('button');
	submit.textContent = 'Create';
	form.append(name.element, email.element, submit);
	document.body.append(form);
	const sent = [];
	const behavior = new ui.FocusedForm(form, { fields: [name, email], submit: values => (sent.push(values), Promise.resolve()) });
	assert.equal(behavior.missing, true);
	assert.equal(submit.getAttribute('aria-disabled'), 'true', 'nothing to create yet');
	assert.equal(submit.disabled, false, 'still reachable');
	form.requestSubmit();
	assert.equal(sent.length, 0);
	assert.ok(document.activeElement === name.control, 'the caret goes to the first empty field');
	assert.equal(form.querySelectorAll('.bui-field-error:not([hidden])').length, 0, 'nothing is said');
	type(name.control, 'Alpha');
	assert.equal(submit.getAttribute('aria-disabled'), 'true', 'one required field is still empty');
	type(email.control, 'alpha');
	assert.equal(submit.hasAttribute('aria-disabled'), false, 'everything required holds something');
	form.requestSubmit();
	assert.equal(sent.length, 0);
	assert.match(form.textContent, /Use an email address/, 'a wrong value is said');
	assert.ok(document.activeElement === email.control);
	type(email.control, 'alpha@example.com');
	form.requestSubmit();
	await page.until(() => !behavior.busy);
	assert.deepEqual(sent, [{ name: 'Alpha', email: 'alpha@example.com' }]);
	assert.equal(submit.hasAttribute('aria-disabled'), false, 'not quiet after the send, its values kept');
	type(name.control, '');
	assert.equal(submit.getAttribute('aria-disabled'), 'true');
	behavior.destroy();
	assert.equal(submit.hasAttribute('aria-disabled'), false, 'destroy leaves the buttons as they were');
});

test('without Field objects an empty required control gets the caret silently, and a wrong one says the browser\'s message', () => {
	const form = document.createElement('form');
	const name = Object.assign(document.createElement('input'), { name: 'name', required: true });
	const code = Object.assign(document.createElement('input'), { name: 'code' });
	const submit = document.createElement('button');
	form.append(name, code, submit);
	document.body.append(form);
	const sent = [];
	let reported = 0;
	code.reportValidity = () => ((reported += 1), false);
	const behavior = new ui.FocusedForm(form, { submit: values => (sent.push(values), Promise.resolve()) });
	assert.equal(submit.getAttribute('aria-disabled'), 'true');
	form.requestSubmit();
	assert.ok(document.activeElement === name, 'the empty one, silently');
	assert.equal(reported, 0);
	type(name, 'Alpha');
	assert.equal(submit.hasAttribute('aria-disabled'), false);
	code.setCustomValidity('Use six digits.');
	form.requestSubmit();
	assert.equal(reported, 1, 'a wrong value is said by the browser');
	assert.equal(sent.length, 0);
	behavior.destroy();
});

test('a required secret still to give keeps the form quiet, and a press opens its fold with the caret in it, saying nothing', () => {
	const form = document.createElement('form');
	const name = new ui.Field({ label: 'Name', name: 'name', required: true });
	const value = new ui.SecretField({ label: 'Value', credential: 'value', required: true, labels: { paste: 'Enter the value' } });
	const submit = document.createElement('button');
	form.append(name.element, value.element, submit);
	document.body.append(form);
	const sent = [];
	const behavior = new ui.FocusedForm(form, { fields: [name, value], submit: values => (sent.push(values), Promise.resolve()) });
	type(name.control, 'TOKEN');
	assert.equal(value.missing, true, 'nothing pasted behind a closed fold');
	assert.equal(submit.getAttribute('aria-disabled'), 'true', 'the form waits for the value');
	form.requestSubmit();
	const fold = value.element.querySelector('details');
	assert.equal(fold.open, true, 'a press opens the fold');
	assert.ok(document.activeElement === value.control, 'and puts the caret in its input');
	assert.equal(form.querySelectorAll('.bui-field-error:not([hidden]), .bui-form-problem .bui-callout').length, 0, 'nothing is said');
	assert.equal(sent.length, 0);
	type(value.control, '   ');
	assert.equal(value.missing, true, 'blanks are nothing');
	type(value.control, 's3cret');
	assert.equal(submit.hasAttribute('aria-disabled'), false, 'a value makes it able');
	behavior.destroy();
	const optional = new ui.SecretField({ label: 'Access', credential: 'token' });
	assert.equal(optional.missing, false, 'a secret that is not required is never missing');
	const held = new ui.SecretField({ label: 'Value', credential: 'value', required: true, stored: true });
	const again = document.createElement('form');
	const save = document.createElement('button');
	again.append(held.element, save);
	document.body.append(again);
	const kept = new ui.FocusedForm(again, { fields: [held], submit: () => Promise.resolve() });
	assert.equal(held.missing, false, 'a stored secret is kept');
	held.element.querySelector('.bui-secret-stored .bui-link-button').click();
	assert.equal(save.getAttribute('aria-disabled'), 'true', 'Replace makes it a secret to give, and the form reads it at once');
	held.element.querySelector('.bui-secret-stored .bui-link-button').click();
	assert.equal(save.hasAttribute('aria-disabled'), false, 'keeping the stored one makes it able again');
	kept.destroy();
});

test('a composer\'s files may wait for words: Send stays quiet and the field says what they wait for', () => {
	const composer = new ui.Composer({ label: 'Message', placeholder: 'What should Codex do?', onsubmit: () => Promise.resolve(), attach: { onfiles: () => undefined, words: 'Say what to do with the attached files' } }).mount(document.body);
	const root = composer.element;
	const field = composer.field;
	const send = root.querySelector('.bui-composer-go');
	composer.attachments = [{ key: 'a', name: 'trace.png', state: 'uploading', progress: 0.4 }];
	assert.equal(field.getAttribute('placeholder'), 'What should Codex do?', 'a file on its way waits for nothing yet');
	composer.attachments = [{ key: 'a', name: 'trace.png', state: 'ready' }];
	assert.ok(root.hasAttribute('data-empty'), 'files alone are nothing to send');
	assert.equal(send.getAttribute('aria-disabled'), 'true');
	assert.equal(field.getAttribute('placeholder'), 'Say what to do with the attached files');
	assert.equal(root.querySelector('.bui-composer-placeholder').textContent, 'Say what to do with the attached files');
	type(field, 'Use it for the layout');
	assert.equal(root.hasAttribute('data-empty'), false, 'words make it something to send');
	assert.equal(send.hasAttribute('aria-disabled'), false);
	type(field, '');
	assert.equal(field.getAttribute('placeholder'), 'Say what to do with the attached files');
	composer.attachments = [];
	assert.equal(field.getAttribute('placeholder'), 'What should Codex do?', 'no files: the product\'s own words again');
	composer.placeholder = 'Message Codex';
	assert.equal(field.getAttribute('placeholder'), 'Message Codex');
	composer.destroy();
	const alone = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), attach: { onfiles: () => undefined } }).mount(document.body);
	alone.attachments = [{ key: 'a', name: 'trace.png', state: 'ready' }];
	assert.equal(alone.element.hasAttribute('data-empty'), false, 'without words, a ready file goes by itself as before');
	alone.destroy();
});
