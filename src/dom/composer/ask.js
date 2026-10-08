/**
 * The bounded asks behind a composer's suggestions (0.11.0): each query waits `delay` after the last
 * keystroke, then calls the product's `source(query, signal)`; a newer query aborts the older one and
 * an older answer is never shown. Every ask ends: one that does not answer within `bound` is aborted
 * and said unavailable ("didn't answer in time"), a rejection is unavailable with `explain(error)`'s
 * words (or "couldn't be read"), never "No match".
 *
 * Answers reach `onanswer` as `{ state: 'looking' }`, then `{ state: 'results', items }`,
 * `{ state: 'none' }` or `{ state: 'unavailable', reason }`.
 */
export class SuggestAsk {
	static bound = 8000;
	static delay = 120;

	#source;
	#bound;
	#delay;
	#explain;
	#labels;
	#count = 0;
	#controller = null;
	#timers = new Set();

	/**
	 * @param {object} options
	 * @param {(query: string, signal: AbortSignal) => Promise<Array<{value: string, label?: string, detail?: string|null}>|{items: Array<object>}>} options.source
	 * @param {number} [options.bound] milliseconds before an ask is unavailable
	 * @param {number} [options.delay] milliseconds after the last keystroke
	 * @param {((error: unknown) => string|null)|null} [options.explain] the product's words for a failure
	 * @param {import('../core/labels.js').Labels} options.labels the composer's copy (`late`, `unread`)
	 */
	constructor({ source, bound = SuggestAsk.bound, delay = SuggestAsk.delay, explain = null, labels }) {
		this.#source = source;
		this.#bound = Number.isFinite(bound) && bound > 0 ? bound : SuggestAsk.bound;
		this.#delay = Number.isFinite(delay) && delay >= 0 ? delay : SuggestAsk.delay;
		this.#explain = explain;
		this.#labels = labels;
	}

	/** Asks for `query` after the delay; `onanswer` hears each state of this ask only. */
	ask(query, onanswer) {
		this.cancel();
		const count = this.#count;
		this.#later(() => this.#run(query, count, onanswer), this.#delay);
	}

	/** Forgets the ask in flight: it is aborted and its answer is never shown. */
	cancel() {
		this.#count += 1;
		this.#controller?.abort();
		this.#controller = null;
		for (const timer of this.#timers) clearTimeout(timer);
		this.#timers.clear();
	}

	async #run(query, count, onanswer) {
		if (count !== this.#count) return;
		const controller = new AbortController();
		this.#controller = controller;
		onanswer({ state: 'looking' });
		let late = false;
		const bounded = new Promise((resolve, reject) =>
			this.#later(() => {
				late = true;
				controller.abort();
				reject(new Error('late'));
			}, this.#bound)
		);
		try {
			const answer = await Promise.race([Promise.resolve().then(() => this.#source(query, controller.signal)), bounded]);
			if (count !== this.#count) return;
			const items = (Array.isArray(answer) ? answer : (answer?.items ?? [])).filter(item => item && item.value !== undefined && item.value !== null);
			onanswer(items.length ? { state: 'results', items } : { state: 'none' });
		} catch (error) {
			if (count !== this.#count) return;
			const reason = late ? this.#labels.text('late') : (this.#explain?.(error) ?? this.#labels.text('unread'));
			onanswer({ state: 'unavailable', reason });
		} finally {
			if (count === this.#count) this.cancel();
		}
	}

	#later(work, delay) {
		const timer = setTimeout(() => {
			this.#timers.delete(timer);
			work();
		}, delay);
		this.#timers.add(timer);
	}
}
