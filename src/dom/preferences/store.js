/**
 * The device copy of a person's preferences: `{ appearance, locale }` as JSON under one key, and
 * nothing else. Storage may be missing, full or refuse access (a private window, blocked site data):
 * every access is guarded, a failed read answers nothing, and a failed write is skipped.
 */
export class Store {
	#key;
	#storage;

	/**
	 * @param {string} key
	 * @param {Storage|null|undefined} storage `undefined` uses `localStorage` when it can be reached
	 */
	constructor(key, storage) {
		this.#key = key;
		this.#storage = storage === undefined ? Store.#local() : storage;
	}

	/** The saved `{ appearance, locale }`, or null when there is none or it cannot be read. */
	read() {
		try {
			const saved = JSON.parse(this.#storage?.getItem(this.#key) ?? 'null');
			return saved && typeof saved === 'object' ? { appearance: saved.appearance ?? null, locale: saved.locale ?? null } : null;
		} catch {
			return null;
		}
	}

	/** Saves the two values; nothing else is ever written. */
	write({ appearance, locale }) {
		try {
			this.#storage?.setItem(this.#key, JSON.stringify({ appearance, locale }));
		} catch {
			// Storage refused: the values stay in effect for this page only.
		}
	}

	static #local() {
		try {
			return globalThis.localStorage ?? globalThis.window?.localStorage ?? null;
		} catch {
			return null;
		}
	}
}
