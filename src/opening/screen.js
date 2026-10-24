/**
 * The product's first screen, as the opening waits for it (0.31.0, D185). Once the product's root is
 * drawn with no step pending, that is its structure; the screen is complete when nothing in it waits
 * for a first read any more: no region's wait (`waiting`, `Section` and React's `Waiting`), no
 * placeholder (`skeleton`, a `Collection`'s or a `DataTable`'s), and a family bar that has loaded. A
 * wait in a part that is not drawn (a closed panel) does not count.
 *
 * The opening keeps covering an incomplete screen for at most `budget` milliseconds after its
 * structure, so a quick product arrives once, complete, instead of passing through its structure and
 * its waits in a fraction of a second; a slower one is shown at the budget with each region's wait in
 * place (LOAD-01), and its waits say the rest.
 */
export class OpeningScreen {
	/** Milliseconds the opening covers an incomplete screen after its structure is drawn (engineering default) */
	static budget = 1000;
	/** What still waits on a first screen: a region's first read, a placeholder, the family bar's read */
	static waits = '.bui-waiting, .bui-skeleton, .bui-family[data-state="loading"]';

	#since = null;
	#timer = 0;

	/**
	 * Whether the opening keeps covering `root`: something drawn still waits for its first read and the
	 * budget has not run out. The budget starts the first time a structure is asked about.
	 */
	holds(root, now = performance.now()) {
		if (![...root.querySelectorAll(OpeningScreen.waits)].some(OpeningScreen.#drawn)) return false;
		this.#since ??= now;
		return now - this.#since < OpeningScreen.budget;
	}

	/** Milliseconds left of the budget: all of it before the structure, none once it ran out */
	get left() {
		return this.#since === null ? OpeningScreen.budget : Math.max(0, OpeningScreen.budget - (performance.now() - this.#since));
	}

	/** Calls `check` once the budget runs out, in place of an earlier call */
	watch(check) {
		clearTimeout(this.#timer);
		this.#timer = setTimeout(check, this.left);
	}

	/**
	 * The product named a step again (it left for a sign-in, it reads its session again), or the opening
	 * ended: no call is due, and a next structure starts a new budget
	 */
	reset() {
		this.#since = null;
		clearTimeout(this.#timer);
	}

	/** Drawn, even while the opening hides the product: not inside something hidden or not displayed */
	static #drawn(node) {
		return typeof node.checkVisibility === 'function' ? node.checkVisibility() : node.getClientRects().length > 0;
	}
}
