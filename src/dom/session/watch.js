/**
 * When to look at the session before the person runs into an ended one: when the tab is shown again,
 * when the network comes back, when a page is restored from the back-forward cache, after the computer
 * slept (a timer that fires much later than asked), and shortly before the session's known expiry.
 * Looks closer together than `spacing` are dropped, except the one before expiry, which waits for it.
 *
 * Since 0.47.0 a hidden page does not look (nobody is there to run into anything; it looks when shown
 * again), and the look before expiry runs once per expiry: a read that answers the same expiry again
 * schedules nothing, so the last minute of a session is never read in a loop.
 */
export class Watch {
	#document;
	#check;
	#spacing;
	#tick;
	#last = 0;
	#beat = null;
	#expiry = null;
	/** The expiry, in ms, whose look is scheduled or done */
	#due = null;
	#stamp = Date.now();
	#visible = () => this.#document.visibilityState === 'visible' && this.#look();
	#listener = () => this.#shown && this.#look();

	/**
	 * @param {object} options
	 * @param {Document} options.document
	 * @param {() => void} options.check reads the session
	 * @param {number} [options.spacing] the least time between two looks, in ms (15000)
	 * @param {number} [options.tick] how often the sleep detector runs, in ms (30000)
	 * @param {string|number|null} [options.expires] the session's known expiry (0.47.0)
	 */
	constructor({ document, check, spacing = 15_000, tick = 30_000, expires = null }) {
		this.#document = document;
		this.#check = check;
		this.#spacing = spacing;
		this.#tick = tick;
		const view = document.defaultView;
		document.addEventListener('visibilitychange', this.#visible);
		view?.addEventListener('online', this.#listener);
		view?.addEventListener('pageshow', this.#listener);
		this.#beat = setInterval(() => this.#wake(), tick);
		this.expires = expires;
	}

	/** Looks a minute before `expires` (an ISO date or a time in ms), once for each expiry. */
	set expires(value) {
		const at = typeof value === 'number' ? value : Date.parse(value ?? '');
		if (Number.isFinite(at) && at === this.#due) return;
		clearTimeout(this.#expiry);
		this.#expiry = null;
		this.#due = Number.isFinite(at) ? at : null;
		if (this.#due === null) return;
		const now = Date.now();
		// Never sooner than `spacing` after the last look, so an expiry already near is read once
		const delay = Math.min(2 ** 31 - 1, Math.max(0, at - now - 60_000, this.#last + this.#spacing - now));
		this.#expiry = setTimeout(() => this.#expired(), delay);
	}

	destroy() {
		const view = this.#document.defaultView;
		this.#document.removeEventListener('visibilitychange', this.#visible);
		view?.removeEventListener('online', this.#listener);
		view?.removeEventListener('pageshow', this.#listener);
		clearInterval(this.#beat);
		clearTimeout(this.#expiry);
	}

	get #shown() {
		return this.#document.visibilityState !== 'hidden';
	}

	#look() {
		const now = Date.now();
		if (now - this.#last < this.#spacing) return;
		this.#last = now;
		this.#check();
	}

	#expired() {
		this.#expiry = null;
		if (!this.#shown) return;
		this.#last = Date.now();
		this.#check();
	}

	/** A beat that comes three ticks late means the computer slept; a hidden page looks when shown. */
	#wake() {
		const now = Date.now();
		const late = now - this.#stamp > this.#tick * 3;
		this.#stamp = now;
		if (late && this.#shown) this.#look();
	}
}
