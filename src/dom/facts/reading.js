import { TimeWords } from '../time/words.js';

const levels = Object.freeze({ warning: 0.8, danger: 0.95 });

/**
 * What a `Meter` says at one moment: its level past the thresholds, the percent, the fill, the note
 * (the reset ahead, a reset that has passed, or a report that is not current) and the words of its
 * `aria-valuetext`. Computed afresh for each update; it keeps no state of its own after that.
 */
export class MeterReading {
	static thresholds = levels;

	#level;
	#percent = null;
	#share = 0;
	#now = 0;
	#word = null;
	#note = null;
	#stale = false;
	#pending = false;
	#text;

	/**
	 * @param {object} values the meter's values with `now` (the clock's time), `words` (`TimeWords`) and `labels`
	 */
	constructor({ value, reset, stale, thresholds, now, words, labels }) {
		const { warning, danger } = MeterReading.#limits(thresholds);
		const known = typeof value === 'number' && Number.isFinite(value);
		const used = known ? Math.max(0, value) : null;
		this.#level = used === null ? 'unknown' : used >= 1 ? 'full' : used >= danger ? 'danger' : used >= warning ? 'warning' : 'ok';
		if (used !== null) {
			this.#percent = new Intl.NumberFormat(words.locale, { style: 'percent', maximumFractionDigits: 0 }).format(used);
			this.#share = Math.min(1, used);
			this.#now = Math.round(used * 100);
			this.#word = ['warning', 'danger', 'full'].includes(this.#level) ? labels.text(this.#level) : null;
		}
		const moment = MeterReading.#moment(reset);
		const passed = moment !== null && moment <= now;
		this.#pending = moment !== null && !passed;
		if (stale) {
			this.#stale = true;
			const at = MeterReading.#moment(stale);
			const since = at !== null ? words.at(at, now) : typeof stale === 'string' ? stale : null;
			this.#note = since ? labels.text('stale', { time: since }) : labels.text('unreported');
		} else if (passed) {
			this.#stale = true;
			this.#note = labels.text('passed', { time: words.at(moment, now) });
		} else if (moment !== null) this.#note = labels.text('reset', { time: words.at(moment, now) });
		else if (reset) this.#note = String(reset);
		const use = used === null ? labels.text('unknown') : labels.text('used', { percent: this.#percent });
		this.#text = [use, this.#word, this.#note].filter(Boolean).join(' · ');
	}

	get level() {
		return this.#level;
	}

	/** The share used in the page's words ("42 %"), or null when not reported. */
	get percent() {
		return this.#percent;
	}

	/** The fill, 0 to 1. */
	get share() {
		return this.#share;
	}

	/** `aria-valuenow`: whole percent, 0 when not reported. */
	get now() {
		return this.#now;
	}

	/** The level in words past a threshold, or null. */
	get word() {
		return this.#word;
	}

	get note() {
		return this.#note;
	}

	get stale() {
		return this.#stale;
	}

	/** Whether a reset moment is still ahead (the meter then watches the clock). */
	get pending() {
		return this.#pending;
	}

	/** `aria-valuetext`: the use, the level and the note. */
	get text() {
		return this.#text;
	}

	/** A moment from a Date, a number or an ISO string; other text is the product's own words (null here). */
	static #moment(value) {
		if (typeof value === 'string' && !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
		if (value === true || value === false) return null;
		return TimeWords.moment(value);
	}

	static #limits(thresholds) {
		const warning = thresholds?.warning ?? levels.warning;
		const danger = thresholds?.danger ?? levels.danger;
		if (![warning, danger].every(limit => typeof limit === 'number' && limit > 0 && limit <= 1) || warning > danger) throw new RangeError("A meter's thresholds are shares from 0 to 1, the warning at most the danger");
		return { warning, danger };
	}
}
