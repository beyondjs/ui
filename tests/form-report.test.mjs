import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * React `Form`'s `report` (0.34.0, D183): off by default, so wrong values stay the product's to say in its
 * fields; with it, a control that breaks its own constraints, when nothing waits before it, says the
 * browser's own message (`Required.report`) and `onSubmit` does not run, as `FocusedForm` without fields
 * does. happy-dom validates types, patterns and ranges but its `reportValidity()` moves no focus, so the
 * report is counted here and its focus is proved in a real engine (`acceptance/checks/missing.mjs`).
 */
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
const dom = await import('@beyond-js/ui/dom');
const h = React.createElement;
const { act, StrictMode } = React;
let root = null;
let host = null;

after(() => page.close());
beforeEach(async () => {
	if (root) await act(() => root.unmount());
	page.reset();
	host = document.createElement('div');
	document.body.append(host);
	root = createRoot(host);
});

const render = element => act(() => root.render(h(StrictMode, null, element)));
const type = (input, value) => act(async () => {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
});
/** An invitation form: a required name and an email the browser checks, each report counted. */
async function invite(props) {
	const sent = [];
	await render(h(ui.Form, { onSubmit: event => (event.preventDefault(), sent.push(new FormData(event.currentTarget).get('email'))), ...props }, h('input', { name: 'name', required: true, 'aria-label': 'Name' }), h('input', { name: 'email', type: 'email', 'aria-label': 'Email' }), h('button', { type: 'submit' }, 'Invite')));
	const form = host.querySelector('form');
	const [name, email] = form.querySelectorAll('input');
	const reported = [];
	for (const input of [name, email]) input.reportValidity = () => (reported.push(input.name), false);
	return { form, name, email, sent, reported };
}

test('by default a wrong value is the product\'s to say: onSubmit runs and the browser says nothing', async () => {
	const { form, name, email, sent, reported } = await invite({});
	await type(name, 'Alpha');
	await type(email, 'alpha');
	assert.equal(email.validity.typeMismatch, true, 'the browser reads it as wrong');
	await act(async () => form.requestSubmit());
	assert.deepEqual(sent, ['alpha'], 'the product hears it and says it in its field');
	assert.deepEqual(reported, []);
	assert.equal(form.noValidate, true);
});

test('with report a wrong value says the browser\'s own message and onSubmit does not run; corrected, it sends', async () => {
	const { form, name, email, sent, reported } = await invite({ report: true });
	await type(name, 'Alpha');
	await type(email, 'alpha');
	const save = form.querySelector('button');
	assert.equal(save.hasAttribute('aria-disabled'), false, 'nothing waits: a wrong value is no wait');
	await act(async () => form.requestSubmit());
	assert.deepEqual(reported, ['email'], 'the first wrong control says its message');
	assert.deepEqual(sent, [], 'onSubmit does not run then');
	await type(email, 'alpha@example.com');
	await act(async () => form.requestSubmit());
	assert.deepEqual(sent, ['alpha@example.com']);
	assert.deepEqual(reported, ['email']);
	assert.equal(form.noValidate, true, 'the browser never validates a submission by itself');
});

test('with report a part that waits before the wrong value takes the caret silently; one after it waits its turn', async () => {
	const { form, name, email, reported } = await invite({ report: true });
	await type(email, 'alpha');
	await act(async () => form.requestSubmit());
	assert.deepEqual(reported, [], 'the empty name comes first and says nothing');
	assert.ok(document.activeElement === name);
	await act(() => root.unmount());
	root = createRoot(host);
	const sent = [];
	await render(h(ui.Form, { report: true, onSubmit: () => sent.push('sent') }, h('input', { name: 'code', pattern: '[0-9]{6}', 'aria-label': 'Code' }), h('input', { name: 'name', required: true, 'aria-label': 'Name' }), h('button', { type: 'submit' }, 'Join')));
	const [code] = host.querySelectorAll('input');
	code.reportValidity = () => (reported.push('code'), false);
	await type(code, 'abc');
	await act(async () => host.querySelector('form').requestSubmit());
	assert.deepEqual(reported, ['code'], 'a wrong value that comes first is said first');
	assert.deepEqual(sent, []);
});

test('Required.report: nothing wrong stops nothing; a wrong control first is reported once, the submission stopped', () => {
	const form = document.createElement('form');
	const price = Object.assign(document.createElement('input'), { name: 'price', type: 'number', min: '1' });
	const note = Object.assign(document.createElement('input'), { name: 'note', required: true });
	form.append(price, note);
	document.body.append(form);
	const required = new dom.Required(form);
	const submit = () => new Event('submit', { cancelable: true });
	let reported = 0;
	price.reportValidity = () => ((reported += 1), false);
	note.value = 'Monthly';
	assert.equal(required.report(submit()), false, 'nothing is wrong');
	price.value = '0';
	const event = submit();
	assert.equal(required.report(event), true);
	assert.equal(event.defaultPrevented, true);
	assert.equal(reported, 1);
	note.value = '';
	assert.equal(required.report(submit()), true, 'the wrong price still comes before the empty note');
	form.prepend(note);
	assert.equal(required.report(submit()), false, 'the empty note now comes first: hold says nothing for it');
	assert.equal(reported, 2);
	required.destroy();
});
