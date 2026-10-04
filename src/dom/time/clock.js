/**
 * The time a page's operations are measured against, and the beat that keeps their words current.
 *
 * Components that say how long something has run (`Steps`, `Awaited`, `Freshness`) read `now` from a
 * clock and subscribe to it, so a threshold that only time crosses ("taking longer than usual") is
 * crossed without waiting for an event (long operations, rule 4). One clock serves a whole page: it
 * keeps one timer while anything listens and none otherwise. Tests and products inject `now` and
 * call `tick()` to re-evaluate at once, for example after a reload of the operation's record.
 */
export class Clock {
	static #system = null;

	#now;
	#every;
	#listeners = new Set();
	#timer = null;

	/**
	 * @param {{now?: () => number, every?: number}} [options] `now` returns the current time in
	 *   milliseconds (`Date.now` by default); `every` is the beat in milliseconds (1000)
	 */
	constructor({ now = () => Date.now(), every = 1000 } = {}) {
		if (typeof now !== 'function') throw new TypeError('A clock reads the time from a function');
		this.#now = now;
		this.#every = Number.isFinite(every) && every > 0 ? every : 1000;
	}

	/** The page's shared clock on the system time. */
	static get system() {
		Clock.#system ??= new Clock();
		return Clock.#system;
	}

	/** The current time in milliseconds. */
	get now() {
		return this.#now();
	}

	/** How many listeners the clock calls on each beat. */
	get size() {
		return this.#listeners.size;
	}

	/**
	 * Calls `listener` on every beat until the returned release runs. A throwing listener does not
	 * stop the others; its error goes to `reportError`.
	 */
	subscribe(listener) {
		this.#listeners.add(listener);
		if (!this.#timer) {
			this.#timer = setInterval(() => this.tick(), this.#every);
			// In Node (tests, server rendering) a forgotten listener never keeps the process alive.
			this.#timer.unref?.();
		}
		return () => {
			this.#listeners.delete(listener);
			if (!this.#listeners.size) this.#stop();
		};
	}

	/** Calls every listener now. */
	tick() {
		for (const listener of [...this.#listeners]) {
			try {
				listener(this.now);
			} catch (error) {
				globalThis.reportError?.(error);
			}
		}
	}

	#stop() {
		clearInterval(this.#timer);
		this.#timer = null;
	}
}
