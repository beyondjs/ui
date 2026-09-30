/**
 * An in-memory `Storage` for `Preferences`: `getItem`, `setItem`, `removeItem` and the keys written.
 * With `refuse` every access throws, as a browser does when site data is blocked.
 */
export class Shelf {
	#items = new Map();
	#refuse;

	constructor({ refuse = false } = {}) {
		this.#refuse = refuse;
	}

	get keys() {
		return [...this.#items.keys()];
	}

	getItem(key) {
		this.#check();
		return this.#items.has(key) ? this.#items.get(key) : null;
	}

	setItem(key, value) {
		this.#check();
		this.#items.set(key, String(value));
	}

	removeItem(key) {
		this.#check();
		this.#items.delete(key);
	}

	#check() {
		if (this.#refuse) throw new Error('The operation is insecure.');
	}
}
