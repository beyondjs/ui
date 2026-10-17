import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * `Floating` (0.15.0, DQ-01 and OWN-21): one placement for every floating surface. Flip, shift and size
 * against a room that excludes the sticky family bar and follows the visual viewport, a caret as anchor,
 * the top layer, updates on scroll, an anchor scrolled away, and a hidden anchor refused with a reason a
 * folded composer answers. happy-dom does not lay out: the tests give the rectangles a browser would.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const box = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top });
const frame = () => new Promise(resolve => page.window.requestAnimationFrame(() => resolve()));

/** A surface of a given size against an anchor at a given box, inside `parent`. */
const setup = ({ anchor = box(100, 300, 80, 32), size = [200, 190], parent = document.body, ...options } = {}) => {
	const button = document.createElement('button');
	const surface = document.createElement('div');
	parent.append(button, surface);
	let at = anchor;
	button.getBoundingClientRect = () => at;
	surface.getBoundingClientRect = () => box(0, 0, ...size);
	const floating = new ui.Floating(surface, { anchor: button, ...options });
	return { button, surface, floating, move: next => (at = next) };
};

/** The family bar, sticky at the top: 44 px high. */
const bar = () => {
	const header = document.createElement('header');
	header.className = 'bui-header bui-family';
	header.getBoundingClientRect = () => box(0, 0, 1024, 44);
	document.body.append(header);
	return header;
};

test('it opens below, flips above without room, is shifted inside and capped to the room on its side', () => {
	let { surface, floating } = setup({ anchor: box(900, 700, 80, 32) });
	assert.equal(floating.show(), true);
	assert.equal(floating.side, 'above', 'no room below, more above');
	assert.deepEqual([surface.style.left, surface.style.top], ['816px', '506px'], '8 px inside the right edge, 4 px above the anchor');
	assert.ok(surface.hasAttribute('data-bui-floating'));
	assert.equal(surface.style.getPropertyValue('--bui-anchor-width'), '80px', 'a list as wide as its button can read it');
	floating.hide();
	({ surface, floating } = setup({ anchor: box(100, 300, 80, 32), size: [200, 600], align: 'end' }));
	floating.show();
	assert.equal(floating.side, 'below', 'below has more room');
	assert.equal(surface.style.maxHeight, '424px', 'capped to the room below, 8 px from the edge');
	assert.equal(surface.style.left, '8px', 'aligned to the end, then shifted back inside');
	floating.hide();
});

test('the room excludes the sticky family bar: a menu that would climb over the headings opens below it or is capped under it', () => {
	bar();
	const { surface, floating } = setup({ anchor: box(100, 60, 80, 32), size: [200, 300], placement: 'above' });
	floating.show();
	assert.equal(floating.side, 'below', 'a preferred side with no room under the bar flips (the model chip of OWN-21)');
	assert.equal(surface.style.top, '96px');
	floating.hide();
	const tall = setup({ anchor: box(100, 700, 80, 32), size: [200, 700] });
	tall.floating.show();
	assert.equal(tall.floating.side, 'above');
	assert.equal(tall.surface.style.maxHeight, '644px', 'capped to the room between the bar and the anchor');
	assert.equal(tall.surface.style.top, '52px', 'its top stays 8 px under the bar, never under it');
	tall.floating.hide();
});

test("the bar's own menus keep the room under the bar, and a product can mark another edge", () => {
	const header = bar();
	const own = setup({ anchor: box(900, 6, 32, 32), size: [300, 200], parent: header, align: 'end' });
	own.floating.show();
	assert.equal(own.surface.style.top, '42px', 'an anchor inside the bar is not pushed by it');
	own.floating.hide();
	const dock = document.createElement('div');
	dock.setAttribute('data-bui-edge', '');
	dock.getBoundingClientRect = () => box(0, 668, 1024, 100);
	document.body.append(dock);
	const above = setup({ anchor: box(100, 500, 80, 32), size: [200, 160] });
	above.floating.show();
	assert.equal(above.floating.side, 'above', 'a docked edge at the bottom is room it does not cover');
	above.floating.hide();
});

test('the visual viewport is the room: a phone keyboard shrinks it', () => {
	Object.defineProperty(page.window, 'visualViewport', { value: { offsetLeft: 0, offsetTop: 0, width: 390, height: 400, addEventListener() {}, removeEventListener() {} }, configurable: true });
	try {
		const { surface, floating } = setup({ anchor: box(300, 300, 60, 32), size: [200, 150] });
		floating.show();
		assert.equal(floating.side, 'above', 'below the anchor is under the keyboard');
		assert.equal(surface.style.left, '182px', 'shifted inside the 390 px viewport');
		floating.hide();
	} finally {
		delete page.window.visualViewport;
	}
});

test('a caret is an anchor: a virtual rectangle with the field as its context', () => {
	const field = document.createElement('textarea');
	document.body.append(field);
	const surface = document.createElement('ul');
	document.body.append(surface);
	surface.getBoundingClientRect = () => box(0, 0, 240, 120);
	const caret = { contextElement: field, getBoundingClientRect: () => box(340, 200, 0, 22) };
	const floating = new ui.Floating(surface, { anchor: caret });
	assert.equal(floating.show(), true);
	assert.deepEqual([surface.style.left, surface.style.top], ['340px', '226px'], 'at the line being typed, not under the whole composer');
	floating.hide();
});

