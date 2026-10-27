/**
 * A `DataTable`'s header row in the Tab order only while it is seen (0.41.0, D187): under 36rem of the table's own
 * width the stylesheet hides the header from sight and keeps it for assistive technology, so its sort buttons
 * leave the Tab order (`tabindex="-1"`) and focus never lands on a control nobody sees. The narrow form offers no
 * sorting of its own; a screen reader still reaches the buttons in the header. Measured on resize, and applied
 * again after each drawing of the rows.
 */
export class DataHead {
	#table;
	#observer = null;
	#narrow = false;

	/** @param {HTMLElement} table the `.bui-data-table` element, the container its narrow form is measured by */
	constructor(table) {
		this.#table = table;
		if (typeof ResizeObserver === 'function') {
			this.#observer = new ResizeObserver(() => this.measure());
			this.#observer.observe(table);
		}
	}

	/** Whether the header is hidden from sight now. */
	get narrow() {
		return this.#narrow;
	}

	/** Reads the table's width against the stylesheet's 36rem, and applies it when it changed. */
	measure() {
		const root = parseFloat(getComputedStyle(this.#table.ownerDocument.documentElement).fontSize) || 16;
		const narrow = this.#table.getBoundingClientRect().width <= 36 * root;
		if (narrow === this.#narrow) return;
		this.#narrow = narrow;
		this.apply();
	}

	/** Takes the header's buttons out of the Tab order while it is hidden, and gives them back when it shows. */
	apply() {
		for (const button of this.#table.querySelectorAll('thead button')) {
			if (this.#narrow) button.setAttribute('tabindex', '-1');
			else button.removeAttribute('tabindex');
		}
	}

	destroy() {
		this.#observer?.disconnect();
		this.#observer = null;
	}
}
