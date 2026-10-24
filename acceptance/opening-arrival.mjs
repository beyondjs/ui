import assert from 'node:assert/strict';

/**
 * How a product arrives (0.31.0, D185), against the fixture's `?regions` page, whose structure is drawn at
 * once with a region waiting for its first read: a quick product arrives once, complete, the opening
 * covering its structure while that read runs and saying no steps meanwhile; a read slower than the
 * budget is shown at the budget with its wait in place; an opening that already said its steps hands over
 * at the structure; and with motion, the identity lands on a bar that shows nothing through it, even drawn
 * again during the landing.
 */
export class OpeningArrival {
	#open;
	#steps;

	/**
	 * @param {{ open: Function, steps: Function }} specs the acceptance's page opener and its steps reader
	 */
	constructor({ open, steps }) {
		this.#open = open;
		this.#steps = steps;
	}

	/** The checks, each returning when it passed */
	get checks() {
		return [() => this.#complete(), () => this.#budget(), () => this.#said(), () => this.#landing()];
	}

	/** Whether the opening still covers the product, and what it says */
	static #covered(page) {
		return page.evaluate(() => ({ opening: document.getElementById('bui-opening')?.dataset.state ?? null, product: getComputedStyle(document.getElementById('root')).visibility, steps: document.querySelector('.bui-opening-steps')?.hidden === false }));
	}

	/** The bar's parts as they are seen: its landing mark, the wordmark, each name, the separator and the chevron */
	static #bar(page) {
		return page.evaluate(() => {
			const bar = document.querySelector('.bui-family');
			const seen = (node, pseudo) => getComputedStyle(node, pseudo);
			return {
				landing: bar.dataset.buiLanding ?? null,
				mark: seen(bar.querySelector('.bui-lockup-mark')).visibility,
				names: [...bar.querySelectorAll('.bui-lockup-name')].map(node => seen(node).visibility),
				separator: seen(bar.querySelector('.bui-family-product'), '::before').opacity,
				chevron: seen(bar.querySelector('.bui-navmenu-button > .bui-icon')).opacity
			};
		});
	}

	/** The structure waits under the opening while its first read runs; the product then shows once, complete */
	async #complete() {
		const { context, page, release } = await this.#open({ hold: '**/content', path: '/?regions' });
		try {
			await page.waitForFunction(() => document.querySelector('#root h1'));
			assert.deepEqual(await OpeningArrival.#covered(page), { opening: 'opening', product: 'hidden', steps: false }, 'the structure is drawn under the opening');
			await page.clock.fastForward(900);
			assert.deepEqual(await OpeningArrival.#covered(page), { opening: 'opening', product: 'hidden', steps: false }, 'past the steps’ reveal, an opening that covers a drawn structure says no steps');
			release();
			await page.locator('#bui-opening').waitFor({ state: 'detached' });
			assert.equal(await page.locator('#content').textContent(), 'Two projects');
			assert.equal(await page.locator('.bui-waiting').count(), 0, 'the product shows once, complete: its wait was never seen');
			const kept = JSON.parse(await page.evaluate(() => localStorage.getItem('opening-fixture.opening')));
			assert.deepEqual(Object.keys(kept).sort(), ['interface', 'session'], 'the steps measured are the opening’s own');
			assert.ok(kept.session[0] < 500, `the session ended at its structure, not when the page's read answered: ${kept.session[0]} ms`);
		} finally {
			await context.close();
		}
	}

	/** A first read slower than the budget: the product is shown at the budget with its wait in place */
	async #budget() {
		const { context, page } = await this.#open({ hold: '**/content', path: '/?regions' });
		try {
			await page.waitForFunction(() => document.querySelector('#root h1'));
			await page.clock.fastForward(900);
			assert.equal((await OpeningArrival.#covered(page)).opening, 'opening', 'within the budget');
			await page.clock.fastForward(200);
			await page.locator('#bui-opening').waitFor({ state: 'detached' });
			assert.equal(await page.locator('#root').evaluate(node => getComputedStyle(node).visibility), 'visible');
			assert.equal(await page.locator('.bui-waiting').count(), 1, 'the region says it waits, in its place');
			assert.equal(await page.locator('#root h1').textContent(), 'Your projects');
		} finally {
			await context.close();
		}
	}

	/** An opening that already said its steps hands over as soon as the structure is drawn: its region's wait says the rest */
	async #said() {
		const { context, page, release } = await this.#open({ path: '/?regions' });
		try {
			// The region's read never answers here: what is checked is that nothing waits for it
			await page.route('**/content', () => {});
			await page.clock.fastForward(900);
			assert.deepEqual(await this.#steps(page), ['done Cargando Projects', 'active Confirmando tu sesión']);
			release();
			await page.locator('#bui-opening').waitFor({ state: 'detached' });
			assert.equal(await page.locator('.bui-waiting').count(), 1, 'handed over at the structure, with the region still waiting');
		} finally {
			await context.close();
		}
	}

	/** With motion: the stage fades in, and the identity lands on a bar that shows nothing through it, even drawn again */
	async #landing() {
		const { context, page, release } = await this.#open({ theme: 'dark', width: 1280, motion: 'no-preference', clock: false, hold: '**/content', path: '/?regions&redraw' });
		try {
			await page.waitForFunction(() => document.querySelector('#root h1'));
			assert.equal(await page.locator('.bui-opening-stage').evaluate(node => getComputedStyle(node).animationName), 'bui-opening-in', 'the identity fades in rather than popping onto the page');
			release();
			await page.waitForFunction(() => document.querySelector('.bui-family')?.dataset.buiLanding === 'flight' && 'redrawn' in document.querySelector('.bui-family').dataset);
			assert.deepEqual(await OpeningArrival.#bar(page), { landing: 'flight', mark: 'hidden', names: ['hidden'], separator: '0', chevron: '0' }, 'one wordmark and one name are seen, the moving ones, with no separator or chevron through them, after the bar drew its brand again');
			await page.locator('#bui-opening').waitFor({ state: 'detached', timeout: 2000 });
			await page.waitForFunction(() => !('buiLanding' in document.querySelector('.bui-family').dataset));
			assert.deepEqual(await OpeningArrival.#bar(page), { landing: null, mark: 'visible', names: ['visible'], separator: '1', chevron: '1' }, 'on landing the bar’s own parts show where the moving ones arrived');
			assert.equal(await page.locator('#content').textContent(), 'Two projects', 'the complete page');
		} finally {
			await context.close();
		}
	}
}
