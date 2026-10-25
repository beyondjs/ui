import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * 0.35.0: a package `Button` that waits for the product's own condition marks its wait
 * (`data-bui-waiting`), in the DOM and in React, so a form's `Required` and a `Quiet` never free it: found
 * by the Packages interface, whose Save waited for its own condition and was freed once the form held
 * everything. Neither frees a busy one either, and once the wait ends what still waits quiets it again.
 * Also run on React 18.
 */
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
const dom = await import('@beyond-js/ui/dom');
const h = React.createElement;
const { act, StrictMode, useState } = React;
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

const type = (input, value) => {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
};

test("a form never frees a package Button's own wait, nor a busy one; once the wait ends, what still waits quiets it", async () => {
	const form = document.createElement('form');
	const name = Object.assign(document.createElement('input'), { required: true, 'aria-label': 'Name' });
	const save = new dom.Button({ label: 'Save', type: 'submit', variant: 'primary' });
	form.append(name, save.element);
	document.body.append(form);
	const required = new dom.Required(form);
	assert.equal(save.element.getAttribute('aria-disabled'), 'true', 'the form quiets Save while the name waits');
	assert.equal(save.element.hasAttribute('data-bui-waiting'), false, 'the form\'s wait is not the button\'s own');
	// The product's own condition: Save waits for it, as the Packages interface's did
	save.waiting = true;
	assert.equal(save.element.hasAttribute('data-bui-waiting'), true, 'its own wait is marked');
	type(name, 'Checkout');
	assert.equal(save.element.getAttribute('aria-disabled'), 'true', 'the form holds everything and the product\'s wait stands');
	save.waiting = false;
	assert.equal(save.element.hasAttribute('aria-disabled'), false, 'its wait ended and nothing waits: able');
	type(name, '');
	assert.equal(save.element.getAttribute('aria-disabled'), 'true', 'the form quiets it again');
	// The product's wait ends while the name still waits: the form reads it again and quiets it
	save.waiting = true;
	save.waiting = false;
	await page.until(() => save.element.getAttribute('aria-disabled') === 'true');
	// A busy Save keeps its work's state; the form frees it from its own quiet only once the work ended
	type(name, 'Checkout');
	let finish;
	const work = save.run(() => new Promise(resolve => (finish = resolve)));
	type(name, '');
	type(name, 'Checkout');
	assert.equal(save.element.getAttribute('aria-disabled'), 'true', 'busy, the form leaves it as its work draws it');
	finish();
	await work;
	assert.equal(save.element.hasAttribute('aria-disabled'), false);
	// Quieted by the form, then waiting for the product: destroy() leaves the product's wait
	type(name, '');
	save.waiting = true;
	required.destroy();
	assert.equal(save.element.getAttribute('aria-disabled'), 'true', 'destroy() leaves the product\'s wait');
	save.destroy();
});

test("Quiet never frees a package Button's own wait, and draws it again once that wait ends", async () => {
	const add = new dom.Button({ label: 'Add' });
	document.body.append(add.element);
	let chosen = false;
	const quiet = new dom.Quiet(add.element, { waiting: () => !chosen });
	assert.equal(add.element.getAttribute('aria-disabled'), 'true');
	add.waiting = true;
	chosen = true;
	quiet.settle();
	assert.equal(add.element.getAttribute('aria-disabled'), 'true', 'its own wait stands once nothing is left to choose');
	add.waiting = false;
	assert.equal(add.element.hasAttribute('aria-disabled'), false);
	chosen = false;
	add.waiting = true;
	add.waiting = false;
	await page.until(() => add.element.getAttribute('aria-disabled') === 'true');
	add.waiting = true;
	quiet.destroy();
	assert.equal(add.element.getAttribute('aria-disabled'), 'true', 'destroy() leaves the button\'s own wait');
	add.destroy();
});

test("React's Button marks its own wait, and React's Form never frees it", async () => {
	let set = null;
	function Edit() {
		const [waiting, setWaiting] = useState(false);
		set = setWaiting;
		return h(ui.Form, { onSubmit: event => event.preventDefault() }, h('input', { name: 'name', required: true, 'aria-label': 'Name' }), h(ui.Button, { type: 'submit', variant: 'primary', waiting }, 'Save'));
	}
	await act(() => root.render(h(StrictMode, null, h(Edit))));
	const [name] = host.querySelectorAll('input');
	const save = host.querySelector('button');
	assert.equal(save.getAttribute('aria-disabled'), 'true', 'the form quiets Save while the name waits');
	assert.equal(save.hasAttribute('data-bui-waiting'), false);
	await act(async () => set(true));
	assert.equal(save.hasAttribute('data-bui-waiting'), true, 'its own wait is marked');
	await act(async () => type(name, 'Checkout'));
	assert.equal(save.getAttribute('aria-disabled'), 'true', 'the form holds everything and the product\'s wait stands');
	await act(async () => set(false));
	assert.equal(save.hasAttribute('data-bui-waiting'), false);
	assert.equal(save.hasAttribute('aria-disabled'), false, 'its wait ended and nothing waits: able');
	await act(async () => type(name, ''));
	assert.equal(save.getAttribute('aria-disabled'), 'true', 'the form quiets it again');
});
