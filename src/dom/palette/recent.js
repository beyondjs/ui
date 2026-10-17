/**
 * The items a person opened from a palette last, kept on this device only (0.16.0): a convenience,
 * never a record. Only items with an address are kept (`{ id, label, detail, glyph, href, source }`),
 * at most `limit`, newest first; storage that is missing or refuses (a private window) keeps nothing
 * and never fails the palette.
 */
export class PaletteRecent {
	#key;
	#limit;
	#storage;

	/**
	 * @param {object} options
	 * @param {string} options.key what the items belong to (the product's id)
	 * @param {number} [options.limit] items kept (6)
	 * @param {Storage|null} [options.storage] where they are kept (`localStorage` by default)
	 */
	constructor({ key, limit = 6, storage = undefined }) {
		this.#key = `bui-palette:${key}`;
		this.#limit = limit;
		try {
			this.#storage = storage === undefined ? (globalThis.localStorage ?? null) : storage;
		} catch {
			this.#storage = null;
		}
	}

	/** The items kept, newest first. */
	get items() {
		try {
			const items = JSON.parse(this.#storage?.getItem(this.#key) ?? '[]');
			return Array.isArray(items) ? items.filter(item => item && item.id && item.href).slice(0, this.#limit) : [];
		} catch {
			return [];
		}
	}

	/** Keeps an opened item first; an item without an address is not kept. */
	keep(item, source = null) {
		if (!item?.id || !item.href) return;
		const kept = { id: String(item.id), label: String(item.label ?? ''), detail: item.detail ? String(item.detail) : null, glyph: item.glyph ?? null, href: item.href, source };
		const items = [kept, ...this.items.filter(other => other.id !== kept.id)].slice(0, this.#limit);
		try {
			this.#storage?.setItem(this.#key, JSON.stringify(items));
		} catch {
			// A full or refused storage keeps nothing
		}
	}
}
