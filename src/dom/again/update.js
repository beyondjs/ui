import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { Labels } from '../core/labels.js';
import { TimeWords } from '../time/words.js';

const copy = Object.freeze({
	en: Object.freeze({ updated: 'Last updated {time}', earlier: 'May be out of date' }),
	es: Object.freeze({ updated: 'Última actualización: {time}', earlier: 'Puede no estar al día' })
});

/**
 * What a region keeps from an earlier read while its read does not answer (0.24.0, D163): "Last updated
 * 12:04", the time of day on its day and the day with the time on another, or "May be out of date" when
 * the time is not known, which is never invented. It sits on the first line of the kept content; who did
 * not answer and Try again are said once by the page's `Recovery`.
 */
export class LastUpdate extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;

	#element;
	#labels;
	#words;
	#clock;
	#time = null;

	/**
	 * @param {object} options
	 * @param {string|number|Date|null} [options.time] when the kept content was read
	 * @param {string} [options.locale] the language of the time
	 * @param {() => number} [options.now] the time in milliseconds, to tell today from another day
	 */
	constructor({ time = null, locale = undefined, labels = {}, now = () => Date.now() } = {}) {
		super();
		this.#labels = new Labels(copy.en, labels);
		this.#words = new TimeWords(this.#labels, locale);
		this.#clock = now;
		this.#element = el('p', { class: 'bui-last-update' });
		this.time = time;
	}

	get element() {
		return this.#element;
	}

	/** The words shown. */
	get text() {
		return this.#element.textContent;
	}

	/** When the kept content was read, or null when it is not known. */
	get time() {
		return this.#time;
	}

	set time(value) {
		this.#time = TimeWords.moment(value);
		const text = this.#time === null ? this.#labels.text('earlier') : this.#labels.text('updated', { time: this.#words.at(this.#time, this.#clock()) });
		if (this.#element.textContent !== text) this.#element.textContent = text;
	}

	/** The same words for `time` without a component: what React's `LastUpdate` draws too. */
	static say(time, { labels = {}, locale = undefined, now = Date.now() } = {}) {
		const words = new Labels(copy.en, labels);
		const moment = TimeWords.moment(time);
		return moment === null ? words.text('earlier') : words.text('updated', { time: new TimeWords(words, locale).at(moment, now) });
	}
}
