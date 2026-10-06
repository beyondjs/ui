/**
 * The page while the person reads without a session: everything stays readable and selectable, and a
 * press on something that would act (a button, a submit) opens the sign-in again instead of failing.
 *
 * Exempt are the family bar, dialogs and side sheets, disclosures and menus that only show more
 * (`aria-expanded`, `aria-haspopup`), tabs, and anything a product marks `data-session="free"` (a copy
 * button, a filter that reads what is already loaded). Links are never stopped: a read that needs the
 * session is held by `Session.lost()` like any other. The document's root carries
 * `data-session="reading"` while it lasts, for a product's own styles.
 */
export class Guard {
	static FREE = '.bui-family, dialog, .bui-sheet, [aria-expanded], [aria-haspopup], [role="tab"], [data-session="free"]';
	static ACTS = 'button, [role="button"], input[type="submit"], input[type="button"], input[type="image"]';

	#document;
	#onblock;
	#active = false;
	#press = event => this.#stop(event, event.target?.closest?.(Guard.ACTS));
	#submit = event => this.#stop(event, event.target);

	/**
	 * @param {object} options
	 * @param {Document} options.document
	 * @param {() => void} options.onblock what a stopped press does (opens the sign-in again)
	 */
	constructor({ document, onblock }) {
		this.#document = document;
		this.#onblock = onblock;
	}

	get active() {
		return this.#active;
	}

	set active(value) {
		const next = Boolean(value);
		if (next === this.#active) return;
		this.#active = next;
		const root = this.#document.documentElement;
		if (next) {
			this.#document.addEventListener('click', this.#press, true);
			this.#document.addEventListener('submit', this.#submit, true);
			root.dataset.session = 'reading';
		} else {
			this.#document.removeEventListener('click', this.#press, true);
			this.#document.removeEventListener('submit', this.#submit, true);
			if (root.dataset.session === 'reading') delete root.dataset.session;
		}
	}

	#stop(event, target) {
		if (!target || target.closest?.(Guard.FREE)) return;
		event.preventDefault();
		event.stopImmediatePropagation();
		this.#onblock();
	}
}
