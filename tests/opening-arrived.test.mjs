import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { OpeningExit } from '../src/opening/exit.js';

/**
 * 0.35.0: one public mark that the product has arrived, `data-bui-opened` on the document element, set once
 * the hand-over ended and the identity landed. happy-dom lays out nothing, so the flight's boxes are given
 * here; the opening's browser acceptance waits for the mark in a real engine (`acceptance/opening.mjs`).
 */
const page = new Page();
after(() => page.close());
beforeEach(() => {
	page.reset();
	document.documentElement.removeAttribute('data-bui-opened');
});

/** The opening's identity and a product's root whose family bar shows the lockup the identity lands on. */
function scene({ flight }) {
	const presentation = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'bui-opening' }));
	presentation.innerHTML = '<img class="bui-opening-wordmark"><span class="bui-opening-name">Projects</span>';
	const root = document.body.appendChild(document.createElement('div'));
	root.innerHTML = '<header class="bui-family"><img class="bui-lockup-mark"><span class="bui-lockup-name">Projects</span></header>';
	const moves = [];
	for (const node of [presentation, ...presentation.querySelectorAll('*')]) node.animate = keyframes => (moves.push(keyframes), { finished: Promise.resolve() });
	if (flight) for (const node of [...presentation.querySelectorAll('*'), ...root.querySelectorAll('.bui-lockup-mark, .bui-lockup-name')]) node.getBoundingClientRect = () => ({ top: 10, left: 10, right: 110, bottom: 40, width: 100, height: 30 });
	return { presentation, root, bar: root.querySelector('.bui-family'), moves };
}

test('the mark is one attribute of the document element, set by opened()', () => {
	assert.equal(OpeningExit.mark, 'data-bui-opened');
	assert.equal(document.documentElement.hasAttribute('data-bui-opened'), false);
	OpeningExit.opened();
	assert.equal(document.documentElement.getAttribute('data-bui-opened'), '');
});

test('landed resolves once the identity has landed and the bar\'s landing mark has gone; at once without a flight', async () => {
	const still = scene({ flight: false });
	const plain = new OpeningExit(still.presentation, still.root);
	await plain.run();
	assert.equal(still.bar.dataset.buiLanding, undefined, 'nothing landed on the bar');
	let done = false;
	await plain.landed.then(() => (done = true));
	assert.equal(done, true, 'at once');
	page.reset();
	// The flight reads the window's height, a global of the page the controller runs in
	globalThis.innerHeight = 800;
	const flying = scene({ flight: true });
	const exit = new OpeningExit(flying.presentation, flying.root);
	await exit.run();
	assert.equal(flying.bar.dataset.buiLanding, 'landed', 'the identity is on the bar');
	const started = Date.now();
	await exit.landed;
	assert.equal(flying.bar.dataset.buiLanding, undefined, 'the landing mark has gone when it resolves');
	assert.ok(Date.now() - started >= OpeningExit.fade * 2 - 20, 'after the bar\'s own parts showed');
	delete globalThis.innerHeight;
});
