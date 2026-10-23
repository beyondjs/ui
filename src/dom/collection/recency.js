import { Labels } from '../core/labels.js';

const words = Object.freeze({
	en: Object.freeze({ today: 'Today', yesterday: 'Yesterday', week: 'Previous 7 days', month: 'Previous 30 days', earlier: 'Earlier' }),
	es: Object.freeze({ today: 'Hoy', yesterday: 'Ayer', week: 'Últimos 7 días', month: 'Últimos 30 días', earlier: 'Antes' })
});

/**
 * When something was last active, as a list ordered by activity groups it (0.21.1, the list rule L4):
 * Today, Yesterday, Previous 7 days, Previous 30 days, then by month ("September", "August 2025" outside
 * the current year), in calendar days of the person's own time zone. A moment ahead of the clock counts
 * as today; one that is not a moment as Earlier. `group(moment)` gives `Collection`'s `group` option.
 */
export class Recency {
	static labels = words;
	static DAY = 86400000;

	#now;
	#locale;
	#labels;

	/**
	 * @param {{ locale?: string, now?: () => number, labels?: object }} [options] `labels`: the words of the
	 * groups (`Recency.labels.es`); the month's name follows `locale`; `now`: the clock, read on each call,
	 * so a page left open past midnight groups by the new day
	 */
	constructor({ locale = 'en', now = () => Date.now(), labels = {} } = {}) {
		this.#now = now;
		this.#locale = locale;
		this.#labels = new Labels(words.en, labels);
	}

	/**
	 * The group of a moment
	 *
	 * @param {Date|number|string|null|undefined} value
	 * @returns {{ key: string, label: string }}
	 */
	of(value) {
		const moment = new Date(typeof value === 'string' ? Date.parse(value) : value ?? NaN);
		if (Number.isNaN(moment.getTime())) return this.#named('earlier');
		const today = new Date(this.#now());
		today.setHours(0, 0, 0, 0);
		const day = new Date(moment);
		day.setHours(0, 0, 0, 0);
		// Rounded, so a day a change of summer time made 23 or 25 hours long still counts as one
		const days = Math.round((today.getTime() - day.getTime()) / Recency.DAY);
		if (days <= 0) return this.#named('today');
		if (days === 1) return this.#named('yesterday');
		if (days <= 7) return this.#named('week');
		if (days <= 30) return this.#named('month');
		const year = moment.getFullYear();
		const label = new Intl.DateTimeFormat(this.#locale, year === today.getFullYear() ? { month: 'long' } : { month: 'long', year: 'numeric' }).format(moment);
		// A label in sentence case, whatever the language writes a month's name with
		return { key: `${year}-${moment.getMonth() + 1}`, label: label.charAt(0).toLocaleUpperCase(this.#locale) + label.slice(1) };
	}

	/**
	 * `Collection`'s `group` for rows whose moment `moment(row)` gives
	 *
	 * @param {(row: object) => Date|number|string|null|undefined} moment
	 */
	group(moment) {
		return row => this.of(moment(row));
	}

	#named(key) {
		return { key, label: this.#labels.text(key) };
	}
}
