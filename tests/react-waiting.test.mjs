import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * The React forms of 0.34.0's waits (D183): `ChoiceMenu` and `ChoiceChip` take `waiting` and `place` (a
 * function returning an element, read from the latest props, as React `Button` takes it), and the
 * `Composer`'s `disabled` carries `place` for a press on its held Send. Also run on React 18.
 */
const page = new Page();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { createRoot } = await import('react-dom/client');
const ui = await import('@beyond-js/ui/react');
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
const press = node => act(async () => node.click());
const branches = [{ value: 'main', label: 'main' }, { value: 'fix', label: 'fix/redirect' }];

test('ChoiceChip and ChoiceMenu wait quiet, a press going to the latest place; leaving the wait opens them', async () => {
	const first = document.body.appendChild(document.createElement('button'));
	const second = document.body.appendChild(document.createElement('button'));
	for (const Class of [ui.ChoiceChip, ui.ChoiceMenu]) {
		const view = (waiting, place) => h(Class, { label: 'Branch', options: branches, waiting, place });
		await render(view(true, () => first));
		const button = host.querySelector('.bui-choice-button');
		assert.equal(button.getAttribute('aria-disabled'), 'true', `${Class.name}: quiet from its first drawing`);
		assert.equal(button.disabled, false);
		await press(button);
		assert.equal(host.querySelector('.bui-choice-list').hidden, true, 'its list does not open');
		assert.ok(document.activeElement === first);
		await render(view(true, () => second));
		await press(button);
		assert.ok(document.activeElement === second, 'the place of the latest props');
		await render(view(false, () => second));
		assert.equal(button.hasAttribute('aria-disabled'), false, 'able again');
		await press(button);
		assert.equal(host.querySelector('.bui-choice-list').hidden, false, 'a press opens it');
		await render(view(true, () => second));
		assert.equal(host.querySelector('.bui-choice-list').hidden, true, 'waiting again closes it');
		await act(() => root.render(null));
	}
});

test('without place a waiting choice holds the press and changes nothing', async () => {
	const changed = [];
	await render(h(ui.ChoiceMenu, { label: 'Branch', options: branches, waiting: true, onChange: value => changed.push(value) }));
	const button = host.querySelector('.bui-choice-button');
	button.focus();
	await press(button);
	assert.equal(host.querySelector('.bui-choice-list').hidden, true);
	assert.ok(document.activeElement === button);
	assert.deepEqual(changed, []);
});

test("the Composer's held Send goes to the latest disabled.place; without one a press does nothing", async () => {
	const sent = [];
	const first = document.body.appendChild(document.createElement('button'));
	const second = document.body.appendChild(document.createElement('button'));
	const view = place => h(ui.Composer, { label: 'Message', value: 'Deploy it', onSubmit: message => sent.push(message.text), disabled: { reason: 'Choose a machine first.', place } });
	await render(view(() => first));
	const send = host.querySelector('.bui-composer-go');
	assert.equal(send.getAttribute('aria-disabled'), 'true');
	assert.equal(host.querySelector('.bui-composer-reason').textContent, 'Choose a machine first.');
	await press(send);
	assert.ok(document.activeElement === first);
	await render(view(() => second));
	await press(send);
	assert.ok(document.activeElement === second, 'the place of the latest props, the reason unchanged');
	await render(view(null));
	first.focus();
	await press(send);
	assert.ok(document.activeElement === first, 'no place: focus is not moved');
	assert.deepEqual(sent, [], 'nothing is sent while held');
	await render(h(ui.Composer, { label: 'Message', value: 'Deploy it', onSubmit: message => sent.push(message.text), disabled: null }));
	await press(send);
	assert.deepEqual(sent, ['Deploy it']);
});
