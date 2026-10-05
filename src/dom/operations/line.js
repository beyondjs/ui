import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Labels } from '../core/labels.js';
import { Clock } from '../time/clock.js';
import { TimeWords } from '../time/words.js';
import { Announcer } from './announcer.js';
import { Bound } from './bound.js';
import { Timing } from './timing.js';
import { line as copy } from './labels.js';

/**
 * `Awaited` in one line, for a row of a list (design S5, decision D50): "Cloning · 40 s so far ·
 * usually about 1 min", with the card's thresholds and announcements and no card.
 *
 * Before the median it says the time so far and the usual time; past the 90th percentile, strictly,
 * "Taking longer than usual · 12 min so far" and, with `check`, **Check again** (one run at a time);
 * with a `reason` it says why it cannot continue instead of the time; `end()` says "Done · took 52 s"
 * or "Did not finish". It is drawn from the record and the clock only, so a reload shows the same, and
 * a polite live region says only changes of state (slow, blocked, the end), never the ticking time.
 * Without an `expected` duration it says the time so far alone, never a guess.
 */
export class AwaitedLine extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;

	#element;
	#labels;
	#words;
	#clock;
	#options;
	#parts;
	#announcer = new Announcer();
	#state = null;
	#ended = null;
	#checking = false;
	#took = null;
	#release;

	/**
	 * @param {object} options
	 * @param {string|Node} options.title what is happening ("Cloning")
	 * @param {string|number|Date|null} [options.since] when it began
	 * @param {{median: number, p90?: number}|null} [options.expected] how long it usually takes, in ms
	 * @param {string|Node|null} [options.reason] why it cannot continue
	 * @param {(() => Promise<unknown>)|null} [options.check] reads the operation again
	 * @param {(outcome: 'done'|'failed') => void} [options.onend]
	 * @param {Clock} [options.clock] the page's clock (`Clock.system`)
	 */
	constructor({ title, since = null, expected = null, reason = null, check = null, bound = Bound.limit, onend = null, clock = Clock.system, locale = undefined, labels = {} }) {
		super();
		this.#labels = new Labels(copy.en, labels);
		this.#words = new TimeWords(this.#labels, locale);
		this.#clock = clock;
		this.#options = { title, since, expected, reason, check, bound, onend };
		this.#parts = {
			mark: el('span', { class: 'bui-line-mark', 'aria-hidden': 'true' }),
			title: el('span', { class: 'bui-line-title' }),
			time: el('span', { class: 'bui-line-time' }),
			check: el('button', { type: 'button', class: 'bui-link-button bui-line-check', hidden: true, onclick: () => this.again() }, [this.#labels.text('check')]),
			note: el('span', { class: 'bui-line-note', role: 'status' })
		};
		const { mark, title: name, time, check: again, note } = this.#parts;
		this.#element = el('span', { class: 'bui-line' }, [mark, name, el('span', { class: 'bui-line-dot', 'aria-hidden': 'true', text: '·' }), time, again, note, this.#announcer.element]);
		this.#draw();
		this.#release = clock.subscribe(() => this.tick());
	}

	get element() {
		return this.#element;
	}

	/** `progress`, `late`, `slow`, `stalled`, `done` or `failed`, as `Awaited`. */
	get state() {
		return this.#state;
	}

	get ended() {
		return this.#ended;
	}

	/** The words last announced. */
	get announced() {
		return this.#announcer.text;
	}

	/** The line as it reads: the title and its time or reason. */
	get text() {
		return [this.#parts.title.textContent, this.#parts.time.textContent].filter(Boolean).join(' · ');
	}

	/** Replaces any of `title`, `since`, `expected`, `reason` and `check`, and redraws. */
	update(values = {}) {
		this.#options = { ...this.#options, ...values };
		this.#draw();
	}

	tick() {
		if (!this.destroyed) this.#measure();
	}

	/** Runs `check` once at a time; a failure says so in place. */
	async again() {
		const check = this.#options.check;
		if (!check || this.#checking) return;
		this.#checking = true;
		this.#parts.check.setAttribute('aria-disabled', 'true');
		this.#parts.note.textContent = '';
		try {
			// Bounded (D40, 0.7.4): a check that never settles still ends
			await Bound.run(check, this.#options.bound);
		} catch {
			if (!this.destroyed) this.#parts.note.textContent = this.#labels.text('unchecked');
		} finally {
			this.#checking = false;
			this.#parts.check.removeAttribute('aria-disabled');
		}
	}

	/** Ends the wait once: says how long it took (or that it did not finish), announces it and calls `onend`. */
	end(outcome = 'done') {
		if (this.#ended || this.destroyed) return;
		this.#ended = outcome === 'failed' ? 'failed' : 'done';
		this.#took = this.#clock.now;
		this.#measure();
		this.#options.onend?.(this.#ended);
	}

	destroy() {
		this.#release();
		super.destroy();
	}

	get #title() {
		const title = this.#options.title;
		return typeof title === 'string' ? title : (title?.textContent ?? '');
	}

	#draw() {
		fill(this.#parts.title, [content(this.#options.title)]);
		this.#measure();
	}

	#measure() {
		const { since, expected, reason, check } = this.#options;
		const timing = new Timing({ since, expected, until: this.#took }, this.#clock.now);
		const stalled = Boolean(reason) && !this.#ended;
		const state = this.#ended ?? (stalled ? 'stalled' : timing.slow ? 'slow' : timing.late ? 'late' : 'progress');
		fill(this.#parts.time, stalled ? [content(reason)] : [this.#time(state, timing)]);
		this.#parts.check.hidden = !check || !(state === 'slow' || state === 'stalled');
		this.#element.dataset.state = state;
		if (state === this.#state) return;
		fill(this.#parts.mark, [state === 'done' ? glyph('check') : state === 'stalled' || state === 'failed' ? glyph('alert') : el('span', { class: 'bui-spinner' })]);
		if (this.#state !== null) this.#announce(state);
		this.#state = state;
	}

	#time(state, timing) {
		const elapsed = timing.elapsed;
		if (state === 'failed') return this.#labels.text('failed');
		if (state === 'done') return elapsed === null ? this.#labels.text('done') : this.#labels.text('took', { duration: this.#words.exact(elapsed) });
		if (elapsed === null) return '';
		const words = { elapsed: this.#words.exact(elapsed) };
		if (state === 'slow') return this.#labels.text('slow', words);
		if (timing.median === null) return this.#labels.text('running', words);
		return this.#labels.text('usual', { ...words, expected: this.#words.rough(timing.median) });
	}

	#announce(state) {
		const key = { slow: 'late', stalled: 'blocked', done: 'ended', failed: 'stopped' }[state];
		const reason = this.#options.reason;
		if (key) this.#announcer.say(this.#labels.text(key, { title: this.#title, reason: typeof reason === 'string' ? reason : (reason?.textContent ?? '') }));
	}
}
