import { TimeWords } from '../time/words.js';

/**
 * How long a step or a wait has run against how long it usually takes (decision D50).
 *
 * The expected duration is measured: `median` is what "usually about" says, and `p90` (the 90th
 * percentile, never below the median) is where "taking longer than usual" starts. Everything here is
 * computed from the given record and the time `now`, never from the page's history, so a reload, another
 * tab or a return an hour later says the same.
 *
 * - `elapsed`: since `since` until `until` (or `now`), or null when it has not begun.
 * - `slow`: past the 90th percentile (strictly), only while it has not ended.
 * - `late`: at or past the median, not yet slow.
 * - `remaining`: what is left of the median, then of the 90th percentile from the median on;
 *   null when it cannot be told or it is slow.
 * - `fraction`: how far along, for a bar that only the end completes: up to 0.9 at the median, then up
 *   to 0.95 at the 90th percentile; null when it cannot be told or it is slow.
 */
export class Timing {
	/** The share a bar may reach at the median. */
	static USUAL = 0.9;
	/** The share a bar may reach at all: only the end completes it. */
	static CEILING = 0.95;

	#since;
	#until;
	#median;
	#p90;
	#now;

	/**
	 * @param {{since?: string|number|Date|null, until?: string|number|Date|null, expected?: {median: number, p90?: number}|null}} record
	 * @param {number} now the current time in milliseconds
	 */
	constructor({ since = null, until = null, expected = null } = {}, now) {
		this.#since = TimeWords.moment(since);
		this.#until = TimeWords.moment(until);
		const median = Number(expected?.median);
		this.#median = Number.isFinite(median) && median > 0 ? median : null;
		const p90 = Number(expected?.p90);
		this.#p90 = this.#median === null ? null : Math.max(this.#median, Number.isFinite(p90) ? p90 : this.#median);
		this.#now = now;
	}

	get since() {
		return this.#since;
	}

	get until() {
		return this.#until;
	}

	/** The measured median in milliseconds, or null when nothing is expected. */
	get median() {
		return this.#median;
	}

	get p90() {
		return this.#p90;
	}

	get ended() {
		return this.#until !== null;
	}

	get elapsed() {
		if (this.#since === null) return null;
		return Math.max(0, (this.#until ?? this.#now) - this.#since);
	}

	/** At or past the median: the time left is counted toward the 90th percentile. */
	get late() {
		const elapsed = this.elapsed;
		return elapsed !== null && this.#median !== null && elapsed >= this.#median;
	}

	get slow() {
		const elapsed = this.elapsed;
		return !this.ended && elapsed !== null && this.#p90 !== null && elapsed > this.#p90;
	}

	get remaining() {
		const elapsed = this.elapsed;
		if (elapsed === null || this.#median === null || this.ended || this.slow) return null;
		return (this.late ? this.#p90 : this.#median) - elapsed;
	}

	get fraction() {
		const elapsed = this.elapsed;
		if (elapsed === null || this.#median === null || this.ended || this.slow) return null;
		if (!this.late) return Timing.USUAL * (elapsed / this.#median);
		const span = this.#p90 - this.#median;
		const past = span > 0 ? (elapsed - this.#median) / span : 1;
		return Math.min(Timing.CEILING, Timing.USUAL + (Timing.CEILING - Timing.USUAL) * past);
	}
}
