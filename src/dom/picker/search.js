/**
 * The requests of one searchable source: first page, further pages, retry and cancellation.
 *
 * A source is `async ({ query, filters, cursor, limit, signal }) => ({ items, next?, total? })`.
 * Only the latest request may publish: a new query aborts the previous one and a response that
 * arrives late is ignored, so typing quickly never shows results of an older query. A page request
 * appends; a failure keeps what is shown and remembers what to retry.
 */
export class Search {
	#source;
	#limit;
	#sequence = 0;
	#controller = null;
	#last = null;
	#items = [];
	#next = null;
	#total = null;
	#state = 'idle';
	#error = null;
	#onchange;

	constructor({ source, limit = 20, onchange }) {
		this.#source = source;
		this.#limit = limit;
		this.#onchange = onchange;
	}

	/** `idle`, `loading`, `more` (loading a further page), `ready` or `failed`. */
	get state() {
		return this.#state;
	}

	get items() {
		return this.#items;
	}

	get total() {
		return this.#total;
	}

	get error() {
		return this.#error;
	}

	/** Whether another page exists. */
	get more() {
		return this.#next !== null && this.#next !== undefined;
	}

	/** The query and filters of the results shown. */
	get request() {
		return this.#last;
	}

	/** Starts a new search from the first page. */
	find(query, filters = {}) {
		return this.#run({ query, filters, cursor: null }, false);
	}

	/** Loads the next page, appending to the results. */
	page() {
		if (!this.more || this.#state === 'loading' || this.#state === 'more') return Promise.resolve();
		return this.#run({ ...this.#last, cursor: this.#next }, true);
	}

	/** Repeats the request that failed. */
	retry() {
		if (!this.#last) return Promise.resolve();
		return this.#run(this.#last, this.#last.cursor !== null);
	}

	/** Cancels any request in flight; late answers are ignored. */
	cancel() {
		this.#sequence += 1;
		this.#controller?.abort();
		this.#controller = null;
	}

	async #run(request, append) {
		this.cancel();
		const sequence = this.#sequence;
		const controller = new AbortController();
		this.#controller = controller;
		this.#last = request;
		this.#error = null;
		this.#state = append ? 'more' : 'loading';
		if (!append) {
			this.#items = [];
			this.#next = null;
			this.#total = null;
		}
		this.#onchange();
		try {
			const answer = await this.#source({ ...request, limit: this.#limit, signal: controller.signal });
			if (sequence !== this.#sequence) return;
			this.#items = append ? [...this.#items, ...(answer?.items ?? [])] : [...(answer?.items ?? [])];
			this.#next = answer?.next ?? null;
			this.#total = answer?.total ?? null;
			this.#state = 'ready';
		} catch (error) {
			if (sequence !== this.#sequence) return;
			this.#error = error;
			this.#state = 'failed';
		}
		this.#controller = null;
		this.#onchange();
	}
}
