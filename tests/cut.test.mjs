import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { lengthy } from './fixtures/family.mjs';

/**
 * D44 as amended: a user-written name may be cut in a closed control only while its whole text shows
 * on hover and keyboard focus, and it is whole in the opened menu. happy-dom does not lay out, so the
 * measurements are given to the elements; the browser acceptance measures them for real.
 */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => page.reset());

/** Makes an element measure as cut (or not) to its box. */
const measure = (node, cut) => {
	Object.defineProperty(node, 'clientWidth', { value: 100, configurable: true });
	Object.defineProperty(node, 'scrollWidth', { value: cut ? 240 : 100, configurable: true });
};
const shown = () => [...document.querySelectorAll('.bui-tooltip')].filter(node => !node.hidden);
const pointer = (node, type) => node.dispatchEvent(new PointerEvent(type, { bubbles: false, pointerType: 'mouse' }));

test('Tooltip: `when` is asked each time it would show, and it shows only while that returns true', () => {
	const button = document.body.appendChild(document.createElement('button'));
	let allowed = false;
	const tip = new ui.Tooltip(button, { text: 'Northwind Creative Studio', describe: false, when: () => allowed });
	tip.show();
	assert.equal(tip.shown, false);
	allowed = true;
	tip.show();
	assert.equal(tip.shown, true);
	assert.equal(tip.element.getAttribute('aria-hidden'), 'true');
	tip.destroy();
});

test('the family bar shows a cut organization or project name whole on hover and keyboard focus, and none that fits', async () => {
	const bar = new ui.FamilyBar({ product: 'delegate', brand: { src: '/w.svg', href: '/' }, descriptor: lengthy, account: { signout: () => {} } }).mount(document.body);
	const button = bar.element.querySelector('.bui-family-wide [data-part="project"] .bui-navmenu-button');
	const place = button.querySelector('.bui-family-place');
	assert.equal(button.getAttribute('aria-label'), 'Project: Storefront redesign for the spring catalogue. Change project', 'the accessible name carries the whole name');
	measure(place, false);
	button.focus();
	assert.equal(shown().length, 0, 'a name that fits shows no tooltip');
	button.blur();
	measure(place, true);
	button.focus();
	assert.deepEqual(shown().map(node => node.textContent), ['Storefront redesign for the spring catalogue']);
	assert.equal(shown()[0].getAttribute('aria-hidden'), 'true', 'not heard twice');
	button.blur();
	assert.equal(shown().length, 0);
	pointer(button, 'pointerenter');
	assert.equal(shown().length, 1, 'on hover too');
	pointer(button, 'pointerleave');
	await page.until(() => !shown().length);
	// Opened, the menu lists the name whole and the tooltip stays away.
	button.click();
	button.focus();
	assert.equal(shown().length, 0, 'no tooltip over the open menu');
	const rows = [...bar.element.querySelectorAll('.bui-family-wide [data-part="project"] .bui-navmenu-label')].map(node => node.textContent);
	assert.ok(rows.includes('Storefront redesign for the spring catalogue'), 'the open menu holds the whole name');
	bar.destroy();
	assert.equal(document.querySelectorAll('.bui-tooltip').length, 0, 'destroying the bar removes its tooltips');
});

test('the opened menus wrap names: no ellipsis on a menu row, an option or a chip', async () => {
	const { readFileSync } = await import('node:fs');
	const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
	for (const selector of ['.bui-navmenu-label', '.bui-option-label', '.bui-chip-label', '.bui-choice-value', '.bui-choice-name']) {
		const rules = [...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, list]) => list.split(',').map(part => part.trim()).includes(selector));
		assert.ok(rules.length, selector);
		for (const [, , body] of rules) assert.doesNotMatch(body, /text-overflow|white-space:\s*nowrap/, selector);
		// The choice menu's names inherit their wrapping from `.bui-choice-item > *`.
		if (selector !== '.bui-choice-name') assert.ok(rules.some(([, , body]) => /overflow-wrap:\s*anywhere/.test(body)), `${selector} wraps`);
	}
});

test('Select: the chosen text shows whole while the select cuts it, measured in its own font', () => {
	const saved = page.window.HTMLCanvasElement.prototype.getContext;
	// A canvas that measures 8 px per character, as the browser measures in the select's font.
	page.window.HTMLCanvasElement.prototype.getContext = () => ({ font: '', measureText: text => ({ width: text.length * 8 }) });
	const select = new ui.Select({ options: [{ value: 'a', label: 'Short' }, { value: 'b', label: 'A very long environment name' }], value: 'b' }).mount(document.body);
	const control = select.control;
	Object.defineProperty(control, 'clientWidth', { value: 120, configurable: true });
	assert.equal(document.querySelectorAll('.bui-tooltip').length, 0, 'nothing is added before the select is looked at');
	control.focus();
	assert.deepEqual(shown().map(node => node.textContent), ['A very long environment name']);
	control.blur();
	select.value = 'a';
	control.focus();
	assert.equal(shown().length, 0, 'a chosen text that fits shows none');
	select.destroy();
	assert.equal(document.querySelectorAll('.bui-tooltip').length, 0);
	page.window.HTMLCanvasElement.prototype.getContext = saved;
});

test('Select: without a canvas to measure, nothing is claimed cut', () => {
	const select = new ui.Select({ options: [{ value: 'b', label: 'A very long environment name' }] }).mount(document.body);
	select.control.focus();
	assert.equal(shown().length, 0);
	select.destroy();
});
