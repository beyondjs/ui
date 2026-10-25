import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { OpeningFocus } from '../src/opening/focus.js';
import { OpeningExit } from '../src/opening/exit.js';

/**
 * 0.34.0: a focus the product asks for while the opening covers it lands when it shows. happy-dom hides
 * nothing and focuses any element, so a target that would not take the focus says so through its own
 * `focus`; the browser acceptance proves the hidden product and the hand-over (`acceptance/opening.mjs`).
 */
const page = new Page();
const { window } = page;
const native = { html: window.HTMLElement.prototype.focus, svg: window.SVGElement.prototype.focus };
after(() => page.close());
beforeEach(() => {
	page.reset();
	// No test leaves the platform's focus wrapped for the next
	assert.ok(window.HTMLElement.prototype.focus === native.html && window.SVGElement.prototype.focus === native.svg);
});

/** The opening's presentation with its Reload, and a product's root with its bar, title and an action. */
function scene() {
	const presentation = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'bui-opening' }));
	presentation.dataset.state = 'opening';
	presentation.animate = undefined;
	const reload = presentation.appendChild(Object.assign(document.createElement('button'), { textContent: 'Reload' }));
	const root = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'root' }));
	const title = root.appendChild(Object.assign(document.createElement('h1'), { textContent: 'Requests', tabIndex: -1 }));
	const approve = root.appendChild(Object.assign(document.createElement('button'), { textContent: 'Approve' }));
	return { presentation, reload, root, title, approve };
}

test('while it covers, the platform\'s focus of HTML and SVG elements is wrapped, each call going through; released, it is the platform\'s again', () => {
	const { presentation, title } = scene();
	const focus = new OpeningFocus(presentation, window);
	assert.ok(window.HTMLElement.prototype.focus !== native.html && window.SVGElement.prototype.focus !== native.svg);
	title.focus({ preventScroll: true });
	assert.ok(document.activeElement === title, 'the call still reaches the platform');
	const mark = document.body.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
	mark.focus();
	assert.deepEqual(focus.asked, [title, mark], 'both kept, the latest last');
	focus.release();
	assert.ok(window.HTMLElement.prototype.focus === native.html && window.SVGElement.prototype.focus === native.svg);
	title.focus();
	assert.deepEqual(focus.asked, [title, mark], 'nothing is kept once released');
});

test('the opening\'s own focus is the person\'s and the document itself is no destination: neither is kept', () => {
	const { presentation, reload, approve } = scene();
	const focus = new OpeningFocus(presentation, window);
	reload.focus();
	document.body.focus();
	document.documentElement.focus();
	approve.focus();
	approve.focus();
	assert.deepEqual(focus.asked, [approve], 'one entry per target');
	assert.throws(() => window.HTMLElement.prototype.focus.call(undefined), TypeError, 'a call on no element is the platform\'s to refuse');
	assert.deepEqual(focus.asked, [approve], 'and keeps nothing');
	for (let index = 0; index < OpeningFocus.kept + 2; index += 1) document.body.appendChild(document.createElement('button')).focus();
	assert.equal(focus.asked.length, OpeningFocus.kept, 'a bounded memory');
	assert.ok(!focus.asked.includes(approve), 'the oldest leave first');
	focus.release();
});

test('land gives the focus to the last target still in the page that takes it, with the options it was asked with', () => {
	const { presentation, approve } = scene();
	const seen = [];
	approve.focus = function (options) {
		seen.push(options);
		return window.HTMLElement.prototype.focus.call(this, options);
	};
	const focus = new OpeningFocus(presentation, window);
	approve.focus({ preventScroll: true });
	const gone = document.body.appendChild(document.createElement('button'));
	gone.focus();
	gone.remove();
	const refusing = document.body.appendChild(document.createElement('div'));
	refusing.focus();
	// A target the browser would not focus (hidden, disabled): its call lands nowhere
	refusing.focus = () => undefined;
	document.activeElement.blur();
	assert.equal(focus.land(), true);
	assert.ok(document.activeElement === approve, 'past one that left the page and one that takes no focus');
	assert.deepEqual(seen.at(-1), { preventScroll: true }, 'its own options');
	assert.ok(window.HTMLElement.prototype.focus === native.html, 'released before it lands');
	assert.equal(new OpeningFocus(presentation, window).land(), false, 'nothing asked, nothing lands');
});

