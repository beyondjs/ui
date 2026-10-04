/**
 * The requests of one searchable source: first page, further pages, retry and cancellation.
 *
 * A source is `async ({ query, filters, account, cursor, limit, signal }) => ({ items, next?, total?,
 * suggested? })`. Only the latest request may publish: a new query aborts the previous one and a
 * response that arrives late is ignored, so typing quickly never shows results of an older query. A
 * page request appends; a failure keeps what is shown and remembers what to retry. Every request is
 * bounded (D40): a source that does not answer within `bound` milliseconds is aborted and fails with
 * a `TimeoutError`, which the picker states as unavailable, never as an empty list. `suggested`
 * (`{ label?, items }`, first page only) is a group shown before the results, such as recent ones.
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
	#suggested = null;
	#bound;
	#state = 'idle';
	#error = null;
	#onchange;

	constructor({ source, limit = 20, bound = 20000, onchange }) {
		this.#source = source;
		this.#limit = limit;
		this.#bound = bound;
		this.#onchange = onchange;
	}

	/** The group shown before the results, `{ label, items }`, or null. */
	get suggested() {
		return this.#suggested;
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

	/** Starts a new search from the first page, within `account` when the picker has accounts. */
	find(query, filters = {}, account = null) {
		return this.#run({ query, filters, account, cursor: null }, false);
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
			this.#suggested = null;
		}
		this.#onchange();
		let timer = null;
		try {
			const late = new Promise((resolve, reject) => {
				timer = setTimeout(() => {
					controller.abort();
					reject(Object.assign(new Error('The source did not answer in time'), { name: 'TimeoutError' }));
				}, this.#bound);
			});
			const answer = await Promise.race([this.#source({ ...request, limit: this.#limit, signal: controller.signal }), late]);
			if (sequence !== this.#sequence) return;
			const shown = new Set((answer?.suggested?.items ?? []).map(item => String(item.id)));
			if (!append && shown.size) this.#suggested = { label: answer.suggested.label ?? null, items: [...answer.suggested.items] };
			const items = (answer?.items ?? []).filter(item => !shown.has(String(item.id)));
			this.#items = append ? [...this.#items, ...items.filter(item => !this.#suggested?.items.some(entry => String(entry.id) === String(item.id)))] : items;
			this.#next = answer?.next ?? null;
			this.#total = answer?.total ?? null;
			this.#state = 'ready';
		} catch (error) {
			if (sequence !== this.#sequence) return;
			this.#error = error;
			this.#state = 'failed';
		} finally {
			clearTimeout(timer);
		}
		this.#controller = null;
		this.#onchange();
	}
}
