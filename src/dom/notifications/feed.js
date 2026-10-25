import { Reach } from './reach.js';

/**
 * Reading pages of notifications through the consumer's adapter.
 *
 * The adapter follows `beyond-notifications/1` as the product relays it:
 * `list({ state, product, cursor, limit })` resolves
 * `{ items, next, unavailable?, sources?, available?, reason? }`. `available: false` means the
 * aggregation itself cannot be reached (for example Projects is not configured), and `reason` names
 * why (`Cause.codes`); `unavailable` (product ids) or `sources` entries with `state: 'unavailable'`
 * name products whose items are hidden because they did not answer (see `Reach`).
 * Only the latest request publishes. Nothing is kept once `clear()` runs, so no private text
 * outlives the view that showed it.
 *
 * Since 0.15.0 (X-07) a request with `by: 'matter'` asks for a page of matters (Beyond Projects'
 * `GET /v1/notifications?by=matter`): `limit` counts matters, and each item is a matter's newest update with
 * `updates: { count, unread, more? }`. A relay that ignores it answers items, and the feed then reads
 * further pages (at most `Feed.pages` per request) until it holds `limit` matters or the end, so one
 * noisy matter never hides the others.
 */
export class Feed {
	/** Pages read at most for one request of matters from a relay that does not group. */
	static pages = 5;

	#adapter;
	#sequence = 0;
	#items = [];
	#next = null;
	#missing = [];
	#state = 'idle';
	#error = null;
	#request = null;
	#reason = null;
	#details = null;

	constructor(adapter) {
		this.#adapter = adapter;
	}

	/** Why the aggregation is unavailable, as the relay's `reason` code, or null (0.7.6). */
	get reason() {
		return this.#reason;
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

	/**
	 * The evidence of the last read that did not answer (0.33.0), `{ request, time, text }`, for an outage's
	 * Technical details: the relay's `request` and `reason`, or the adapter's error; null after an answer.
	 */
	get details() {
		return this.#details;
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

	/** Whether a relay answered by matter: it says so, or its items carry their matter's `updates`. */
	static #grouped(answer) {
		return answer?.grouped === true || answer?.by === 'matter' || (answer?.items ?? []).some(item => item?.updates && typeof item.updates === 'object');
	}

	/** How many matters `items` hold: those that share a product's `group` count once. */
	static matters(items) {
		return new Set(items.map(item => (item.group ? `${item.product ?? ''}\u0000${item.group}` : `\u0001${item.id}`))).size;
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
		this.#reason = null;
		this.#details = null;
	}

	async #run(request, append) {
		this.#sequence += 1;
		const sequence = this.#sequence;
		this.#request = request;
		this.#state = append ? 'more' : 'loading';
		this.#error = null;
		this.#reason = null;
		this.#details = null;
		try {
			const before = append ? Feed.matters(this.#items) : 0;
			let answer = await this.#adapter.list(request);
			if (sequence !== this.#sequence) return false;
			if (answer?.available === false) {
				this.#items = [];
				this.#state = 'unavailable';
				this.#reason = answer.reason ?? null;
				this.#details = { request: answer.request ?? null, time: new Date().toISOString(), text: answer.reason ?? '' };
				return true;
			}
			let items = append ? [...this.#items, ...(answer?.items ?? [])] : [...(answer?.items ?? [])];
			// A relay that does not group: more pages until `limit` matters, within a bound
			for (let read = 1; request.by === 'matter' && !Feed.#grouped(answer) && answer?.next && read < Feed.pages && Feed.matters(items) - before < request.limit; read += 1) {
				answer = await this.#adapter.list({ ...request, cursor: answer.next });
				if (sequence !== this.#sequence) return false;
				if (answer?.available === false) break;
				items = [...items, ...(answer?.items ?? [])];
			}
			this.#items = items;
			this.#next = answer?.next ?? null;
			this.#missing = Reach.missing(answer);
			this.#state = 'ready';
		} catch (error) {
			if (sequence !== this.#sequence) return false;
			this.#error = error;
			this.#details = { request: error?.request ?? null, time: new Date().toISOString(), text: error?.message ?? String(error ?? '') };
			this.#state = 'failed';
		}
		return true;
	}
}
