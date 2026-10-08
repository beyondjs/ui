import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page as Window } from './support/page.mjs';

/** Page's panel kept in view (0.10.0): beside and hideable from the region's cut, a side sheet below it, a toggle that follows. */
const page = new Window();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => {
	page.reset();
	page.window.happyDOM.setViewport({ width: 1280, height: 800 });
	document.documentElement.style.overflow = '';
});

const resize = width => {
	page.window.happyDOM.setViewport({ width, height: 800 });
	page.window.dispatchEvent(new Event('resize'));
};
/** A conversation page with its context panel and a header toggle, as a product builds it. */
function scene(panel = {}) {
	const changes = [];
	const toggle = new ui.Button({ label: 'Details', variant: 'quiet' });
	const header = new ui.PageHeader({ title: 'Fix the checkout redirect', actions: [toggle] });
	const facts = Object.assign(document.createElement('section'), { innerHTML: '<h3>Environment</h3><a href="#/env">Open web</a>' });
	const view = new ui.Page({ header, children: [Object.assign(document.createElement('p'), { textContent: 'The thread' })], aside: [facts], label: 'Conversation details', panel: { cut: 1000, onchange: shown => changes.push(shown), title: 'Details', ...panel } }).mount(document.body);
	view.panel.control(toggle.element);
	return { view, panel: view.panel, toggle: toggle.element, facts, changes };
}

test('from the cut the panel sits beside the main column, named, and the person may hide it and show it again', () => {
	const { view, panel, toggle, facts, changes } = scene();
	assert.equal(panel.mode, 'beside');
	assert.equal(view.element.dataset.panel, 'beside');
	const aside = view.element.querySelector('.bui-page-body > aside.bui-page-panel');
	assert.ok(aside && aside.contains(facts));
	assert.equal(aside.getAttribute('aria-label'), 'Conversation details');
	assert.equal(aside.hidden, false);
	assert.equal(toggle.getAttribute('aria-expanded'), 'true');
	assert.equal(toggle.getAttribute('aria-controls'), aside.id);
	aside.querySelector('a').focus();
	toggle.click();
	assert.equal(aside.hidden, true);
	assert.equal(toggle.getAttribute('aria-expanded'), 'false');
	assert.deepEqual(changes, [false], 'the choice is reported, for the device to keep');
	toggle.click();
	assert.equal(aside.hidden, false);
	assert.deepEqual(changes, [false, true]);
	panel.shown = false;
	assert.equal(aside.hidden, true, 'a kept choice applied without a report');
	assert.deepEqual(changes, [false, true]);
	view.destroy();
	const closed = scene({ open: false });
	assert.equal(closed.view.element.querySelector('.bui-page-panel').hidden, true, 'open: false starts hidden');
	closed.view.destroy();
});

test('below the cut it is out of the flow and opens in a side sheet, focus in and back, aria-expanded following', async () => {
	resize(800);
	const { view, panel, toggle, facts } = scene();
	assert.equal(panel.mode, 'sheet');
	assert.equal(view.element.dataset.panel, 'sheet');
	assert.equal(view.element.querySelector('.bui-page-panel').hidden, true);
	assert.equal(toggle.getAttribute('aria-expanded'), 'false');
	toggle.focus();
	toggle.click();
	const sheet = document.querySelector('dialog.bui-sheet');
	assert.equal(sheet.open, true);
	assert.equal(toggle.getAttribute('aria-controls'), sheet.id);
	assert.equal(toggle.getAttribute('aria-expanded'), 'true');
	assert.ok(sheet.contains(facts), 'the same content, in the sheet');
	assert.equal(sheet.querySelector('.bui-sheet-title').textContent, 'Details');
	assert.ok(sheet.contains(document.activeElement));
	page.key(document.activeElement, 'Escape');
	await page.until(() => !sheet.open);
	assert.ok(view.element.querySelector('.bui-page-panel').contains(facts), 'the content goes back to the panel');
	assert.equal(toggle.getAttribute('aria-expanded'), 'false');
	assert.ok(document.activeElement === toggle, 'focus back on the toggle');
	view.destroy();
});

test('a toggle pressed without taking focus (as WebKit clicks a button) still gets it back from the sheet, and so does an opening by code', async () => {
	resize(800);
	const { view, panel, toggle } = scene();
	document.body.focus();
	toggle.click();
	const sheet = document.querySelector('dialog.bui-sheet');
	assert.equal(sheet.open, true);
	page.key(document.activeElement, 'Escape');
	await page.until(() => !sheet.open);
	assert.ok(document.activeElement === toggle, 'focus back on the toggle that was pressed');
	document.body.focus();
	panel.open();
	await page.until(() => sheet.open);
	page.key(document.activeElement, 'Escape');
	await page.until(() => !sheet.open);
	assert.ok(document.activeElement === toggle, 'focus on the first toggle after an opening by code');
	view.destroy();
});

test('crossing the cut while the sheet is open shows the panel beside, focus included; the cut may be a rem length', () => {
	resize(800);
	const { view, panel, toggle, facts } = scene({ cut: '62.5rem' });
	assert.equal(panel.mode, 'sheet', '62.5rem is 1000 px here');
	panel.open();
	facts.querySelector('a').focus();
	resize(1280);
	assert.equal(panel.mode, 'beside');
	assert.equal(document.querySelector('dialog.bui-sheet[open]'), null);
	const aside = view.element.querySelector('.bui-page-panel');
	assert.equal(aside.hidden, false);
	assert.ok(aside.contains(facts));
	assert.ok(aside.contains(document.activeElement), 'focus moved into the panel beside');
	assert.equal(toggle.getAttribute('aria-expanded'), 'true');
	view.destroy();
});

test('content: null takes the panel out; content brings it back; without panel the aside flows as before', () => {
	const { view, panel } = scene();
	view.aside = null;
	assert.equal(view.element.querySelector('.bui-page-panel'), null);
	assert.equal(panel.expanded, false);
	view.aside = [Object.assign(document.createElement('p'), { textContent: 'Back' })];
	assert.equal(view.element.querySelector('.bui-page-panel').textContent, 'Back');
	view.destroy();
	assert.equal(document.querySelector('dialog.bui-sheet'), null);
	const plain = new ui.Page({ aside: [document.createElement('p')], label: 'About' }).mount(document.body);
	assert.equal(plain.panel, null);
	assert.equal(plain.element.dataset.panel, undefined);
	const aside = plain.element.querySelector('aside');
	assert.ok(aside.classList.contains('bui-page-aside') && !aside.classList.contains('bui-page-panel'));
	plain.destroy();
});

test('control returns its release, and destroying the page releases the panel', () => {
	const { view, panel, toggle } = scene();
	const extra = document.body.appendChild(document.createElement('button'));
	const release = panel.control(extra);
	assert.equal(extra.getAttribute('aria-expanded'), 'true');
	release();
	assert.equal(extra.hasAttribute('aria-expanded'), false);
	extra.click();
	assert.equal(panel.shown, true, 'a released button toggles nothing');
	view.destroy();
	assert.equal(panel.destroyed, true);
	assert.equal(panel.listeners.size, 0);
	toggle.click();
	assert.equal(document.querySelector('dialog.bui-sheet'), null);
});
