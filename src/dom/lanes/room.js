/**
 * The titles' room in a `Lanes` block (0.41.0): in its one-line form a lane's title is cut only once nothing
 * else can give way. When a title would be cut, the block folds its trace first, then its kind (`data-fold`
 * on the block: `trace`, then `trace kind`), and keeps the first fold that lets every title show whole, or
 * the last one. It measures again only when the block's width, its columns or what its lanes say (their
 * depth, titles, kinds and facts) has changed, and once the fonts arrive; folding changes only the columns
 * inside the block, never its width, so it never measures in a loop. Under 40rem the block has neither column, so nothing folds there. A folded kind stays in the
 * lane's name for assistive technology and in its tooltip (D44).
 */
export class LaneRoom {
	#block;
	#cut;
	#said;
	#observer = null;
	#last = null;

	/**
	 * @param {HTMLElement} block the `.bui-lanes` element
	 * @param {{cut: () => boolean, said: () => string}} lanes whether any lane's title is cut now, and what the lanes say (their depth, titles, kinds and facts)
	 */
	constructor(block, { cut, said }) {
		this.#block = block;
		this.#cut = cut;
		this.#said = said;
		if (typeof ResizeObserver === 'function') {
			this.#observer = new ResizeObserver(() => this.fit());
			this.#observer.observe(block);
		}
		block.ownerDocument.fonts?.ready?.then(() => this.fit(true));
	}

	/** Folds what it must, and only that, for the titles shown now; nothing when the width, the columns and the words are as before, unless `again`. */
	fit(again = false) {
		const block = this.#block;
		if (!block.isConnected) return;
		const width = block.getBoundingClientRect().width;
		const columns = ['trace', 'kind'].filter(column => block.hasAttribute(`data-${column}`));
		// Every column the block has, its facts' included, takes room from the titles
		const present = ['trace', 'kind', 'facts'].filter(column => block.hasAttribute(`data-${column}`));
		const state = `${width}|${present.join(' ')}|${this.#said()}`;
		if (!again && state === this.#last) return;
		this.#last = state;
		block.removeAttribute('data-fold');
		if (!this.#wide(width)) return;
		for (let count = 1; count <= columns.length && this.#cut(); count++) block.dataset.fold = columns.slice(0, count).join(' ');
	}

	destroy() {
		this.#observer?.disconnect();
		this.#observer = null;
	}

	/** Whether the block draws one line a lane: 40rem of its width or more, as its container query says. */
	#wide(width) {
		const root = parseFloat(getComputedStyle(this.#block.ownerDocument.documentElement).fontSize) || 16;
		return width >= 40 * root;
	}
}
