import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

test('Disclosure closed from code returns focus to its button only when focus was inside the panel', t => {
	const outside = document.createElement('input');
	const inside = document.createElement('button');
	const disclosure = new ui.Disclosure({ label: 'Account', children: [inside] }).mount(document.body);
	t.after(() => disclosure.destroy());
	document.body.append(outside);
	disclosure.open();
	outside.focus();
	disclosure.close();
	assert.ok(document.activeElement === outside, 'focus elsewhere stays where it is');
	disclosure.open();
	inside.focus();
	disclosure.close();
	assert.equal(disclosure.expanded, false);
	assert.ok(document.activeElement === disclosure.button, 'focus is not left on a hidden element');
	disclosure.open();
	inside.focus();
	outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
	assert.equal(disclosure.expanded, false, 'a press outside closes');
	assert.ok(document.activeElement !== disclosure.button, 'and leaves focus to the press');
});

test('Escape reaching the document while focus rests on the body closes the panel and focuses the button; focus elsewhere keeps it open', t => {
	const field = document.createElement('input');
	const disclosure = new ui.Disclosure({ label: 'Help', children: [document.createElement('p')] }).mount(document.body);
	t.after(() => disclosure.destroy());
	document.body.append(field);
	disclosure.open();
	field.focus();
	page.key(field, 'Escape');
	assert.equal(disclosure.expanded, true, 'Escape in another field is that field\'s');
	field.blur();
	page.key(document.body, 'Escape');
	assert.equal(disclosure.expanded, false);
	assert.ok(document.activeElement === disclosure.button, 'focus on the button, not the body');
	assert.equal(disclosure.listeners.size, 0, 'closing releases its document listeners');
});

test('Disclosure hides its panel at once and lets an inert picture of it ease out, never with reduced motion', async t => {
	const inside = document.createElement('p');
	inside.id = 'inside';
	inside.textContent = 'Recent notices';
	const disclosure = new ui.Disclosure({ label: 'Notices', children: [inside] }).mount(document.body);
	t.after(() => disclosure.destroy());
	// The package's stylesheet floats the panel; this page loads no stylesheet
	disclosure.panel.style.position = 'absolute';
	disclosure.open();
	disclosure.close();
	assert.equal(disclosure.panel.hidden, true, 'nothing in the panel can be reached once closed');
	const picture = disclosure.element.querySelector('.bui-disclosure-leaving');
	assert.ok(picture, 'a picture eases out where the panel was');
	assert.equal(picture.getAttribute('aria-hidden'), 'true');
	assert.equal(picture.inert, true);
	assert.equal(picture.querySelector('[id]'), null, 'the picture repeats no identifier');
	assert.equal(picture.getAttribute('role'), null);
	picture.dispatchEvent(new Event('animationend'));
	assert.equal(disclosure.element.querySelector('.bui-disclosure-leaving'), null, 'removed once its movement ends');
	const matchMedia = window.matchMedia;
	window.matchMedia = query => ({ matches: query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} });
	t.after(() => (window.matchMedia = matchMedia));
	disclosure.open();
	disclosure.close();
	assert.equal(disclosure.element.querySelector('.bui-disclosure-leaving'), null, 'no picture with reduced motion');
});

test('Opening again removes the picture of an earlier closing, so an open panel never has a copy beside it; destroy removes one still easing out', t => {
	const entry = document.createElement('button');
	entry.className = 'entry';
	const disclosure = new ui.Disclosure({ label: 'Account', children: [entry] }).mount(document.body);
	t.after(() => disclosure.destroy());
	disclosure.panel.style.position = 'absolute';
	disclosure.open();
	disclosure.close();
	disclosure.open();
	assert.equal(disclosure.element.querySelectorAll('.bui-disclosure-leaving').length, 0, 'no picture while the panel is open');
	assert.equal(disclosure.element.querySelectorAll('.entry').length, 1, 'one entry, the panel\'s own');
	disclosure.close();
	disclosure.open();
	disclosure.close();
	assert.equal(disclosure.element.querySelectorAll('.bui-disclosure-leaving').length, 1, 'one picture at most');
	disclosure.destroy();
	assert.equal(disclosure.element.querySelector('.bui-disclosure-leaving'), null, 'destroy removes a picture still easing out');
});

test('A panel in the page flow closes at once, with no picture that would hold its place', t => {
	const help = new ui.Help({ topic: 'Billing', text: 'Charges are monthly.' }).mount(document.body);
	t.after(() => help.destroy());
	help.panel.style.position = 'static';
	help.open();
	help.close();
	assert.equal(help.panel.hidden, true);
	assert.equal(help.element.querySelector('.bui-disclosure-leaving'), null, 'nothing is left in the flow');
	assert.equal(help.element.querySelectorAll('.bui-help-panel').length, 1, 'one help panel, never a second one while closing');
});
