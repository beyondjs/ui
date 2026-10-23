/**
 * The one time axis of a block of lanes (0.27.0): it starts at the earliest start, and while any lane is
 * live it ends at the next whole step above the time the block has run (1, 2, 5, 10, 15, 30, 60 and 120
 * minutes, then doubling), so a running bar grows at its end and the scale changes rarely; once every lane
 * ended it ends at the last end. A block with no start has no axis (`start` is null) and a minute's span,
 * so a bar is never divided by nothing.
 */
export class LaneAxis {
	/** The steps of a live axis, in minutes; past the last one each step doubles the one before. */
	static steps = Object.freeze([1, 2, 5, 10, 15, 30, 60, 120]);
	/** The span of an axis that has nothing to measure. */
	static least = 60_000;

	#start = null;
	#span = LaneAxis.least;

	/** The earliest start, in milliseconds since the epoch, or null. */
	get start() {
		return this.#start;
	}

	/** The axis' length in milliseconds, always more than zero. */
	get span() {
		return this.#span;
	}

	/**
	 * Measures the axis from the lanes' times at `now`; answers whether its span changed.
	 *
	 * @param {Array<{since: number|null, until: number|null, live: boolean}>} times milliseconds since the epoch
	 * @param {number} now
	 */
	measure(times, now) {
		const before = this.#span;
		const starts = times.map(time => time.since).filter(since => since !== null);
		this.#start = starts.length ? Math.min(...starts) : null;
		if (this.#start === null) this.#span = LaneAxis.least;
		else {
			// An end reported past the page's now (a server's clock ahead of it) still fits on the axis
			const ends = times.flatMap(time => [time.since, time.until]).filter(moment => moment !== null);
			if (times.some(time => time.live)) this.#span = LaneAxis.step(Math.max(now, ...ends) - this.#start);
			else {
				const span = Math.max(...ends) - this.#start;
				this.#span = span > 0 ? span : LaneAxis.least;
			}
		}
		return this.#span !== before;
	}

	/** The span of a live axis: the first step strictly above `elapsed` milliseconds. */
	static step(elapsed) {
		const minutes = Math.max(0, Number(elapsed) || 0) / 60_000;
		const found = LaneAxis.steps.find(step => step > minutes);
		if (found) return found * 60_000;
		let step = LaneAxis.steps.at(-1);
		while (step <= minutes) step *= 2;
		return step * 60_000;
	}
}
