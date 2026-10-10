/**
 * Which groups of a sidebar's entries the person folded (0.14.0, D97), kept per device and product:
 * one `localStorage` entry per group, `bui-sidebar:{product}:{group}`, written only when the person
 * folds or opens one (and when a group that needs the person opens by itself). Storage that throws or
 * is absent (a private window, blocked site data) keeps the choice for the page only. The permanent
 * sidebar and its drawer draw the same groups: both hear every change.
 */
export class SidebarFolds {
	static prefix = 'bui-sidebar';

	#product;
	#storage;
	#kept = new Map();
	#listeners = new Set();

	/**
	 * @param {object} options
	 * @param {string} options.product the product's name, part of each key
	 * @param {Window|null} [options.view] the window whose `localStorage` keeps the choices
	 */
	constructor({ product, view = null }) {
		this.#product = String(product ?? '');
		this.#storage = SidebarFolds.#open(view);
	}

	/** The storage key of a group. */
	key(group) {
		return `${SidebarFolds.prefix}:${this.#product}:${group}`;
	}

	/** Whether the group is folded: the person's kept choice, else open. */
	folded(group) {
		if (this.#kept.has(group)) return this.#kept.get(group);
		let value = false;
		try {
			value = this.#storage?.getItem(this.key(group)) === 'folded';
		} catch {
			value = false;
		}
		this.#kept.set(group, value);
		return value;
	}

	/** Keeps a group folded or open and tells every copy. */
	keep(group, folded) {
		const value = Boolean(folded);
		if (this.folded(group) === value) return;
		this.#kept.set(group, value);
		try {
			if (value) this.#storage?.setItem(this.key(group), 'folded');
			else this.#storage?.removeItem(this.key(group));
		} catch {
			// The choice holds for this page only
		}
		for (const listener of [...this.#listeners]) listener(group, value);
	}

	/** Calls `listener(group, folded)` after every change; returns the release. */
	subscribe(listener) {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}

	destroy() {
		this.#listeners.clear();
	}

	static #open(view) {
		try {
			return view?.localStorage ?? null;
		} catch {
			return null;
		}
	}
}
