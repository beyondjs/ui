import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Stillness } from '../src/dom/core/stillness.js';
import { Leaving } from '../src/dom/core/leaving.js';
import { OpeningExit } from '../src/opening/exit.js';

/**
 * A product's chosen Reduced holds in the package's scripted motion (since 0.47.0): with
 * `data-motion="reduced"` on the document root and the system asking for full motion, the opening hands over with
 * no animation and a closed surface leaves no picture, as under the system's setting (D95). happy-dom lays out
 * nothing, so the flight's boxes are given; the browser acceptance's opening check measures it in each engine.
 */
const page = new Page();
after(() => page.close());
beforeEach(() => {
	page.reset();
	delete document.documentElement.dataset.motion;
	document.documentElement.removeAttribute('data-bui-opened');
});

/** A window whose system setting says `reduce` (or not), with a document root carrying `motion` (or not). */
const view = (reduce, motion) => ({
	matchMedia: query => ({ matches: reduce && query === Stillness.query }),
	document: { documentElement: { dataset: motion ? { motion } : {} } }
});

test('Stillness: the system\'s setting or the root\'s data-motion="reduced" asks for less motion; "full" never overrides the system', () => {
	assert.equal(Stillness.asked(view(false, null)), false);
	assert.equal(Stillness.asked(view(true, null)), true);
	assert.equal(Stillness.asked(view(false, 'reduced')), true);
	assert.equal(Stillness.asked(view(false, 'full')), false);
	assert.equal(Stillness.asked(view(true, 'full')), true, 'only less motion is honored');
	assert.equal(Stillness.asked(view(false, 'system')), false);
	assert.equal(Stillness.asked(null), false, 'no window, no setting');
	assert.equal(Stillness.asked({}), false, 'a window without matchMedia or a document');
});

/** The opening's identity and a product's root whose family bar shows the lockup the identity lands on. */
function scene() {
	const presentation = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'bui-opening' }));
	presentation.innerHTML = '<img class="bui-opening-wordmark"><span class="bui-opening-name">Beyond Home</span><div class="bui-opening-veil"></div><div class="bui-opening-steps"></div>';
	const root = document.body.appendChild(document.createElement('div'));
	root.innerHTML = '<header class="bui-family"><img class="bui-lockup-mark"><span class="bui-lockup-name">Beyond Home</span></header>';
	const moves = [];
	for (const node of [presentation, ...presentation.querySelectorAll('*')]) node.animate = keyframes => (moves.push(keyframes), { finished: Promise.resolve() });
	for (const node of [...presentation.querySelectorAll('*'), ...root.querySelectorAll('.bui-lockup-mark, .bui-lockup-name')]) node.getBoundingClientRect = () => ({ top: 10, left: 10, right: 110, bottom: 40, width: 100, height: 30 });
	return { presentation, root, moves };
}

test('OpeningExit: a product\'s chosen Reduced hands over with no animation', async () => {
	globalThis.innerHeight = 800;
	try {
		const moving = scene();
		await new OpeningExit(moving.presentation, moving.root).run();
		assert.ok(moving.moves.length > 0, 'with motion allowed, the identity flies and the rest fades');
		page.reset();
		document.documentElement.dataset.motion = 'reduced';
		const still = scene();
		const exit = new OpeningExit(still.presentation, still.root);
		assert.equal(exit.moving, false);
		await exit.run();
		await exit.landed;
		assert.deepEqual(still.moves, [], 'no Web Animation runs');
		assert.equal(still.root.querySelector('.bui-family').dataset.buiLanding, undefined, 'nothing waits on the bar');
	} finally {
		delete globalThis.innerHeight;
	}
});

test('Leaving: under a product\'s chosen Reduced a closed surface leaves no picture', () => {
	const menu = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'bui-menu' }));
	menu.style.position = 'absolute';
	const picture = Leaving.play(menu);
	assert.ok(picture, 'with motion allowed, a picture leaves');
	picture.remove();
	document.documentElement.dataset.motion = 'reduced';
	assert.equal(Leaving.play(menu), null);
	assert.equal(document.querySelectorAll('.bui-menu').length, 1, 'only the surface itself');
});
