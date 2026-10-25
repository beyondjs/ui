import assert from 'node:assert/strict';

/**
 * A focus the product asks for while the opening covers it (0.35.0), against the fixture's `?focus=` pages,
 * whose structure focuses its title or its Approve button at its first paint: the hidden product takes no
 * focus meanwhile, and what it asked for lands at the hand-over; the platform's `focus()` is its own again
 * once the product shows, so a focus asked for later is untouched; and a person in the opening's recovery
 * keeps their focus there while covered and gets the product's own destination when it arrives.
 */
export class OpeningFocusing {
	#open;

	/**
	 * @param {{ open: Function }} specs the acceptance's page opener
	 */
	constructor({ open }) {
		this.#open = open;
	}

	/** The checks, each returning when it passed */
	get checks() {
		return [() => this.#landed('title', 'Your projects'), () => this.#landed('button', 'Approve'), () => this.#recovery()];
	}

	/** Where focus is, whether the opening covers the product, and whether the platform's own `focus()` is in place */
	static #state(page) {
		return page.evaluate(() => {
			const node = document.activeElement;
			return { focused: node === document.body ? 'body' : `${node.localName}:${node.textContent.trim()}`, opening: document.getElementById('bui-opening')?.dataset.state ?? null, product: getComputedStyle(document.getElementById('root')).visibility, native: HTMLElement.prototype.focus.toString().includes('[native code]') };
		});
	}

	/** The structure focuses its title or its button while covered: hidden, it takes no focus; shown, it has it */
	async #landed(focus, words) {
		const { context, page, release } = await this.#open({ hold: '**/content', path: `/?regions&focus=${focus}` });
		try {
			await page.waitForFunction(() => document.querySelector('#root h1'));
			const covered = await OpeningFocusing.#state(page);
			assert.deepEqual({ ...covered, focused: covered.focused === 'body' }, { focused: true, opening: 'opening', product: 'hidden', native: false }, `while covered the hidden ${focus} took no focus and the asked focus is kept: ${JSON.stringify(covered)}`);
			release();
			await page.locator('#bui-opening').waitFor({ state: 'detached' });
			const shown = await OpeningFocusing.#state(page);
			const tag = focus === 'title' ? 'h1' : 'button';
			assert.deepEqual(shown, { focused: `${tag}:${words}`, opening: null, product: 'visible', native: true }, `the ${focus} has the focus once the product shows, and the platform's focus is its own`);
			if (focus === 'button') {
				await page.evaluate(() => document.querySelector('#root h1').setAttribute('tabindex', '-1'));
				await page.evaluate(() => document.querySelector('#root h1').focus());
				assert.equal((await OpeningFocusing.#state(page)).focused, 'h1:Your projects', 'a focus asked for after hand-over is the platform’s alone');
			}
		} finally {
			await context.close();
		}
	}

	/** A person who focused the recovery's Reload keeps it while covered, and gets the product's own destination at its arrival */
	async #recovery() {
		const { context, page, release } = await this.#open({ path: '/?focus=button' });
		try {
			await page.clock.fastForward(12300);
			const reload = page.getByRole('button', { name: 'Volver a cargar', exact: true });
			await reload.waitFor();
			await reload.focus();
			// The product asks for a focus of its own while the person is in recovery: hidden, it cannot take theirs
			await page.evaluate(() => {
				const early = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Early' });
				document.getElementById('root').append(early);
				early.focus();
			});
			assert.equal((await OpeningFocusing.#state(page)).focused, 'button:Volver a cargar', 'the person keeps their focus on Reload while the product is covered');
			release();
			await page.locator('#bui-opening').waitFor({ state: 'detached' });
			const shown = await OpeningFocusing.#state(page);
			assert.deepEqual(shown, { focused: 'button:Approve', opening: null, product: 'visible', native: true }, 'their focus goes to the product’s own destination, not the generic title');
		} finally {
			await context.close();
		}
	}
}
