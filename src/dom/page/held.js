/**
 * The focus of a page's title while it waits for its object's read (0.44.0, LOAD-01). A product focuses
 * the H1 after a navigation so reading starts there and a screen reader says the page's name; while the
 * title is a placeholder that name would be "Loading…". So, while held, the H1 is out of focus (no
 * `tabindex`) and a `focus()` asked of it, by `PageHeader.focus()` or by a product's own router calling
 * `heading.focus()`, is kept rather than lost. On `release()` the H1 is focusable again and a kept focus
 * lands, with the options it was asked with, unless the person moved on meanwhile.
 *
 * The H1's own `focus` is shadowed for the wait only, so it covers a router that holds the element itself
 * (a React `headingRef`); `release()` removes the shadow and the platform's `focus()` answers again.
 */
export class HeldFocus {
	#heading;
	#held = false;
	/** What a focus asked for while held found focused, and its options; null when none is owed */
	#owed = null;

	/** @param {HTMLElement} heading the page's H1 */
	constructor(heading) {
		this.#heading = heading;
	}

	/** Whether the title waits. */
	get held() {
		return this.#held;
	}

	/** Takes the H1 out of focus and keeps a focus asked of it until `release()`. */
	hold() {
		if (this.#held) return;
		this.#held = true;
		this.#heading.removeAttribute('tabindex');
		Object.defineProperty(this.#heading, 'focus', { configurable: true, writable: true, value: options => this.#owe(options) });
	}

	/** Makes the H1 focusable again; a focus asked for meanwhile lands now, unless the person moved on. */
	release() {
		if (!this.#held) return;
		this.#held = false;
		delete this.#heading.focus;
		this.#heading.setAttribute('tabindex', '-1');
		const owed = this.#owed;
		this.#owed = null;
		if (!owed || !this.#heading.isConnected) return;
		const { activeElement: active, body } = this.#heading.ownerDocument;
		if (!active || active === body || active === owed.active) this.#heading.focus(owed.options);
	}

	/** Ends the hold without landing a kept focus, when the title goes away (its header destroyed or unmounted). */
	drop() {
		this.#owed = null;
		if (!this.#held) return;
		this.#held = false;
		delete this.#heading.focus;
		this.#heading.setAttribute('tabindex', '-1');
	}

	#owe(options) {
		const document = this.#heading.ownerDocument;
		this.#owed = { active: document.activeElement ?? document.body, options };
	}
}
