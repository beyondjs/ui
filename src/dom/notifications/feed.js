import { Reach } from './reach.js';

/**
 * Reading pages of notifications through the consumer's adapter.
 *
 * The adapter follows `beyond-notifications/1` as the product relays it:
 * `list({ state, product, cursor, limit })` resolves `{ items, next, unavailable?, sources?, available? }`.
 * `available: false` means the aggregation itself cannot be reached (for example Projects is not
 * configured); `unavailable` (product ids) or `sources` entries with `state: 'unavailable'` name
 * products whose items are hidden because they did not answer (see `Reach`).
 * Only the latest request publishes. Nothing is kept once `clear()` runs, so no private text
 * outlives the view that showed it.
 */
export class Feed {
	#adapter;
	#sequence = 0;
	#items = [];
	#next = null;
	#missing = [];
	#state = 'idle';
	#error = null;
	#request = null;

	constructor(adapter) {
		this.#adapter = adapter;
	}

	/** `idle`, `loading`, `more`, `ready`, `failed` or `unavailable`. */
	get state() {
		return this.#state;
	}

	get items() {
		return this.#items;
	}

	get error() {
		return this.#error;
	}

	/** Products whose notifications are hidden because they could not be reached. */
	get missing() {
		return this.#missing;
	}

	get more() {
		return this.#next !== null && this.#next !== undefined;
	}

	/** Loads the first page of a filter, replacing the items. Resolves whether this answer was published. */
	load(request) {
		return this.#run({ ...request, cursor: null }, false);
	}

	/** Loads the next page, appending. */
	page() {
		if (!this.more || this.#state !== 'ready') return Promise.resolve();
		return this.#run({ ...this.#request, cursor: this.#next }, true);
	}

	retry() {
		return this.#request ? this.#run(this.#request, this.#request.cursor !== null) : Promise.resolve();
	}

	/** Replaces one item (after it was marked read or unread) or removes it with null. */
	update(id, change) {
		this.#items = this.#items.flatMap(item => (item.id !== id ? [item] : change === null ? [] : [{ ...item, ...change }]));
	}

	/** Forgets everything shown and ignores answers still on their way. */
	clear() {
		this.#sequence += 1;
		this.#items = [];
		this.#next = null;
		this.#missing = [];
		this.#state = 'idle';
		this.#error = null;
	}

	async #run(request, append) {
		this.#sequence += 1;
		const sequence = this.#sequence;
		this.#request = request;
		this.#state = append ? 'more' : 'loading';
		this.#error = null;
		try {
			const answer = await this.#adapter.list(request);
			if (sequence !== this.#sequence) return false;
			if (answer?.available === false) {
				this.#items = [];
				this.#state = 'unavailable';
				return true;
			}
			this.#items = append ? [...this.#items, ...(answer?.items ?? [])] : [...(answer?.items ?? [])];
			this.#next = answer?.next ?? null;
			this.#missing = Reach.missing(answer);
			this.#state = 'ready';
		} catch (error) {
			if (sequence !== this.#sequence) return false;
			this.#error = error;
			this.#state = 'failed';
		}
		return true;
	}
}
