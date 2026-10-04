/**
 * A carried draft (D56, shared piece 7): the context a "New …" action carries in its address, so the
 * page it opens starts from the place the person came from instead of asking again.
 *
 * `new Draft({ environment, provider, agent, from, for })` keeps the known keys whose values are short
 * identifiers (letters, digits, `.`, `_`, `:` and `-`, up to 128 characters) and drops anything else;
 * `address(base)` writes them into an address, and `Draft.read(address)` restores them. An address
 * routed in its hash (`#/org/project/…?add=…`) carries them in the hash's query, any other in its
 * search, and `read` looks in both, the hash first. `for` falls back to `from` (the product that asked
 * is the product the task is for, CNT-12). Values are hints, never authority: the page that reads them
 * checks each against what the person may see before using it.
 */
export class Draft {
	/** The keys a draft carries. */
	static keys = Object.freeze(['environment', 'provider', 'agent', 'from', 'for']);
	static #pattern = /^[\w.:-]{1,128}$/;

	#values;

	/** @param {Record<string, string|null|undefined>} [values] */
	constructor(values = {}) {
		const kept = Draft.keys.flatMap(key => {
			const value = values?.[key];
			return typeof value === 'string' && Draft.#pattern.test(value) ? [[key, value]] : [];
		});
		this.#values = Object.freeze(Object.fromEntries(kept));
	}

	/** The carried values, frozen; `for` is the product the task is for, else the one it came from. */
	get values() {
		const values = this.#values;
		return values.for || !values.from ? values : Object.freeze({ ...values, for: values.from });
	}

	/** Whether nothing is carried. */
	get empty() {
		return !Object.keys(this.#values).length;
	}

	/**
	 * `base` with the carried values in its query: the hash's query for an address routed in its hash,
	 * else the search. Values already in `base` under the same keys are replaced; other parameters stay.
	 */
	address(base) {
		const url = new URL(base, 'http://draft.invalid/');
		const routed = url.hash.startsWith('#/');
		const [path, query = ''] = routed ? url.hash.slice(1).split(/\?(.*)/s) : [null, url.search.slice(1)];
		const params = new URLSearchParams(query);
		for (const key of Draft.keys) params.delete(key);
		for (const [key, value] of Object.entries(this.#values)) params.set(key, value);
		const text = params.toString();
		if (routed) url.hash = `${path}${text ? `?${text}` : ''}`;
		else url.search = text;
		const relative = !/^[a-z][a-z\d+.-]*:/i.test(base) && !String(base).startsWith('//');
		return relative ? `${url.pathname === '/' && !String(base).startsWith('/') ? '' : url.pathname}${url.search}${url.hash}` : url.href;
	}

	/** The draft an address carries (a string, a `URL` or a `Location`); unknown and malformed values are dropped. */
	static read(address) {
		const url = new URL(String(address?.href ?? address ?? ''), 'http://draft.invalid/');
		const hash = url.hash.startsWith('#/') ? new URLSearchParams(url.hash.slice(1).split(/\?(.*)/s)[1] ?? '') : null;
		const values = {};
		for (const key of Draft.keys) values[key] = hash?.get(key) ?? url.searchParams.get(key);
		return new Draft(values);
	}
}