test('it is placed again on scroll and resize while open, once per frame, and an anchor scrolled away hides it', async () => {
	bar();
	const { surface, floating, move } = setup({ anchor: box(100, 300, 80, 32) });
	floating.show();
	assert.equal(surface.style.top, '336px');
	move(box(100, 250, 80, 32));
	document.dispatchEvent(new page.window.Event('scroll'));
	page.window.dispatchEvent(new page.window.Event('resize'));
	await frame();
	assert.equal(surface.style.top, '286px', 'it follows its anchor');
	move(box(100, 0, 80, 32));
	document.dispatchEvent(new page.window.Event('scroll'));
	await frame();
	assert.ok(surface.hasAttribute('data-bui-away'), 'an anchor under the bar hides it');
	move(box(100, 200, 80, 32));
	document.dispatchEvent(new page.window.Event('scroll'));
	await frame();
	assert.equal(surface.hasAttribute('data-bui-away'), false, 'back in view');
	floating.hide();
	move(box(100, 500, 80, 32));
	document.dispatchEvent(new page.window.Event('scroll'));
	await frame();
	assert.equal(surface.style.top, '236px', 'closed, it no longer listens');
});

test('the top layer: a manual popover while open, where the browser has the API', () => {
	const prototype = page.window.HTMLElement.prototype;
	const calls = [];
	prototype.showPopover = function () { calls.push(['show', this]); };
	prototype.hidePopover = function () { calls.push(['hide', this]); };
	const original = globalThis.HTMLElement;
	try {
		const { surface, floating } = setup();
		floating.show();
		assert.equal(surface.getAttribute('popover'), 'manual');
		assert.deepEqual(calls.map(([kind]) => kind), ['show']);
		assert.equal(ui.Floating.top, true);
	} finally {
		delete prototype.showPopover;
		delete prototype.hidePopover;
		globalThis.HTMLElement = original;
	}
});

test('a hidden anchor is refused with its reason; a container that shows it retries; nobody answering is warned', () => {
	const holder = document.createElement('div');
	holder.style.display = 'none';
	document.body.append(holder);
	const { surface, floating } = setup({ parent: holder });
	const warned = [];
	const warn = console.warn;
	console.warn = message => warned.push(message);
	try {
		assert.equal(floating.show(), false, 'nothing opens for an anchor that is not drawn');
		assert.equal(surface.hasAttribute('data-bui-floating'), false);
		assert.equal(warned.length, 1, 'the developer is told why');
		let reason = null;
		floating.retry = () => floating.show();
		holder.addEventListener('bui-refused', event => {
			reason = event.detail.reason;
			event.preventDefault();
			holder.style.display = '';
			event.detail.retry();
		});
		assert.equal(floating.show(), false, 'this call was refused…');
		assert.equal(reason, 'hidden');
		assert.equal(floating.open, true, '…and the retry opened it once the container showed it');
		assert.equal(warned.length, 1, 'a handled refusal warns nobody');
	} finally {
		console.warn = warn;
		floating.hide();
	}
});

test('menus, choices and disclosures say whether they opened; a chip folded behind Options unfolds and opens (DQ-01)', () => {
	const model = new ui.ChoiceChip({ label: 'Model', options: [{ value: 'a', label: 'Opus 5.5' }, { value: 'b', label: 'Sonnet 5' }], value: 'a' });
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), settings: [model] }).mount(document.body);
	composer.fold.available = true;
	// The stylesheet hides folded settings (`display: none`); happy-dom does not recompute it here, so the chip says it.
	model.control.checkVisibility = () => composer.fold.open;
	assert.equal(composer.fold.open, false);
	assert.equal(model.open(), true, 'the product\'s /model opens the chip');
	assert.equal(composer.fold.open, true, 'Options showed the settings first');
	assert.equal(model.expanded, true);
	model.close();
	composer.destroy();
	model.destroy();
	const hidden = document.createElement('div');
	hidden.style.display = 'none';
	document.body.append(hidden);
	const menu = new ui.ActionMenu({ label: 'More', items: [{ label: 'Rename' }] }).mount(hidden);
	const warn = console.warn;
	console.warn = () => {};
	try {
		assert.equal(menu.open(), false);
		assert.equal(menu.expanded, false);
		assert.equal(menu.element.querySelector('[role="menu"]').hidden, true);
	} finally {
		console.warn = warn;
	}
	hidden.style.display = '';
	assert.equal(menu.open(), true);
	menu.destroy();
});

test("a hint shown by a touch press leaves out the shortcut; a keyboard focus keeps it", () => {
	const root = document.createElement('div');
	const button = document.createElement('button');
	button.setAttribute('aria-label', 'Search');
	button.setAttribute('data-bui-hint', '');
	button.setAttribute('data-bui-shortcut', '⌘K');
	root.append(button);
	document.body.append(root);
	const hint = new ui.Hint(root);
	hint.show(button);
	assert.equal(hint.element.textContent, 'Search · ⌘K');
	hint.hide();
	button.dispatchEvent(new page.window.PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
	assert.equal(hint.element.textContent, 'Search', 'no key offered on a touch screen');
	assert.ok(hint.element.hasAttribute('data-bui-floating'), 'placed by Floating');
	hint.destroy();
});