test('a wrapper another script placed over it is left in place at release, and ours keeps nothing more', () => {
	const { presentation, title } = scene();
	const focus = new OpeningFocus(presentation, window);
	const ours = window.HTMLElement.prototype.focus;
	const calls = [];
	window.HTMLElement.prototype.focus = function (...args) {
		calls.push(this);
		return ours.apply(this, args);
	};
	const theirs = window.HTMLElement.prototype.focus;
	focus.release();
	assert.ok(window.HTMLElement.prototype.focus === theirs, 'not undone under another script');
	title.focus();
	assert.deepEqual(focus.asked, [], 'inert');
	assert.equal(calls.length, 1);
	window.HTMLElement.prototype.focus = native.html;
});

test('the hand-over lands what the product asked for where focus was nowhere, and over the generic destination for a person in recovery', async () => {
	for (const person of [false, true]) {
		page.reset();
		const { presentation, reload, root, approve } = scene();
		const focus = new OpeningFocus(presentation, window);
		approve.focus();
		if (person) reload.focus();
		else document.activeElement.blur();
		await new OpeningExit(presentation, root, focus).run();
		assert.equal(presentation.dataset.state, 'leaving');
		assert.ok(document.activeElement === approve, person ? 'the person in recovery gets the product\'s own destination' : 'the asked focus lands');
		assert.ok(window.HTMLElement.prototype.focus === native.html);
	}
});

test('a person in recovery with nothing asked keeps the generic destination; a focus in the product already and one asked after hand-over are untouched', async () => {
	let view = scene();
	view.reload.focus();
	await new OpeningExit(view.presentation, view.root, new OpeningFocus(view.presentation, window)).run();
	assert.ok(document.activeElement === view.title, 'the page\'s title, as before 0.34.0');
	page.reset();
	view = scene();
	const focus = new OpeningFocus(view.presentation, window);
	view.title.focus();
	view.approve.focus = () => undefined;
	const field = view.root.appendChild(document.createElement('input'));
	native.html.call(field);
	await new OpeningExit(view.presentation, view.root, focus).run();
	assert.ok(document.activeElement === field, 'focus already in the product stays where it is');
	assert.ok(window.HTMLElement.prototype.focus === native.html, 'released all the same');
	view.approve.focus = native.html;
	view.approve.focus();
	assert.deepEqual(focus.asked, [view.title], 'a focus asked for after hand-over is the platform\'s alone');
	assert.ok(document.activeElement === view.approve);
	page.reset();
	view = scene();
	view.reload.focus();
	await new OpeningExit(view.presentation, view.root).run();
	assert.ok(document.activeElement === view.title, 'an exit without a recorder keeps its 0.21.0 form');
});

test('land stops at the first call that moved the focus, a target that hands its focus on included, and never focuses earlier targets after it', () => {
	const { presentation, title, approve } = scene();
	const field = presentation.ownerDocument.body.appendChild(document.createElement('input'));
	const focus = new OpeningFocus(presentation, window);
	title.focus();
	approve.focus();
	document.activeElement.blur();
	// A target that sends its focus on when it takes it, as a composite widget hands it to its active part
	approve.addEventListener('focus', () => field.focus());
	const seen = [];
	title.addEventListener('focus', () => seen.push('title'));
	assert.equal(focus.land(), true);
	assert.ok(document.activeElement === field, 'where the last target sent it');
	assert.deepEqual(seen, [], 'the earlier title was never focused after it');
	page.reset();
	const again = scene();
	const holder = new OpeningFocus(again.presentation, window);
	again.approve.focus();
	native.html.call(again.approve);
	assert.equal(holder.land(), true, 'focus already on the target stops it at once');
	assert.ok(document.activeElement === again.approve);
});
