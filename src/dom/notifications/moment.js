import { el } from '../core/element.js';

const units = [
	['year', 31536000],
	['month', 2592000],
	['week', 604800],
	['day', 86400],
	['hour', 3600],
	['minute', 60],
	['second', 1]
];

/**
 * Relative times in the consumer's language ("3 hours ago", "hace 3 horas"), with the exact
 * instant kept in the `<time>` element's `datetime`.
 */
export class Moment {
	#relative;
	#absolute;
	#now;

	constructor(locale = undefined, now = () => Date.now()) {
		this.#relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
		this.#absolute = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
		this.#now = now;
	}

	/** The relative phrase for an ISO instant. */
	text(iso) {
		const seconds = Math.round((new Date(iso).getTime() - this.#now()) / 1000);
		const [unit, size] = units.find(([, size]) => Math.abs(seconds) >= size) ?? units.at(-1);
		return this.#relative.format(Math.round(seconds / size), unit);
	}

	/** A `<time>` element for an ISO instant. */
	element(iso) {
		if (!iso) return null;
		return el('time', { datetime: iso, title: this.#absolute.format(new Date(iso)), text: this.text(iso) });
	}
}
