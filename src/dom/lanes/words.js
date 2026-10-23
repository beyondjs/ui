import { TimeWords } from '../time/words.js';

/**
 * What a lane says about time (0.27.0): its duration in the words of the long-operation components
 * ("1 min 42 s", through `TimeWords`), when it started to the second ("Started 10:42:05", with the day
 * when that was not today), and the sentence of its trace's tooltip ("Started 10:42:05 · ran 1 min 42 s",
 * "Started 10:42:05 · 1 min 42 s so far"). Times of day come from `Intl` in the lane's locale on a
 * 24-hour clock; nothing here is announced by itself.
 */
export class LaneWords {
	#labels;
	#time;
	#clock;
	#day;

	/**
	 * @param {import('../core/labels.js').Labels} labels the copy of `Lanes`, holding the units
	 * @param {string} [locale] a BCP 47 tag for `Intl` (the page's language when omitted)
	 */
	constructor(labels, locale = undefined) {
		this.#labels = labels;
		this.#time = new TimeWords(labels, locale);
		this.#clock = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
		this.#day = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
	}

	/** A duration in up to two units ("1 min 42 s"), "0 s" under a second; never negative. */
	duration(milliseconds) {
		return this.#time.exact(Math.max(0, milliseconds));
	}

	/** When a lane started, to the second: "Started 10:42:05", or with its day when it was another day than `now`. */
	started(since, now) {
		const day = new Date(since).toDateString() !== new Date(now).toDateString();
		return this.#labels.text('started', { time: (day ? this.#day : this.#clock).format(new Date(since)), day });
	}

	/**
	 * The sentence of a lane's trace: when it started and how long it ran, or has run so far while it is
	 * live; only when it started while its end is not known; nothing without a start.
	 *
	 * @param {{since: number|null, until: number|null, live: boolean}} times milliseconds since the epoch
	 * @param {number} now
	 */
	trace({ since, until, live }, now) {
		if (since === null) return '';
		const started = this.started(since, now);
		if (until !== null) return `${started} · ${this.#labels.text('ran', { duration: this.duration(until - since) })}`;
		if (live) return `${started} · ${this.#labels.text('elapsed', { duration: this.duration(now - since) })}`;
		return started;
	}
}
