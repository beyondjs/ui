import { Age } from '../time/age.js';

/**
 * An entry's age (0.11.0): short at the entry's end and the full moment for assistive technology and
 * the tooltip, in the page's language (`<html lang>`), in the family's one wording (`Age`, public since
 * 0.11.1). A product may give both words itself (`{ label, title }`); a moment (a Date, a number or an
 * ISO string) is said by `Age`, against `now`.
 */
export class EntryAge {
	#label;
	#title;
	#datetime;

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
			this.#datetime = null;
			return;
		}
		const said = new Age({ locale, labels, now: () => now }).of(age);
		this.#label = said?.label ?? '';
		this.#title = said?.title ?? '';
		this.#datetime = said?.datetime ?? null;
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
		return this.#datetime;
	}
}
