import { test, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

/**
 * A composer's one toolbar row (0.11.2): `ComposerFit` tries the chips as written, then shortened to their
 * value, then folded behind Options, by measured fit. happy-dom lays nothing out, so a small flow layout
 * stands in for the engine: each toolbar item has a width per level and wraps at the toolbar's width,
 * hidden as the stylesheet hides it. The real layout is proved in the browser acceptance (`folding.mjs`).
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

const prototype = page.window.HTMLElement.prototype;
const saved = { box: prototype.getBoundingClientRect, rects: prototype.getClientRects };
let layout = null;
afterEach(() => {
	prototype.getBoundingClientRect = saved.box;
	prototype.getClientRects = saved.rects;
	layout = null;
});

/** The widths of a toolbar's items at full and short levels, and where they wrap. */
class Flow {
	#composer;
	width;

	constructor(composer, width) {
		this.#composer = composer;
		this.width = width;
		const flow = this;
		prototype.getBoundingClientRect = function () {
			return flow.box(this);
		};
		prototype.getClientRects = function () {
			const box = flow.box(this);
			return box.width || box.height ? [box] : [];
		};
	}

	/** Whether the stylesheet shows `node` at the composer's level. */
	shown(node) {
		const root = this.#composer.element;
		const fold = root.dataset.fit === 'fold' && !root.hasAttribute('data-options');
		if (node.closest('[hidden]')) return false;
		if (node.matches('.bui-composer-more')) return root.dataset.fit === 'fold';
		if (fold && node.closest('.bui-composer-attach, .bui-composer-settings')) return false;
		return true;
	}

	/** An item's width at the composer's level. */
	size(node) {
		const short = Boolean(this.#composer.element.dataset.fit);
		if (node.matches('.bui-composer-more')) return 32;
		if (node.matches('.bui-composer-attach')) return 80;
		if (node.matches('.bui-chip')) return short ? 100 : 230;
		if (node.matches('.bui-composer-send')) return 70;
		if (node.matches('.bui-composer-stop')) return 110;
		return 0;
	}

	box(node) {
		const root = this.#composer.element;
		if (!root.isConnected || !root.contains(node)) return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
		if (node === root || node.matches('.bui-composer-bar, .bui-composer-box')) return { top: 0, bottom: 40, left: 0, right: this.width, width: this.width, height: 40 };
		const leaves = [...root.querySelectorAll('.bui-composer-more, .bui-composer-attach, .bui-chip, .bui-composer-stop, .bui-composer-send')].filter(item => this.shown(item));
		let x = 0;
		let row = 0;
		const places = new Map();
		for (const item of leaves) {
			const width = this.size(item);
			if (x && x + width > this.width) {
				row += 1;
				x = 0;
			}
			places.set(item, { top: row * 40, bottom: row * 40 + 32, left: x, right: x + width, width, height: 32 });
			x += width + 8;
		}
		return places.get(node) ?? { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
	}
}

const chip = (label, value) => new ui.ChoiceChip({ label, options: [{ value: 'a', label: value }, { value: 'b', label: 'Other' }], value: 'a' });
const attach = { onfiles: () => undefined };
const compose = (options = {}) => new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), settings: [chip('Model', 'GPT-6.1 Sol · Medium'), chip('Autonomy', 'Work in its folder')], attach, ...options }).mount(document.body);

test('a wide toolbar keeps every word; a narrower one shortens the chips to their value; a narrow one folds them behind Options', () => {
	const composer = compose();
	layout = new Flow(composer, 1000);
	composer.toolbar.measure();
	assert.equal(composer.toolbar.level, 'full');
	assert.equal(composer.element.hasAttribute('data-fit'), false);
	layout.width = 400;
	composer.toolbar.measure();
	assert.equal(composer.toolbar.level, 'short', 'two shortened chips, Attach and Send fit in 400');
	assert.equal(composer.element.dataset.fit, 'short');
	layout.width = 250;
	composer.toolbar.measure();
	assert.equal(composer.toolbar.level, 'fold', 'nothing but folding keeps one row');
	assert.ok(composer.fold.available);
	layout.width = 1000;
	composer.toolbar.measure();
	assert.equal(composer.toolbar.level, 'full', 'wider again, every word comes back');
	composer.destroy();
});

test('the actions keep their words: a running turn\'s Interrupt counts, and the fit folds only what it may', () => {
	const composer = compose({ stop: { label: 'Interrupt', run: () => undefined } });
	layout = new Flow(composer, 500);
	composer.toolbar.measure();
	assert.equal(composer.toolbar.level, 'short', '80 + 100 + 100 + 110 + 70 and the gaps fit in 500');
	composer.stop = null;
	layout.width = 300;
	composer.toolbar.measure();
	assert.equal(composer.toolbar.level, 'fold');
	composer.destroy();
});

