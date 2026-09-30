/**
 * The device copy of a person's preferences: the values in effect on this device, `{ appearance,
 * locale }`, and the account's values last applied here (`account`, the same two fields), as JSON
 * under one key, and nothing else: never an account identifier. Storage may be missing, full or refuse access (a private window, blocked site data):
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

	/**
	 * The saved `{ appearance, locale, account }`, or null when there is none or it cannot be read.
	 * `account` is null in a copy written before the account's values were remembered.
	 */
	read() {
		try {
			const saved = JSON.parse(this.#storage?.getItem(this.#key) ?? 'null');
			if (!saved || typeof saved !== 'object') return null;
			const account = saved.account && typeof saved.account === 'object' ? Store.#pair(saved.account) : null;
			return { ...Store.#pair(saved), account };
		} catch {
			return null;
		}
	}

	/** Saves the values in effect and the account's values last applied; nothing else is ever written. */
	write({ appearance, locale }, account = null) {
		try {
			const copy = { appearance, locale, account: account ? Store.#pair(account) : null };
			this.#storage?.setItem(this.#key, JSON.stringify(copy));
		} catch {
			// Storage refused: the values stay in effect for this page only.
		}
	}

	static #pair({ appearance = null, locale = null }) {
		return { appearance: appearance ?? null, locale: locale ?? null };
	}

	static #local() {
		try {
			return globalThis.localStorage ?? globalThis.window?.localStorage ?? null;
		} catch {
			return null;
		}
	}
}
