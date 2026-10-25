/**
 * Focus a product asks for while the opening covers it (0.34.0). On a first load the opening keeps the
 * product `visibility: hidden` until it hands over, so that neither Tab, a pointer nor a screen reader
 * reaches a product the person cannot see; and a hidden element takes no focus, so a product's own
 * `element.focus()` meanwhile (a router's focus on a page's title, an arrival's on the action it names)
 * was lost silently.
 *
 * For the cover's lifetime only, the platform's `focus()` of HTML and SVG elements is wrapped: every call
 * still goes to the platform, and one aimed at the product, not at the opening (whose Reload is the
 * person's) nor at the document itself, is kept with its options. At hand-over the platform's own is
 * restored, and `land()` gives the focus to the last target kept that is still in the page and takes
 * it, with the options it was asked with (`preventScroll`). Nothing is kept after hand-over: a focus
 * asked for later is the platform's alone.
 */
export class OpeningFocus {
	/** The targets kept at most, the latest last */
	static kept = 8;

	#element;
	#asked = [];
	#wrapped = [];
	#live = true;

	/**
	 * @param {HTMLElement} element the presentation (`#bui-opening`): a focus inside it is the person's own
	 * @param {Window} [view] the window whose element prototypes are wrapped
	 */
	constructor(element, view = globalThis) {
		this.#element = element;
		for (const type of [view.HTMLElement, view.SVGElement]) this.#wrap(type?.prototype);
	}

	/** The targets kept, the latest last. */
	get asked() {
		return this.#asked.map(entry => entry.target);
	}

	/** Restores the platform's `focus()` and keeps nothing more; a wrapper another script placed over it is left in place, inert. */
	release() {
		this.#live = false;
		for (const { prototype, focus, wrapper } of this.#wrapped) if (prototype.focus === wrapper) prototype.focus = focus;
		this.#wrapped = [];
	}

	/**
	 * Releases the platform's `focus()`, then gives the focus to the last target kept that is still in the
	 * page and takes it, with its options; true when one did.
	 */
	land() {
		this.release();
		for (const { target, options } of [...this.#asked].reverse()) {
			if (!target.isConnected) continue;
			target.focus(options);
			if (target.getRootNode().activeElement === target) return true;
		}
		return false;
	}

	#wrap(prototype) {
		if (!prototype || !Object.hasOwn(prototype, 'focus')) return;
		const focus = prototype.focus;
		const opening = this;
		const wrapper = function (...args) {
			opening.#keep(this, args[0]);
			return focus.apply(this, args);
		};
		prototype.focus = wrapper;
		this.#wrapped.push({ prototype, focus, wrapper });
	}

	#keep(target, options) {
		// Only an element of the product: the opening's own focus is the person's, and the document itself no
		// destination; a call on anything else is left to the platform, which refuses it
		if (!this.#live || target?.nodeType !== 1 || this.#element.contains(target)) return;
		const document = this.#element.ownerDocument;
		if (target === document.body || target === document.documentElement) return;
		this.#asked = this.#asked.filter(entry => entry.target !== target);
		this.#asked.push({ target, options });
		if (this.#asked.length > OpeningFocus.kept) this.#asked.shift();
	}
}
