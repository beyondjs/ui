import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { Labels } from '../core/labels.js';
import { Clock } from '../time/clock.js';
import { TimeWords } from '../time/words.js';
import { freshness as copy } from './labels.js';

/**
 * A state with how fresh it is (decision D50): the state's word with its dot ("Running"), then
 * "Checked 2 min ago", kept current by the clock. While the source is disconnected it reads "Last
 * known: Running · 10:42" with a neutral dot, so a lost live channel never reads as the work having
 * stopped (long operations, rule 6). The words always carry the meaning, never the color alone.
 *
 * The tone is one of the status tones (`neutral`, `success`, `warning`, `danger`, `info`,
 * `progress`); a product with the availability vocabulary passes its entry's `label` and `tone`.
 */
export class Freshness extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;
	/** Under this many milliseconds since the check it reads "Checked just now". */
	static recent = 5000;

	#element;
	#state;
	#age;
	#labels;
	#words;
	#clock;
	#values;
	#release;

	/**
	 * @param {object} options
	 * @param {string} options.label the state's word ("Running")
	 * @param {string} [options.tone] its status tone (`neutral`)
	 * @param {string|number|Date|null} [options.checked] when the source last confirmed it
	 * @param {boolean} [options.connected] false while the source is disconnected: the last known form
	 * @param {Clock} [options.clock] the page's clock (`Clock.system`)
	 * @param {string} [options.locale] the language of times of day
	 */
	constructor({ label, tone = 'neutral', checked = null, connected = true, clock = Clock.system, locale = undefined, labels = {} }) {
		super();
		this.#labels = new Labels(copy.en, labels);
		this.#words = new TimeWords(this.#labels, locale);
		this.#clock = clock;
		this.#values = { label, tone, checked, connected };
		this.#state = el('span', { class: 'bui-status' }, [el('span', { class: 'bui-status-dot', 'aria-hidden': 'true' }), el('span', { class: 'bui-freshness-state' })]);
		this.#age = el('span', { class: 'bui-freshness-age' });
		this.#element = el('span', { class: 'bui-freshness' }, [this.#state, this.#age]);
		this.#draw();
		this.#release = clock.subscribe(() => this.tick());
	}

	get element() {
		return this.#element;
	}

	/** Whether it shows the last known form. */
	get stale() {
		return !this.#values.connected;
	}

	/** The words shown, state and age together, as a reader hears them. */
	get text() {
		return [this.#state.textContent, this.#age.textContent].filter(Boolean).join(' · ');
	}

	/** Replaces any of `label`, `tone`, `checked` and `connected`. */
	update(values = {}) {
		this.#values = { ...this.#values, ...values };
		this.#draw();
	}

	/** Brings "Checked … ago" up to date with the clock. */
	tick() {
		if (!this.destroyed) this.#draw();
	}

	destroy() {
		this.#release();
		super.destroy();
	}

	#draw() {
		const { label, tone, checked, connected } = this.#values;
		const now = this.#clock.now;
		const moment = TimeWords.moment(checked);
		const known = connected ? label : moment === null ? this.#labels.text('last', { state: label }) : this.#labels.text('known', { state: label, time: this.#words.at(moment, now) });
		this.#state.className = `bui-status bui-status-${connected ? tone : 'neutral'}`;
		this.#element.classList.toggle('bui-freshness-stale', !connected);
		Freshness.#write(this.#state.lastChild, known);
		const age = connected && moment !== null ? this.#ago(now - moment) : '';
		Freshness.#write(this.#age, age);
		this.#age.hidden = !age;
	}

	#ago(elapsed) {
		if (elapsed < Freshness.recent) return this.#labels.text('now');
		return this.#labels.text('checked', { duration: this.#words.rough(elapsed) });
	}

	static #write(node, text) {
		if (node.textContent !== text) node.textContent = text;
	}
}
