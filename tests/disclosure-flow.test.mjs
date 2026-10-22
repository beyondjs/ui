import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
const { Disclosure, Help } = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

test('An in-flow disclosure keeps outside actions stable and still closes explicitly', t => {
	const inside = document.createElement('input');
	const action = document.createElement('button');
	const panel = new Disclosure({ label: 'Development', outside: false, children: [inside] }).mount(document.body);
	t.after(() => panel.destroy());
	document.body.append(action);
	panel.open();
	action.focus();
	action.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
	assert.equal(panel.expanded, true);
	assert.equal(document.activeElement, action);
	inside.focus();
	page.key(inside, 'Escape');
	assert.equal(panel.expanded, false);
	assert.equal(document.activeElement, panel.button);
	panel.button.click();
	panel.button.click();
	assert.equal(panel.expanded, false);
	assert.equal(panel.listeners.size, 0);
});


test('Help keeps its in-flow explanation open when another field receives a press', t => {
 const help = new Help({ topic: 'Command', text: 'Choose a command.' }).mount(document.body);
 t.after(() => help.destroy());
 const field = document.createElement('input');
 document.body.append(field);
 help.open(); field.focus();
 field.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
 assert.equal(help.expanded, true);
 assert.equal(document.activeElement, field);
 help.button.click();
 assert.equal(help.expanded, false);
});