test('with nothing to fold the toolbar stops at short; compact: false never adapts', () => {
	const bare = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), tools: [document.createElement('span')] }).mount(document.body);
	layout = new Flow(bare, 100);
	bare.toolbar.measure();
	assert.notEqual(bare.toolbar.level, 'fold', 'Options needs something to fold');
	assert.equal(bare.fold.available, false);
	bare.destroy();
	const fixed = compose({ compact: false });
	layout = new Flow(fixed, 250);
	fixed.toolbar.measure();
	assert.equal(fixed.element.hasAttribute('data-fit'), false);
	assert.equal(fixed.element.hasAttribute('data-compact'), false);
	fixed.destroy();
});

test('while Options is open or focused the level stays; it is decided again when it folds and when focus leaves it', async () => {
	const composer = compose();
	layout = new Flow(composer, 250);
	composer.toolbar.measure();
	assert.equal(composer.toolbar.level, 'fold');
	composer.fold.toggle(true);
	layout.width = 1000;
	composer.toolbar.measure();
	assert.equal(composer.toolbar.level, 'fold', 'what Options shows is never hidden by a trial');
	composer.fold.toggle(false);
	assert.equal(composer.toolbar.level, 'full', 'folded again, the fit is measured');
	layout.width = 250;
	composer.toolbar.measure();
	composer.fold.button.focus();
	layout.width = 1000;
	composer.toolbar.measure();
	assert.equal(composer.toolbar.level, 'fold', 'Options keeps focus');
	composer.field.focus();
	await page.until(() => composer.toolbar.level === 'full');
	composer.destroy();
});

test("a shortened chip's tooltip says its whole face; at full level it says nothing", () => {
	const composer = compose();
	layout = new Flow(composer, 1000);
	composer.toolbar.measure();
	const button = composer.element.querySelector('.bui-composer-settings .bui-choice-button');
	assert.equal(button.getAttribute('data-bui-tip'), 'Model: GPT-6.1 Sol · Medium');
	page.key(document.body, 'Tab');
	button.focus();
	assert.equal(document.querySelector('.bui-hint:not([hidden])'), null, 'the words are all shown');
	button.blur();
	layout.width = 400;
	composer.toolbar.measure();
	page.key(document.body, 'Tab');
	button.focus();
	const hint = document.querySelector('.bui-hint:not([hidden])');
	assert.equal(hint?.textContent, 'Model: GPT-6.1 Sol · Medium');
	assert.equal(hint.getAttribute('aria-hidden'), 'true', 'the name already says it');
	composer.destroy();
});

test("a chip's state goes into its tooltip with its word; Options says what sending uses beside its glyph", () => {
	const engine = new ui.ChoiceChip({ label: 'Autonomy', options: [{ value: 'a', label: 'Work in its folder', status: ['Not verified', 'neutral'] }], value: 'a', statement: false });
	const composer = new ui.Composer({ label: 'Message', onsubmit: () => Promise.resolve(), settings: [engine], summary: 'Opus 5.5' }).mount(document.body);
	assert.equal(engine.control.getAttribute('data-bui-tip'), 'Autonomy: Work in its folder · Not verified');
	assert.equal(engine.control.querySelector('.bui-chip-state').dataset.tone, 'neutral');
	const more = composer.fold.button;
	assert.equal(more.getAttribute('aria-label'), 'Options · Opus 5.5', 'the name holds the words it shows');
	assert.equal(more.querySelector('.bui-composer-summary').textContent, 'Opus 5.5');
	assert.ok(more.hasAttribute('data-summary'));
	composer.summary = null;
	assert.equal(more.getAttribute('aria-label'), 'Options');
	assert.equal(more.hasAttribute('data-summary'), false);
	composer.destroy();
	engine.destroy();
});

test('destroy releases the fit: no gauge left, nothing measured afterwards', () => {
	const composer = compose();
	layout = new Flow(composer, 250);
	const gauge = composer.element.querySelector('.bui-composer-gauge');
	assert.ok(gauge, 'the gauge across the composer');
	assert.equal(gauge.getAttribute('aria-hidden'), 'true');
	composer.destroy();
	assert.equal(composer.element.querySelector('.bui-composer-gauge'), null);
	composer.toolbar.measure();
	assert.equal(composer.element.hasAttribute('data-fit'), false);
});
