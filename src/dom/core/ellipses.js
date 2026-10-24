/**
 * A visible action is named whole (0.28.0, D179), checked while a product is developed: a shown button,
 * an element with the button role or a link styled as an action (`.bui-button`, `.bui-link-button`)
 * whose visible words end in "…" (or "...") outside a menu is named in a console warning, once per
 * action. Inside a menu, a listbox or the command palette the "…" stays: it says the entry asks for
 * more before it acts. A disabled or busy action is not checked, since a wait says "Saving…" while it
 * runs (a busy `Button`'s `{label}…`). It watches `root` for changes, once per frame, and never changes
 * the page.
 *
 * `Ellipses.enabled` is true in a development build (a bundler that defines `process.env.NODE_ENV` as
 * `development`), false otherwise; a `Page` starts one by itself while it is true, and a product may set
 * it or start one over its own root.
 */
export class Ellipses {
	/** The elements that act. */
	static actions = 'button, [role="button"], a.bui-button, a.bui-link-button';
	/** Where an entry's "…" belongs: menus, lists of options and the command palette. */
	static menus = '[role="menu"], [role="menubar"], [role="listbox"], [role="option"], [role^="menuitem"], .bui-palette';
	/** An action that waits says so with its words: not checked. */
	static #waiting = ':disabled, [aria-disabled="true"], [aria-busy="true"], [data-busy]';
	/** Whether pages check themselves: in a development build. */
	static enabled = Ellipses.#development();

	#root;
	#warn;
	#warned = new WeakSet();
	#observer = null;
	#frame = 0;

	/**
	 * @param {object} options
	 * @param {Element} options.root what is checked, with what is added to it later
	 * @param {(message: string, action: Element) => void} [options.warn] how an action is reported (`console.warn`)
	 */
	constructor({ root, warn = null }) {
		this.#root = root;
		this.#warn = warn ?? ((message, action) => console.warn(message, action));
		const view = root.ownerDocument?.defaultView;
		if (typeof view?.MutationObserver === 'function') {
			this.#observer = new view.MutationObserver(() => this.#soon(view));
			this.#observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'hidden', 'disabled', 'aria-disabled', 'aria-busy', 'data-busy'] });
		}
		this.check();
	}

	static #development() {
		try {
			return process.env.NODE_ENV === 'development';
		} catch {
			return false;
		}
	}

	/** The words a person sees on an element: its text, less what is only for assistive technology. */
	static words(node) {
		const walker = node.ownerDocument.createTreeWalker(node, 4);
		let text = '';
		for (let current = walker.nextNode(); current; current = walker.nextNode()) {
			if (!current.parentElement?.closest('.bui-hidden')) text += current.nodeValue;
		}
		return text.replace(/\s+/g, ' ').trim();
	}

	/** The shown actions outside a menu whose words end in "…", each reported once: `[{ action, text }]`. */
	check() {
		const found = [];
		const actions = [...(this.#root.matches?.(Ellipses.actions) ? [this.#root] : []), ...this.#root.querySelectorAll(Ellipses.actions)];
		for (const action of actions) {
			if (action.closest(Ellipses.menus) || action.closest('[hidden]') || action.matches(Ellipses.#waiting)) continue;
			const text = Ellipses.words(action);
			if (!/(…|\.\.\.)$/.test(text)) continue;
			found.push({ action, text });
			if (this.#warned.has(action)) continue;
			this.#warned.add(action);
			this.#warn(`@beyond-js/ui: the action "${text}" ends in "…" outside a menu; a visible action is named whole, its "…" only on a menu's entry (D179).`, action);
		}
		return found;
	}

	destroy() {
		this.#observer?.disconnect();
		this.#observer = null;
		if (this.#frame) this.#root.ownerDocument?.defaultView?.cancelAnimationFrame?.(this.#frame);
	}

	#soon(view) {
		if (this.#frame) return;
		const frame = view.requestAnimationFrame ?? (work => view.setTimeout(work, 16));
		this.#frame = frame(() => {
			this.#frame = 0;
			if (this.#observer) this.check();
		});
	}
}
