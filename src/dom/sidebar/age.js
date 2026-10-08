import { TimeWords } from '../time/words.js';

/**
 * An entry's age (0.11.0): short at the entry's end ("now", "5 min", "2 h", "3 d", "2 w", then the
 * day, "6 Oct", with the year when it is another), and the full moment for assistive technology and
 * the tooltip, in the page's language (`<html lang>`). A product may give both words itself
 * (`{ label, title }`); a moment (a Date, a number or an ISO string) is said here, against `now`.
 */
export class EntryAge {
	#label;
	#title;
	#moment;

	/**
	 * @param {import('../operations/steps.js').Moment|{label: string, title?: string|null}} age
	 * @param {object} context
	 * @param {import('../core/labels.js').Labels} context.labels the sidebar's copy (`now`, `minutes`, `hours`, `days`, `weeks`)
	 * @param {string|undefined} context.locale the page's language
	 * @param {number} [context.now] the time to measure against (now)
	 */
	constructor(age, { labels, locale, now = Date.now() }) {
		if (age && typeof age === 'object' && !(age instanceof Date)) {
			this.#label = String(age.label ?? '');
			this.#title = String(age.title ?? age.label ?? '');
			this.#moment = null;
			return;
		}
		const time = TimeWords.moment(age);
		this.#moment = time;
		if (time === null) {
			this.#label = '';
			this.#title = '';
			return;
		}
		this.#label = EntryAge.#short(time, now, labels, locale);
		this.#title = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short', hourCycle: 'h23' }).format(new Date(time));
	}

	/** The short words at the entry's end; empty for no age. */
	get label() {
		return this.#label;
	}

	/** The full moment (or the product's words), read with the entry and shown on hover. */
	get title() {
		return this.#title;
	}

	/** The moment as an ISO string for `<time datetime>`, or null when the product gave words. */
	get datetime() {
		return this.#moment === null ? null : new Date(this.#moment).toISOString();
	}

	static #short(time, now, labels, locale) {
		const minutes = Math.max(0, Math.floor((now - time) / 60_000));
		if (minutes < 1) return labels.text('now');
		if (minutes < 60) return labels.text('minutes', { count: minutes });
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return labels.text('hours', { count: hours });
		const days = Math.floor(hours / 24);
		if (days < 7) return labels.text('days', { count: days });
		if (days < 35) return labels.text('weeks', { count: Math.floor(days / 7) });
		const date = new Date(time);
		const year = date.getFullYear() === new Date(now).getFullYear() ? {} : { year: 'numeric' };
		return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', ...year }).format(date);
	}
}
