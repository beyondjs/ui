import { EmptyState } from '../checklist/empty.js';

/**
 * A component's own read that did not answer, said the family's way (0.24.0, D163): unavailable in its
 * own place, while who did not answer, when it last tried and the one Try again belong to the page's
 * `Recovery` (`recovery`), whose Technical details keep the read's evidence (`details(error)`). Only the
 * failures `outage(error)` names join it; any other failure keeps the component's own answer. A
 * `Collection` joins with it since 0.24.0, a `Picker` since 0.33.0 (its place `inline`, under its list).
 */
export class OutageRead {
	#recovery;
	#outage;
	#details;
	#title;
	#words;
	#inline;
	#active = false;

	/**
	 * @param {object} options
	 * @param {import('../again/recovery.js').Recovery|null} [options.recovery] the page's notice for this read's cause
	 * @param {((error: unknown) => boolean)|null} [options.outage] whether a failure is an outage of that cause
	 * @param {((error: unknown) => object|null)|null} [options.details] the failure's evidence (`{ request, time, text }`)
	 * @param {string} options.title what the read is, in the notice's Technical details
	 * @param {string} options.words what the place says ("Not available right now")
	 * @param {boolean} [options.inline] its place is a line of phrasing content rather than a block (0.33.0)
	 */
	constructor({ recovery = null, outage = null, details = null, title, words, inline = false }) {
		this.#recovery = recovery;
		this.#outage = outage;
		this.#details = details;
		this.#title = title;
		this.#words = words;
		this.#inline = inline;
	}

	/** Whether its read is in the page's notice now, waiting for an answer (0.33.0). */
	get active() {
		return this.#active;
	}

	/** Whether this failure joins the page's notice. */
	takes(error) {
		return Boolean(this.#recovery && this.#outage?.(error));
	}

	/** Registers the read with the notice (`run` reads it again) and returns what its place shows. */
	draw(error, run) {
		this.#active = true;
		this.#recovery.set(this, { title: this.#title, details: this.#details?.(error) ?? null, run });
		return new EmptyState({ kind: 'outage', title: this.#words, inline: this.#inline }).element;
	}

	/** The read answered, or the collection left: its symptom leaves the notice. */
	release() {
		this.#active = false;
		this.#recovery?.delete(this);
	}
}
