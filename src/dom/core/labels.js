/**
 * Interface copy of one component.
 *
 * Products localize: each component takes a `labels` option whose entries replace the English
 * defaults it declares. An entry is a string with `{name}` placeholders or a function of the values,
 * which is how a consumer writes plurals and word order for its own language.
 */
export class Labels {
	#entries;

	constructor(defaults, given = {}) {
		this.#entries = { ...defaults, ...(given ?? {}) };
	}

	/** The text of one entry with its values applied. Unknown entries return their key. */
	text(key, values = {}) {
		const entry = this.#entries[key];
		if (typeof entry === 'function') return String(entry(values));
		if (entry === undefined || entry === null) return key;
		return String(entry).replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match));
	}

	/** A copy with further entries replaced. */
	with(given) {
		return new Labels(this.#entries, given);
	}
}
