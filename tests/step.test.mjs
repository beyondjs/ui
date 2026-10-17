import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/** The composer's missing step (0.16.0, DQ-03) and one bar on a phone (0.16.0, DQ-19). */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const typed = (composer, text) => {
	composer.field.value = text;
	composer.field.dispatchEvent(new page.window.Event('input'));
};

test('Send names the missing step and performs it; then the message is sent; false keeps the text', async () => {
	const sent = [];
	const runs = [];
	let ready = true;
	const composer = new ui.Composer({ label: 'Message', onsubmit: async message => sent.push(message.text), step: { label: 'Choose a machine and send', run: async ({ text }) => (runs.push(text), ready) } }).mount(document.body);
	const send = composer.element.querySelector('.bui-composer-send .bui-button-primary');
	assert.equal(send.textContent, 'Choose a machine and send');
	assert.ok(send.hasAttribute('data-step'));
	assert.equal(send.getAttribute('aria-disabled'), null, 'a step is not a refusal');
	typed(composer, 'Fix the redirect');
	ready = false;
	assert.equal(await composer.submit(), false);
	assert.deepEqual([runs, sent, composer.value], [['Fix the redirect'], [], 'Fix the redirect'], 'false keeps the text');
	ready = true;
	assert.equal(await composer.submit(), true);
	assert.deepEqual(sent, ['Fix the redirect'], 'the step done, the message is sent');
	composer.step = null;
	assert.equal(send.textContent, 'Send', 'the step done, Send is Send again');
	typed(composer, 'Again');
	await composer.submit();
	assert.equal(runs.length, 2, 'no step without one');
	composer.destroy();
});

test('an empty field runs the step without sending; a throwing step keeps the text; one step at a time, busy meanwhile', async () => {
	const sent = [];
	let release;
	const composer = new ui.Composer({ label: 'Message', onsubmit: async message => sent.push(message.text), step: { label: 'Connect Claude Code and send', run: () => new Promise(resolve => (release = resolve)) } }).mount(document.body);
	const first = composer.submit();
	assert.ok(composer.element.hasAttribute('data-busy'));
	assert.equal(await composer.submit(), false, 'once at a time');
	release(true);
	assert.equal(await first, false, 'nothing to send');
	assert.deepEqual(sent, []);
	const errors = [];
	const report = globalThis.reportError;
	globalThis.reportError = error => errors.push(error.message);
	composer.step = { label: 'Choose', run: () => { throw new Error('no machine'); } };
	typed(composer, 'Hello');
	assert.equal(await composer.submit(), false);
	assert.deepEqual([errors, composer.value], [['no machine'], 'Hello']);
	globalThis.reportError = report;
	composer.destroy();
});

test('merged with the family bar, the sidebar draws no product row; the bar\'s button opens its drawer and is told when it closes', () => {
	const bar = new ui.FamilyBar({ product: 'conduict', brand: { src: '/w.svg', href: '/' } }).mount(document.body);
	const sidebar = new ui.Sidebar({ product: 'Conduict', groups: [{ heading: null, items: [{ label: 'Machines', href: '#/m', current: true }] }], cut: 99999 }).mount(document.body);
	assert.equal(sidebar.mode, 'drawer');
	sidebar.merge(bar);
	assert.ok(sidebar.element.hasAttribute('data-merged') && bar.element.hasAttribute('data-merged'));
	assert.ok(bar.element.hasAttribute('data-drawer'), 'the bar shows its button while the sidebar is a drawer');
	assert.ok(bar.element.classList.contains('bui-header-external'));
	assert.equal(ui.FamilyBar.of(bar.element), bar);
	const toggle = bar.element.querySelector('.bui-header-toggle');
	assert.equal(toggle.getAttribute('aria-controls'), sidebar.element.querySelector('dialog').id);
	toggle.click();
	assert.equal(sidebar.expanded, true, 'the bar opens the drawer');
	assert.equal(toggle.getAttribute('aria-expanded'), 'true');
	sidebar.close();
	assert.equal(bar.expanded, false, 'and is told it closed');
	assert.equal(toggle.getAttribute('aria-expanded'), 'false');
	sidebar.destroy();
	bar.destroy();
});
