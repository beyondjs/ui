/**
 * The paste recognizer of a picker (0.7.0, CNT-93, design S2 2.8): text typed or pasted into the search
 * field that the product recognizes, such as a repository's address (`https://github.com/acme/web`,
 * `git@github.com:acme/web.git` or `acme/web`), becomes a search or a direct match instead of a
 * literal query.
 *
 * The product's `recognize(text)` answers null, or `{ label, id?, match?, query?, value? }`: `label` is
 * the parsed value as a person reads it ("acme/web"), never the raw text; `query` what to search
 * instead of the text; `id`, or `match(item)` when the address does not carry the id, finds the result
 * to choose when the list holds it; `value` is anything the product needs to act on it (`{ owner,
 * name }`). After the search, `settle(list)` says what happened: `picked` (the
 * result was chosen), `refused` (it is listed and cannot be chosen) or `missing` (it is not in this
 * list, so the product offers its own way, such as adding a public repository by its address).
 */
export class Recognizer {
	#recognize;
	#current = null;
	#settled = false;

	/** @param {((text: string) => ({label: string, id?: string, match?: (item: object) => boolean, query?: string, value?: unknown}|null))|null} recognize */
	constructor(recognize) {
		this.#recognize = recognize;
	}

	/** What the text in the search field was recognized as, or null. */
	get current() {
		return this.#current;
	}

	/** Whether the recognition was already settled on the answer to its query (0.7.4): a later page, a retry or a removal never chooses it again. */
	get settled() {
		return this.#settled;
	}

	/** Reads the field's text. Returns the query to search with. */
	read(text) {
		const trimmed = String(text ?? '').trim();
		let found = null;
		try {
			found = trimmed && this.#recognize ? this.#recognize(trimmed) : null;
		} catch {
			found = null;
		}
		this.#settled = false;
		this.#current = found?.label ? { label: String(found.label), id: found.id ?? null, match: typeof found.match === 'function' ? found.match : null, query: found.query ?? null, value: found.value ?? null } : null;
		return this.#current?.query ?? trimmed;
	}

	/** Forgets what was recognized (the field was cleared). */
	clear() {
		this.#current = null;
		this.#settled = false;
	}

	/**
	 * After the search answered: `{ outcome, item }` for the recognized text, or null when nothing was
	 * recognized. `items` are the results listed.
	 */
	settle(items) {
		const current = this.#current;
		if (!current) return null;
		this.#settled = true;
		const test = current.match ?? (current.id !== null ? item => String(item.id) === String(current.id) : null);
		const item = test ? (items.find(entry => Recognizer.#safe(test, entry)) ?? null) : null;
		if (!item) return { outcome: 'missing', item: null };
		return { outcome: item.disabled ? 'refused' : 'picked', item };
	}

	static #safe(test, item) {
		try {
			return Boolean(test(item));
		} catch {
			return false;
		}
	}
}
