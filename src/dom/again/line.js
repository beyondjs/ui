import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { Labels } from '../core/labels.js';
import { TimeWords } from '../time/words.js';

const copy = Object.freeze({
	en: Object.freeze({ tried: 'Last tried {time} · trying again by itself', trying: 'Trying again…', away: 'Last tried {time} · trying again as soon as you’re back online' }),
	es: Object.freeze({ tried: 'Último intento {time} · se vuelve a intentar por sí solo', trying: 'Intentándolo de nuevo…', away: 'Último intento {time} · se vuelve a intentar en cuanto vuelvas a tener conexión' })
});

/**
 * The line an outage says under its words while `Again` reads again (D132, 0.17.1): "Last tried 12:04 ·
 * trying again by itself", and "Trying again…" while a try runs. The time is the time of day (with the
 * day when it was another day). Offline (0.33.0) it says "Last tried 12:04 · trying again as soon as you're
 * back online", as the document's opening does. It is hidden once the waiting ends, and never announces
 * itself: what replaces the outage when the service answers is what a person hears.
 */
export class AgainLine extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;

	#element;
	#labels;
	#words;
	#clock;
	#release;

	/**
	 * @param {object} options
	 * @param {import('./again.js').Again} options.again what tries again
	 * @param {string} [options.locale] the language of times of day
	 * @param {() => number} [options.now] the time in milliseconds, to tell today from another day
	 */
	constructor({ again, locale = undefined, labels = {}, now = () => Date.now() }) {
		super();
		this.#labels = new Labels(copy, labels, locale);
		this.#words = new TimeWords(this.#labels, locale);
		this.#clock = now;
		this.#element = el('p', { class: 'bui-again' });
		this.#release = again.listen(moments => this.#draw(moments));
		this.#draw(again.moments);
	}

	get element() {
		return this.#element;
	}

	/** The words shown. */
	get text() {
		return this.#element.textContent;
	}

	destroy() {
		this.#release();
		super.destroy();
	}

	/**
	 * The words for `moments` (`{ active, trying, last, offline }`), or '' when nothing is waiting: what
	 * React's `AgainLine` draws too.
	 *
	 * @param {{active: boolean, trying: boolean, last: number|null, offline?: boolean}} moments
	 * @param {{labels?: object, locale?: string, now?: number}} [options]
	 */
	static say(moments, { labels = {}, locale = undefined, now = Date.now() } = {}) {
		const words = labels instanceof Labels ? labels : new Labels(copy, labels, locale);
		return AgainLine.#say(moments, words, new TimeWords(words, locale), now);
	}

	static #say({ active, trying, last, offline = false }, labels, words, now) {
		if (trying) return labels.text('trying');
		if (!active || last === null) return '';
		return labels.text(offline ? 'away' : 'tried', { time: words.at(last, now) });
	}

	#draw(moments) {
		const text = AgainLine.#say(moments, this.#labels, this.#words, this.#clock());
		this.#element.dataset.again = moments.trying ? 'trying' : moments.offline ? 'offline' : 'waiting';
		this.#element.hidden = !text;
		if (this.#element.textContent !== text) this.#element.textContent = text;
	}
}
