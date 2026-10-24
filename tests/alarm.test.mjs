import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * No false alarm (0.29.0, D183): with nothing to send the composer's Send is quiet and `aria-disabled`, a
 * press says nothing and puts the caret in the field, the split menu's ways to send wait for a message, and
 * only a step acts without one.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const settle = () => new Promise(resolve => setTimeout(resolve, 0));
/** A composer whose sends are recorded and never answered. */
function make(options = {}) {
	const sent = [];
	const composer = new ui.Composer({
		label: 'Message to Claude Code',
		placeholder: 'Message Claude Code…',
		onsubmit: message => (sent.push(message), new Promise(() => {})),
		...options
	}).mount(document.body);
	return { composer, sent, field: composer.field };
}
const enter = (field, options = {}) => page.key(field, 'Enter', options);

test('nothing to send is no failure: Enter does nothing, Send is quiet and aria-disabled, a press says nothing and puts the caret in the field (D183)', () => {
	const { composer, sent, field } = make();
	const send = composer.element.querySelector('.bui-button-primary');
	const band = composer.element.querySelector('.bui-composer-line');
	assert.equal(send.getAttribute('aria-disabled'), 'true', 'Send can\'t act yet');
	assert.ok(composer.element.hasAttribute('data-empty'));
	assert.equal(enter(field).defaultPrevented, true);
	send.click();
	assert.equal(sent.length, 0);
	assert.equal(composer.element.querySelector('.bui-composer-problem').hidden, true, 'no sentence, no alert');
	assert.equal(band.hidden, true, 'the band stays closed');
	assert.ok(document.activeElement === field, 'the press puts the caret where the message is written');
	assert.ok(!field.getAttribute('aria-describedby').includes('bui-composer-problem'));
	field.value = 'Deploy it';
	field.dispatchEvent(new Event('input'));
	assert.equal(send.hasAttribute('aria-disabled'), false, 'words make it able');
	field.value = '   ';
	field.dispatchEvent(new Event('input'));
	assert.equal(send.getAttribute('aria-disabled'), 'true', 'blanks are nothing to send');
	composer.value = 'Restored draft';
	assert.equal(send.hasAttribute('aria-disabled'), false, 'a restored draft too');
	composer.destroy();
});

test('a step acts without a message; the other ways to send and an action in words wait for one (D183)', async () => {
	const steps = [];
	const { composer, sent, field } = make({ actions: [{ id: 'start', label: 'Start and send', primary: true }, { id: 'wait', label: 'Send without starting' }] });
	const send = composer.element.querySelector('.bui-button-primary');
	const menu = composer.element.querySelector('.bui-composer-send .bui-menu-button');
	menu.click();
	const item = [...composer.element.querySelectorAll('.bui-composer-send [role="menuitem"]')].find(node => node.textContent.includes('Send without starting'));
	assert.equal(item.getAttribute('aria-disabled'), 'true', 'nothing to send without starting');
	item.click();
	assert.equal(sent.length, 0);
	field.value = 'Go';
	field.dispatchEvent(new Event('input'));
	const able = [...composer.element.querySelectorAll('.bui-composer-send [role="menuitem"]')].find(node => node.textContent.includes('Send without starting'));
	assert.equal(able.hasAttribute('aria-disabled'), false, 'a message makes it able');
	field.value = '';
	field.dispatchEvent(new Event('input'));
	composer.step = { label: 'Choose a machine and send', run: async ({ text }) => (steps.push(text), false) };
	assert.equal(send.hasAttribute('aria-disabled'), false, 'a step acts on an empty field');
	send.click();
	await settle();
	assert.deepEqual(steps, [''], 'the step ran, and nothing was sent');
	assert.equal(sent.length, 0);
	composer.step = null;
	assert.equal(send.getAttribute('aria-disabled'), 'true', 'quiet again without the step');
	composer.actions = [{ id: 'check', label: 'Check whether it started', words: true }];
	assert.equal(send.getAttribute('aria-disabled'), 'true', 'an action in words still needs the message it checks');
	field.value = 'Go';
	field.dispatchEvent(new Event('input'));
	assert.equal(send.hasAttribute('aria-disabled'), false);
	composer.destroy();
});
