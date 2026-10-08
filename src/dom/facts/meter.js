import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { Clock } from '../time/clock.js';
import { TimeWords } from '../time/words.js';
import { MeterReading } from './reading.js';
import { meter as copy } from './labels.js';

/**
 * A use against a limit (0.11.0), such as an AI engine's usage window, a budget or a quota: its label,
 * the share used (`value`, 0 to 1), the level past its thresholds said in words ("Near the limit",
 * "Almost at the limit", "Limit reached"; never color alone), and when it resets.
 *
 * A report that is not current is said, never shown as now: `stale` ("Not reported since 23:10") mutes
 * the track and the value; a `reset` moment that has passed says "Reset since {time} · use not reported
 * since" by itself, on the page's `Clock`, since the use after a reset is unknown until reported again.
 * A `value` of null is "Not reported".
 *
 * The track is `role="meter"` named by the label, with `aria-valuenow` in percent and an
 * `aria-valuetext` that says the use, the level and the reset or the staleness in words. The fill
 * moves with `--motion-standard`, and not at all under reduced motion.
 */
export class Meter extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;
	/** The default thresholds: a warning from 0.8, danger from 0.95. */
	static thresholds = MeterReading.thresholds;

	#element;
	#name = el('span', { class: 'bui-meter-label' });
	#amount = el('span', { class: 'bui-meter-value', 'aria-hidden': 'true' });
	#word = el('span', { class: 'bui-meter-word', 'aria-hidden': 'true' });
	#fill = el('span', { class: 'bui-meter-fill' });
	#track;
	#note = el('p', { class: 'bui-meter-note', 'aria-hidden': 'true' });
	#values = { label: '', value: null, reset: null, stale: null, thresholds: null };
	#labels;
	#words;
	#clock;
	#release = null;

	/**
	 * @param {object} options
	 * @param {string} options.label what is measured ("5-hour window")
	 * @param {number|null} [options.value] the share used, 0 to 1 (more than 1 is past the limit); null when not reported
	 * @param {string|import('../operations/steps.js').Moment|null} [options.reset] when it resets: the product's words, or a moment ("Resets 23:10")
	 * @param {boolean|string|import('../operations/steps.js').Moment|null} [options.stale] not current: since a moment, the product's time words, or true
	 * @param {{warning?: number, danger?: number}|null} [options.thresholds] where the levels start (0.8 and 0.95 by default)
	 * @param {Clock} [options.clock] the page's clock, which decides when a reset has passed
	 * @param {string} [options.locale] a BCP 47 tag for the percent and the times
	 * @param {object} [options.labels]
	 */
	constructor({ label, value = null, reset = null, stale = null, thresholds = null, clock = Clock.system, locale = undefined, labels = {} }) {
		super();
		this.#labels = new Labels(copy.en, labels);
		this.#words = new TimeWords(this.#labels, locale);
		this.#clock = clock;
		this.#name.id = Ids.next('bui-meter');
		this.#track = el('div', { class: 'bui-meter-track', role: 'meter', 'aria-labelledby': this.#name.id, 'aria-valuemin': '0', 'aria-valuemax': '100' }, [this.#fill]);
		this.#element = el('div', { class: 'bui-meter' }, [el('div', { class: 'bui-meter-head' }, [this.#name, this.#amount, this.#word]), this.#track, this.#note]);
		this.update({ label, value, reset, stale, thresholds });
	}

	get element() {
		return this.#element;
	}

	/** The `role="meter"` element. */
	get track() {
		return this.#track;
	}

	/** `ok`, `warning`, `danger`, `full` or `unknown`. */
	get level() {
		return this.#element.dataset.level;
	}

	/** Whether the report is not current: stale, or reset since. */
	get stale() {
		return this.#element.hasAttribute('data-stale');
	}

	/** Changes what is given: `label`, `value`, `reset`, `stale`, `thresholds`. */
	update(values) {
		for (const key of Object.keys(this.#values)) if (key in values) this.#values[key] = values[key];
		const reading = new MeterReading({ ...this.#values, now: this.#clock.now, words: this.#words, labels: this.#labels });
		this.#draw(reading);
		this.#watch(reading.pending);
		return this;
	}

	destroy() {
		this.#release?.();
		this.#release = null;
		super.destroy();
	}

	#draw(reading) {
		this.#name.textContent = this.#values.label ?? '';
		this.#element.dataset.level = reading.level;
		this.#element.toggleAttribute('data-stale', reading.stale);
		this.#amount.textContent = reading.percent ?? this.#labels.text('unknown');
		this.#word.textContent = reading.word ?? '';
		this.#word.hidden = !reading.word;
		this.#fill.style.setProperty('--bui-meter', String(reading.share));
		this.#track.setAttribute('aria-valuenow', String(reading.now));
		this.#track.setAttribute('aria-valuetext', reading.text);
		this.#note.textContent = reading.note ?? '';
		this.#note.hidden = !reading.note;
	}

	/** While a reset moment is ahead, the clock's beat finds the moment it passes. */
	#watch(pending) {
		if (pending && !this.#release) this.#release = this.#clock.subscribe(() => this.update({}));
		else if (!pending && this.#release) {
			this.#release();
			this.#release = null;
		}
	}
}
