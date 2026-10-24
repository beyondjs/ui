import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { OpeningScreen } from '../src/opening/screen.js';

/**
 * 0.31.0 (D185): the product's first screen, as the opening waits for it. happy-dom draws nothing, so a
 * part that is not drawn says so through `checkVisibility()` here; the browser acceptance proves it with
 * real layout (`acceptance/opening.mjs`).
 */
const page = new Page();
after(() => page.close());

/** A product's root in the document, holding the given markup; `undrawn` parts answer that they are not drawn */
function root(markup, undrawn = '') {
	const element = document.body.appendChild(document.createElement('div'));
	element.innerHTML = markup;
	for (const part of undrawn ? element.querySelectorAll(undrawn) : []) part.checkVisibility = () => false;
	return element;
}

test('a structure with nothing waiting is complete at once, and the budget never starts', () => {
	const screen = new OpeningScreen();
	assert.equal(screen.holds(root('<header class="bui-family" data-state="ready"></header><h1>Home</h1><p>Two projects</p>'), 0), false);
	assert.equal(screen.left, OpeningScreen.budget, 'all of the budget before a structure waits');
});

test('a region waiting for its first read holds the screen within the budget, from the first time it is asked', () => {
	const screen = new OpeningScreen();
	const drawn = root('<h1>Home</h1><section aria-busy="true"><div class="bui-waiting"><p role="status">Loading…</p></div></section>');
	assert.equal(screen.holds(drawn, 500), true, 'the budget starts here');
	assert.equal(screen.holds(drawn, 500 + OpeningScreen.budget - 1), true);
	assert.equal(screen.holds(drawn, 500 + OpeningScreen.budget), false, 'shown at the budget, with its wait in place');
	drawn.querySelector('.bui-waiting').replaceWith(Object.assign(document.createElement('p'), { textContent: 'Nothing needs you.' }));
	const fresh = new OpeningScreen();
	assert.equal(fresh.holds(drawn, 0), false, 'complete as soon as the content replaced its wait');
});

test('what is left of the budget counts from the structure, in the page’s time', () => {
	const screen = new OpeningScreen();
	assert.equal(screen.holds(root('<div class="bui-waiting"></div>')), true);
	assert.ok(screen.left <= OpeningScreen.budget && screen.left > OpeningScreen.budget - 100, String(screen.left));
});

test('every shared wait counts: a placeholder, a collection’s or table’s placeholder rows and the family bar’s read', () => {
	for (const markup of ['<div class="bui-skeleton"></div>', '<div class="bui-collection-body" aria-busy="true"><div class="bui-skeleton bui-skeleton-table"></div></div>', '<header class="bui-family" data-state="loading"></header>']) {
		assert.equal(new OpeningScreen().holds(root(markup), 0), true, markup);
	}
	assert.equal(new OpeningScreen().holds(root('<header class="bui-family" data-state="ready"></header><p class="bui-loading" role="status">Opening the conversation…</p>'), 0), false, 'a loading line answers an action, not a first read');
});

test('a wait in a part that is not drawn, such as a closed panel, holds nothing', () => {
	const screen = new OpeningScreen();
	assert.equal(screen.holds(root('<h1>Projects</h1><div class="bui-navmenu-panel" hidden><div class="bui-skeleton"></div></div>', '.bui-skeleton'), 0), false);
	assert.equal(screen.left, OpeningScreen.budget);
});

test('a product that names a step again starts a new budget for its next structure', () => {
	const screen = new OpeningScreen();
	const drawn = root('<div class="bui-waiting"></div>');
	assert.equal(screen.holds(drawn, 0), true);
	assert.equal(screen.holds(drawn, OpeningScreen.budget), false);
	screen.reset();
	assert.equal(screen.left, OpeningScreen.budget);
	assert.equal(screen.holds(drawn, 5000), true, 'counted again from the new structure');
	assert.equal(screen.holds(drawn, 5000 + OpeningScreen.budget), false);
});

test('the screen asks again once its budget runs out, once, and not after a reset', t => {
	t.mock.timers.enable({ apis: ['setTimeout'] });
	const screen = new OpeningScreen();
	const calls = [];
	screen.watch(() => calls.push('first'));
	screen.watch(() => calls.push('second'));
	t.mock.timers.tick(OpeningScreen.budget - 1);
	assert.deepEqual(calls, [], 'not before the budget');
	t.mock.timers.tick(1);
	assert.deepEqual(calls, ['second'], 'the latest call replaced the earlier one');
	screen.watch(() => calls.push('third'));
	screen.reset();
	t.mock.timers.tick(OpeningScreen.budget);
	assert.deepEqual(calls, ['second'], 'nothing is due after a reset');
});

test('the budget is the engineering default the guides name', () => {
	assert.equal(OpeningScreen.budget, 1000);
	assert.equal(OpeningScreen.waits, '.bui-waiting, .bui-skeleton, .bui-family[data-state="loading"]');
});
