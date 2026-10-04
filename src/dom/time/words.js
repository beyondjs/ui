/**
 * Durations and moments in a person's words, for the components that measure operations.
 *
 * Units come from the component's labels (`second`, `minute`, `hour`, `day`, each a function of
 * `{ count }` or a string with `{count}`), so a product writes them in its own language; the times of
 * day come from `Intl` in the given locale on a 24-hour clock. Relative and elapsed times are for
 * reading, never announced by themselves.
 */
export class TimeWords {
	static #units = [
		['day', 86_400],
		['hour', 3600],
		['minute', 60],
		['second', 1]
	];

	#labels;
	#locale;
	#time;
	#day;

	/**
	 * @param {import('../core/labels.js').Labels} labels the component's labels, holding the units
	 * @param {string} [locale] a BCP 47 tag for `Intl` (the page's language when omitted)
	 */
	constructor(labels, locale = undefined) {
		this.#labels = labels;
		this.#locale = locale;
		this.#time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
		this.#day = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
	}

	get locale() {
		return this.#locale;
	}

	/** Milliseconds since the epoch from an ISO string, a number or a Date; null for anything else. */
	static moment(value) {
		if (value === null || value === undefined || value === '') return null;
		const time = value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value);
		return Number.isFinite(time) ? time : null;
	}

	/** Up to two units, each rounded down: "12 s", "1 min 24 s", "2 h 5 min". */
	exact(milliseconds) {
		const parts = this.#parts(milliseconds);
		const first = parts.findIndex(([, count]) => count > 0);
		if (first < 0) return this.#unit('second', 0);
		return parts
			.slice(first, first + 2)
			.filter(([, count]) => count > 0)
			.map(([unit, count]) => this.#unit(unit, count))
			.join(' ');
	}

	/** One unit, rounded to the nearest and never zero: "about {rough}" reads "about 3 min". */
	rough(milliseconds) {
		const seconds = Math.max(1, Math.round(Math.max(0, Number(milliseconds) || 0) / 1000));
		const index = TimeWords.#units.findIndex(([, size]) => seconds >= size);
		const [unit, size] = TimeWords.#units[index];
		const count = Math.round(seconds / size);
		// 59.6 minutes rounds to an hour, not to "60 min".
		const larger = TimeWords.#units[index - 1];
		if (larger && count * size >= larger[1]) return this.#unit(larger[0], Math.round(seconds / larger[1]));
		return this.#unit(unit, Math.max(1, count));
	}

	/** Whole minutes, rounded up and never under one: the time left of a wait ("1 min"). */
	left(milliseconds) {
		const minutes = Math.max(1, Math.ceil(Math.max(0, Number(milliseconds) || 0) / 60_000));
		return minutes >= 60 ? this.rough(minutes * 60_000) : this.#unit('minute', minutes);
	}

	/**
	 * When something happened, for "since" and "last known": "19:47" on the day of `now`, the day and
	 * the time on another day ("28 Sep, 10:42"), so a time of an earlier day never reads as today's.
	 */
	at(value, now = Date.now()) {
		const time = TimeWords.moment(value);
		if (time === null) return '';
		const same = new Date(time).toDateString() === new Date(now).toDateString();
		return (same ? this.#time : this.#day).format(new Date(time));
	}

	#parts(milliseconds) {
		let rest = Math.max(0, Math.floor((Number(milliseconds) || 0) / 1000));
		return TimeWords.#units.map(([unit, size]) => {
			const count = Math.floor(rest / size);
			rest -= count * size;
			return [unit, count];
		});
	}

	#unit(unit, count) {
		return this.#labels.text(unit, { count });
	}
}
