/**
 * The search of a sidebar's entries, shared by the permanent sidebar and its drawer: what the person
 * typed, the bounded request to the product's `source({ query, signal })` and its answer, which the
 * views of both copies draw.
 *
 * Typing waits `delay` milliseconds (250) before asking; a newer query aborts the older request, whose
 * late answer is ignored. A request that takes longer than `bound` (20 s, D40) is aborted and, like a
 * failure, makes the search `unavailable` (never "nothing matches"); `retry()` asks again at once. The
 * source answers `{ items, more? }` or an array of entries. The states are `idle` (no query),
 * `searching`, `results`, `none` and `unavailable`.
 */
export class SidebarSearch {
	#config;
	#query = '';
	#state = 'idle';
	#items = [];
	#timer = null;
	#controller = null;
	#sequence = 0;
	#listeners = new Set();

	/**
	 * @param {{label: string, source: (request: {query: string, signal: AbortSignal}) => Promise<unknown>, bound?: number, delay?: number, all?: ((query: string) => string|null)|null, placeholder?: string|null}} config
	 */
	constructor(config) {
		this.config = config;
	}

	get config() {
		return this.#config;
	}

	/** Replaces the source and the words; a running search keeps its query. */
	set config(value) {
		if (typeof value?.source !== 'function') throw new TypeError("A sidebar's search asks its source({ query, signal })");
		// An option given as undefined keeps its default
		const given = Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
		this.#config = { bound: 20_000, delay: 250, all: null, placeholder: null, ...given };
	}

	get query() {
		return this.#query;
	}

	get state() {
		return this.#state;
	}

	/** The entries of the last answer. */
	get items() {
		return this.#items;
	}

	/** The address of every result for the query, when the product gives one ("See all results"). */
	get all() {
		if (!this.#query) return null;
		try {
			return this.#config.all?.(this.#query) ?? null;
		} catch {
			return null;
		}
	}

	/** Calls `listener(search)` after every change; returns the release. */
	subscribe(listener) {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}

	/** Takes what the person typed: an empty text ends the search, any other asks after the delay. */
	type(text) {
		const query = String(text ?? '').trim();
		if (query === this.#query && this.#state !== 'idle') return;
		if (!query) return this.clear();
		this.#query = query;
		this.#cancel();
		this.#state = 'searching';
		this.#notify();
		this.#timer = setTimeout(() => this.#ask(), this.#config.delay);
	}

	/** Asks again at once, after a failure. */
	retry() {
		if (!this.#query) return;
		this.#cancel();
		this.#state = 'searching';
		this.#notify();
		this.#ask();
	}

	/** Ends the search: the groups come back. */
	clear() {
		this.#cancel();
		this.#sequence += 1;
		const changed = this.#state !== 'idle';
		this.#query = '';
		this.#state = 'idle';
		this.#items = [];
		if (changed) this.#notify();
	}

	destroy() {
		this.#cancel();
		this.#listeners.clear();
	}

	async #ask() {
		this.#timer = null;
		const sequence = ++this.#sequence;
		const controller = new AbortController();
		this.#controller = controller;
		let bound = null;
		const late = new Promise((resolve, reject) => {
			bound = setTimeout(() => {
				controller.abort();
				reject(new Error('The search did not answer in time'));
			}, this.#config.bound);
		});
		try {
			const answer = await Promise.race([Promise.resolve().then(() => this.#config.source({ query: this.#query, signal: controller.signal })), late]);
			if (sequence !== this.#sequence) return;
			this.#items = (Array.isArray(answer) ? answer : (answer?.items ?? [])).filter(Boolean);
			this.#state = this.#items.length ? 'results' : 'none';
		} catch {
			if (sequence !== this.#sequence) return;
			this.#items = [];
			this.#state = 'unavailable';
		} finally {
			clearTimeout(bound);
			if (this.#controller === controller) this.#controller = null;
		}
		this.#notify();
	}

	#cancel() {
		clearTimeout(this.#timer);
		this.#timer = null;
		this.#controller?.abort();
		this.#controller = null;
	}

	#notify() {
		for (const listener of [...this.#listeners]) listener(this);
	}
}
