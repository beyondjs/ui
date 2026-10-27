import { Language } from '../core/language.js';
import { Labels } from '../core/labels.js';
import { TimeWords } from './words.js';

const words = Object.freeze({
	en: Object.freeze({ now: 'now', minutes: '{count} min', hours: '{count} h', days: '{count} d', weeks: '{count} w' }),
	es: Object.freeze({ now: 'ahora', minutes: '{count} min', hours: '{count} h', days: '{count} d', weeks: '{count} sem' })
});

/**
 * How long ago something happened, in the family's one wording (0.11.1): the short words a list shows
 * at an entry's end ("now", "5 min", "2 h", "3 d", "2 w", then the day, "6 Oct", with the year when it
 * is another) and the full moment ("Thursday, 8 October 2026 at 10:42") read with them and shown on
 * hover. The `Sidebar` says its entries' ages with it; a product says the same for its own lists (a
 * table of conversations, a person's work across projects) instead of copying the wording.
 *
 * It knows no DOM: `of(moment)` answers `{ label, title, datetime }`. Ages are measured against `now`
 * each time `of` is called, so a product that keeps them current calls it again (every minute, say).
 */
export class Age {
	/** The units in English and Spanish (`now`, `minutes`, `hours`, `days`, `weeks`). */
	static labels = words;

	#labels;
	#now;
	#full;
	#day;
	#year;

	/**
	 * @param {object} [options]
	 * @param {string} [options.locale] a BCP 47 tag for the dates (when omitted, the page's `<html lang>` if its language is not the runtime's, else the runtime's; 0.44.0)
	 * @param {object|Labels} [options.labels] the units; by default those of the language in effect (`locale`'s, else `<html lang>`, else English, 0.44.0)
	 * @param {() => number} [options.now] the time to measure against (the clock's now)
	 */
	constructor({ locale = undefined, labels = null, now = () => Date.now() } = {}) {
		this.#labels = labels instanceof Labels ? labels : new Labels(words, labels ?? {}, locale);
		this.#now = typeof now === 'function' ? now : () => Date.now();
		const tag = Language.tag(locale);
		this.#full = new Intl.DateTimeFormat(tag, { dateStyle: 'full', timeStyle: 'short', hourCycle: 'h23' });
		this.#day = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short' });
		this.#year = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric' });
	}

	/** A moment as milliseconds from a Date, a number or an ISO string; null for anything unreadable. */
	static moment(value) {
		return TimeWords.moment(value);
	}

	/**
	 * The age of a moment: `{ label, title, datetime }` (the short words, the full moment and the ISO
	 * string for `<time datetime>`), or null when there is no moment to say.
	 *
	 * @param {Date|number|string|null|undefined} value
	 */
	of(value) {
		const time = Age.moment(value);
		if (time === null) return null;
		const date = new Date(time);
		return { label: this.#short(time), title: this.#full.format(date), datetime: date.toISOString() };
	}

	#short(time) {
		const now = this.#now();
		const minutes = Math.max(0, Math.floor((now - time) / 60_000));
		if (minutes < 1) return this.#labels.text('now');
		if (minutes < 60) return this.#labels.text('minutes', { count: minutes });
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return this.#labels.text('hours', { count: hours });
		const days = Math.floor(hours / 24);
		if (days < 7) return this.#labels.text('days', { count: days });
		if (days < 35) return this.#labels.text('weeks', { count: Math.floor(days / 7) });
		const date = new Date(time);
		return (date.getFullYear() === new Date(now).getFullYear() ? this.#day : this.#year).format(date);
	}
}
