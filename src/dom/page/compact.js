/**
 * When a page header's compact line shows (0.11.0): once the header has scrolled out of view under the
 * family bar, the line (sticky at the same place, out of the page's flow, so nothing shifts) shows the
 * title and the one status. It is measured on scroll and resize, at most once per animation frame,
 * against the line's own sticky top; `data-shown` on the line's holder says it. Scrolls of any
 * ancestor count, since the listener is on the window in the capture phase.
 */
export class PageCompact {
	#header;
	#bar;
	#view;
	#frame = 0;
	#done = false;
	#onchange;
	#measure = () => this.#schedule();

	/**
	 * @param {object} options
	 * @param {HTMLElement} options.header the page's `<header>`
	 * @param {HTMLElement} options.bar the compact line's holder (`.bui-page-compact`)
	 * @param {(shown: boolean) => void} [options.onchange] the line showed or hid
	 */
	constructor({ header, bar, onchange = null }) {
		this.#header = header;
		this.#bar = bar;
		this.#onchange = onchange;
		this.#view = header.ownerDocument.defaultView;
		this.#view?.addEventListener('scroll', this.#measure, { capture: true, passive: true });
		this.#view?.addEventListener('resize', this.#measure, { passive: true });
		this.#schedule();
	}

	/** Whether the compact line is shown. */
	get shown() {
		return this.#bar.hasAttribute('data-shown');
	}

	/** Decides now whether the header is out of view (also after a product moved it). */
	measure() {
		if (this.#done) return;
		if (!this.#header.isConnected || !this.#bar.isConnected) return this.#show(false);
		const top = parseFloat(this.#view.getComputedStyle(this.#bar).top) || 0;
		this.#show(this.#header.getBoundingClientRect().bottom <= top);
	}

	destroy() {
		this.#done = true;
		this.#view?.removeEventListener('scroll', this.#measure, { capture: true });
		this.#view?.removeEventListener('resize', this.#measure);
		if (this.#frame) this.#view?.cancelAnimationFrame?.(this.#frame);
		this.#frame = 0;
	}

	#schedule() {
		if (this.#frame || !this.#view) return;
		const later = this.#view.requestAnimationFrame?.bind(this.#view) ?? (callback => this.#view.setTimeout(callback, 0));
		this.#frame = later(() => {
			this.#frame = 0;
			this.measure();
		});
	}

	#show(shown) {
		if (shown === this.shown) return;
		this.#bar.toggleAttribute('data-shown', shown);
		this.#onchange?.(shown);
	}
}
