/**
 * What did not answer, read again by itself until it answers (decision D132, amending D40): after 5, 15,
 * 30 and 60 seconds, then every 60 seconds; at once when the browser comes back online and when the page
 * is shown again after being hidden. One try at a time, so an outage never becomes a burst of requests:
 * asking while a try runs gets that try. A hidden page is not read for nobody: a try that falls due while
 * it is hidden waits for the page to be shown.
 *
 * `run` is one read. It answers by resolving (with anything but `false`), which ends the waiting, whatever
 * the answer was: a refusal is an answer, shown as one, never tried again. It did not answer when it
 * rejects or resolves `false`, and the next try is scheduled. Only a read is ever tried again: a change
 * whose answer did not arrive has an unknown outcome and is never sent again by itself.
 *
 * The read that found the outage counts as the first try, so `start()` already knows when it last tried.
 * While the browser is offline (`navigator.onLine === false`, 0.33.0) a try that falls due waits too, since
 * nothing can answer: it tries at once when the browser is online again, and its listeners hear `offline`
 * change both ways, so a line says the person is offline instead of naming who did not answer.
 *
 * It knows no DOM: timers, the clock, the window's and document's events and the network's state are
 * injected (`timers`, `now`, `events`, `page`, `network`), so it is tested without time and runs wherever
 * the page does.
 */
export class Again {
	/** The waits between tries, in milliseconds; the last repeats. */
	static steps = Object.freeze([5000, 15000, 30000, 60000]);

	#run;
	#steps;
	#timers;
	#clock;
	#events;
	#page;
	#network;
	#attempt = 0;
	#timer = null;
	#running = null;
	#answered = false;
	#active = false;
	#last = null;
	#next = null;
	#listeners = new Set();
	#online = () => {
		this.#tell();
		void this.now();
	};
	#offline = () => this.#tell();
	#shown = () => {
		if (this.#page?.visibilityState !== 'hidden') void this.now();
	};

	/**
	 * @param {object} options
	 * @param {() => Promise<unknown>} options.run one read; resolves when it answered, rejects or resolves `false` when it did not
	 * @param {readonly number[]} [options.steps] the waits between tries (`Again.steps`)
	 * @param {() => number} [options.now] the time in milliseconds (`Date.now`)
	 * @param {{setTimeout: Function, clearTimeout: Function}} [options.timers] the timers (the global ones)
	 * @param {EventTarget|null} [options.events] what says `online` (the window)
	 * @param {Document|null} [options.page] what says `visibilitychange` (the document)
	 * @param {{onLine?: boolean}|null} [options.network] what says whether the browser is online (the navigator, 0.33.0)
	 */
	constructor({ run, steps = Again.steps, now = () => Date.now(), timers = globalThis, events = globalThis.window ?? null, page = globalThis.document ?? null, network = globalThis.navigator ?? null }) {
		if (typeof run !== 'function') throw new TypeError('Again reads with a function');
		this.#run = run;
		this.#steps = steps.length ? steps : Again.steps;
		this.#clock = now;
		this.#timers = timers;
		this.#events = events;
		this.#page = page;
		this.#network = network;
	}

	/** Whether it is waiting for an answer. */
	get active() {
		return this.#active;
	}

	/** Whether a try is running. */
	get trying() {
		return this.#running !== null;
	}

	/** When it last tried, in milliseconds, or null before `start()`. */
	get last() {
		return this.#last;
	}

	/** When it tries next, in milliseconds, or null when no try is scheduled. */
	get next() {
		return this.#next;
	}

	/** Whether the browser says it is offline (0.33.0): nothing can answer until it is online again. */
	get offline() {
		return this.#network?.onLine === false;
	}

	/** `{ active, trying, last, next, offline }`, as its listeners receive it. */
	get moments() {
		return { active: this.#active, trying: this.trying, last: this.#last, next: this.#next, offline: this.offline };
	}

	/** Calls `listener(moments)` when a try starts or ends, when one is scheduled and when it stops. Returns the release. */
	listen(listener) {
		this.#listeners.add(listener);
		return () => void this.#listeners.delete(listener);
	}

	/** Starts waiting; the failed read that found the outage is the first try. Starting again while active does nothing. */
	start() {
		if (this.#active) return;
		this.#active = true;
		this.#answered = false;
		this.#attempt = 0;
		this.#last = this.#clock();
		this.#events?.addEventListener?.('online', this.#online);
		this.#events?.addEventListener?.('offline', this.#offline);
		this.#page?.addEventListener?.('visibilitychange', this.#shown);
		this.#schedule();
	}

	/** Tries now (Try again, the browser back online, the page shown): resolves whether it answered. Stopped, it only says whether it had. */
	now() {
		if (!this.#active) return Promise.resolve(this.#answered);
		if (this.#running) return this.#running;
		this.#running = this.#try().finally(() => {
			this.#running = null;
			this.#tell();
		});
		this.#tell();
		return this.#running;
	}

	/** Stops waiting: no try is scheduled and no event heard. A try already running ends unheard. */
	stop() {
		if (!this.#active) return;
		this.#active = false;
		this.#cancel();
		this.#events?.removeEventListener?.('online', this.#online);
		this.#events?.removeEventListener?.('offline', this.#offline);
		this.#page?.removeEventListener?.('visibilitychange', this.#shown);
		this.#tell();
	}

	async #try() {
		this.#cancel();
		let answered;
		try {
			answered = (await this.#run()) !== false;
		} catch {
			answered = false;
		}
		if (!this.#active) return answered;
		this.#last = this.#clock();
		if (answered) {
			this.#answered = true;
			this.stop();
			return true;
		}
		this.#attempt += 1;
		this.#schedule();
		return false;
	}

	#schedule() {
		const wait = this.#steps[Math.min(this.#attempt, this.#steps.length - 1)];
		this.#next = this.#clock() + wait;
		this.#timer = this.#timers.setTimeout(() => {
			this.#timer = null;
			// Shown again, or online again, it tries at once (`visibilitychange`, `online`)
			if (this.#page?.visibilityState === 'hidden' || this.offline) {
				this.#next = null;
				return this.#tell();
			}
			void this.now();
		}, wait);
		this.#timer?.unref?.();
		this.#tell();
	}

	#cancel() {
		if (this.#timer !== null) this.#timers.clearTimeout(this.#timer);
		this.#timer = null;
		this.#next = null;
	}

	#tell() {
		const moments = this.moments;
		for (const listener of [...this.#listeners]) listener(moments);
	}
}
