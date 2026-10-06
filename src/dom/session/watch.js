/**
 * When to look at the session before the person runs into an ended one: when the tab is shown again,
 * when the network comes back, when a page is restored from the back-forward cache, after the computer
 * slept (a timer that fires much later than asked), and shortly before the session's known expiry.
 * Looks closer together than `spacing` are dropped, except the one before expiry.
 */
export class Watch {
	#document;
	#check;
	#spacing;
	#tick;
	#last = 0;
	#beat = null;
	#expiry = null;
	#stamp = Date.now();
	#visible = () => this.#document.visibilityState === 'visible' && this.#look();
	#listener = () => this.#look();

	/**
	 * @param {object} options
	 * @param {Document} options.document
	 * @param {() => void} options.check reads the session
	 * @param {number} [options.spacing] the least time between two looks, in ms (15000)
	 * @param {number} [options.tick] how often the sleep detector runs, in ms (30000)
	 */
	constructor({ document, check, spacing = 15_000, tick = 30_000 }) {
		this.#document = document;
		this.#check = check;
		this.#spacing = spacing;
		this.#tick = tick;
		const view = document.defaultView;
		document.addEventListener('visibilitychange', this.#visible);
		view?.addEventListener('online', this.#listener);
		view?.addEventListener('pageshow', this.#listener);
		this.#beat = setInterval(() => this.#wake(), tick);
	}

	/** Looks a minute before `expires` (an ISO date or a time in ms). */
	set expires(value) {
		clearTimeout(this.#expiry);
		this.#expiry = null;
		const at = typeof value === 'number' ? value : Date.parse(value ?? '');
		if (!Number.isFinite(at)) return;
		const delay = Math.min(2 ** 31 - 1, Math.max(0, at - Date.now() - 60_000));
		this.#expiry = setTimeout(() => this.#check(), delay);
	}

	destroy() {
		const view = this.#document.defaultView;
		this.#document.removeEventListener('visibilitychange', this.#visible);
		view?.removeEventListener('online', this.#listener);
		view?.removeEventListener('pageshow', this.#listener);
		clearInterval(this.#beat);
		clearTimeout(this.#expiry);
	}

	#look() {
		const now = Date.now();
		if (now - this.#last < this.#spacing) return;
		this.#last = now;
		this.#check();
	}

	/** A beat that comes three ticks late means the computer slept. */
	#wake() {
		const now = Date.now();
		const late = now - this.#stamp > this.#tick * 3;
		this.#stamp = now;
		if (late) this.#look();
	}
}
