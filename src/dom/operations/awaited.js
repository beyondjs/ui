import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { Button } from '../button.js';
import { Unavailable } from '../unavailable.js';
import { Clock } from '../time/clock.js';
import { TimeWords } from '../time/words.js';
import { Announcer } from './announcer.js';
import { Bound } from './bound.js';
import { TechnicalDetails } from './details.js';
import { Steps } from './steps.js';
import { Timing } from './timing.js';
import { awaited as copy } from './labels.js';

/**
 * One card that moves while a person waits on an operation (decision E52, generalized for the family):
 *
 * - a title of what is happening ("Starting My first VM") and since when;
 * - the time left of the usual one ("About 1 min left", measured against the median, then the 90th
 *   percentile), and past the 90th percentile "Taking longer than usual" with **Check again**;
 * - a bar toward the usual time that only the end completes, indeterminate when the time cannot be
 *   told or has passed;
 * - the operation's `Steps`, when given;
 * - once a reason is known, why it cannot continue and the way on, in place of the time.
 *
 * It is drawn from the given record and the clock only, so a reload shows the same; the clock keeps
 * it current without events. **Check again** runs the product's `check` once at a time and shows it
 * is running. `end()` completes it, announces the end and calls `onend(outcome)`, where a product says
 * "Ready · …" in the tab's title or moves on. A polite live region says when it becomes slow, when a
 * reason arrives and when it ends; never the ticking time.
 */
export class Awaited extends Component {
	/** The copy in English and Spanish (`labels.steps` and `labels.details` reach the parts). */
	static labels = copy;

	#element;
	#labels;
	#words;
	#clock;
	#options;
	#parts = {};
	#announcer = new Announcer();
	#steps = null;
	#details = null;
	#action = null;
	#again;
	#ended = null;
	#state = null;
	#release;

	/**
	 * @param {object} options
	 * @param {string} options.title what is happening
	 * @param {string|number|Date|null} [options.since] when it began
	 * @param {{median: number, p90?: number}|null} [options.expected] how long it usually takes, in ms
	 * @param {Array<object>|null} [options.steps] the operation's steps (see `Steps`)
	 * @param {{text: string, way?: string, action?: {label: string, href?: string, run?: () => void}, details?: object}|null} [options.reason]
	 * @param {(() => Promise<unknown>)|null} [options.check] reads the operation again
	 * @param {number} [options.bound] how long a check may take before it is said not to have finished (0.7.4; 20 s)
	 * @param {(outcome: 'done'|'failed') => void} [options.onend]
	 * @param {Clock} [options.clock] the page's clock (`Clock.system`)
	 * @param {2|3|4|5|6} [options.level] the title's heading level (2)
	 */
	constructor({ title, since = null, expected = null, steps = null, reason = null, check = null, bound = Bound.limit, onend = null, clock = Clock.system, locale = undefined, level = 2, labels = {} }) {
		super();
		const { steps: words = {}, details = {}, ...own } = labels ?? {};
		this.#labels = new Labels(copy.en, own);
		this.#words = new TimeWords(this.#labels, locale);
		this.#clock = clock;
		this.#options = { title, since, expected, steps, reason, check, bound, onend, locale, words, details };
		const id = Ids.next('bui-awaited');
		const parts = (this.#parts = {
			mark: el('span', { class: 'bui-awaited-mark', 'aria-hidden': 'true' }),
			title: el(`h${Unavailable.level(level)}`, { id, class: 'bui-awaited-title' }),
			since: el('p', { class: 'bui-awaited-since' }),
			time: el('span', { class: 'bui-awaited-time' }),
			bar: el('progress', { class: 'bui-awaited-bar', max: '1' }),
			body: el('div', { class: 'bui-awaited-body' }),
			reason: el('div', { class: 'bui-awaited-reason' }),
			note: el('p', { class: 'bui-awaited-note', role: 'status' }),
			actions: el('div', { class: 'bui-awaited-actions' })
		});
		this.#again = new Button({ label: this.#labels.text('check'), onclick: () => this.again() });
		parts.actions.append(this.#again.element, parts.note);
		this.#element = el('section', { class: 'bui-awaited', 'aria-labelledby': id }, [
			el('div', { class: 'bui-awaited-head' }, [parts.mark, el('div', { class: 'bui-awaited-heading' }, [parts.title, parts.since]), parts.time]),
			parts.bar,
			parts.body,
			parts.reason,
			parts.actions,
			this.#announcer.element
		]);
		this.#draw();
		this.#release = clock.subscribe(() => this.tick());
	}

	get element() {
		return this.#element;
	}

	/** `progress`, `late` (at or past the median), `slow` (past the 90th percentile), `stalled`, `done` or `failed`. */
	get state() {
		return this.#state;
	}

	/** The outcome given to `end()`, or null while it runs. */
	get ended() {
		return this.#ended;
	}

	/** The words last announced. */
	get announced() {
		return this.#announcer.text;
	}

	/** The steps inside, or null. */
	get steps() {
		return this.#steps;
	}

	/** Replaces any of `title`, `since`, `expected`, `steps`, `reason` and `check`, and redraws. */
	update(values = {}) {
		this.#options = { ...this.#options, ...values };
		this.#draw();
	}

	/** Re-evaluates the time, the bar and the state against the clock now. */
	tick() {
		if (!this.destroyed) this.#measure();
	}

	/** Runs `check` once at a time; a failure says so in place. Resolves when it settled. */
	async again() {
		const check = this.#options.check;
		if (!check || this.#again.busy) return;
		this.#parts.note.textContent = '';
		try {
			await this.#again.run(() => Bound.run(check, this.#options.bound));
		} catch {
			if (!this.destroyed) this.#parts.note.textContent = this.#labels.text('unchecked');
		}
	}

	/** Ends the wait: the bar completes for `done`, the end is announced and `onend` runs, once. */
	end(outcome = 'done') {
		if (this.#ended || this.destroyed) return;
		this.#ended = outcome === 'failed' ? 'failed' : 'done';
		this.#measure();
		this.#options.onend?.(this.#ended);
	}

	destroy() {
		this.#release();
		this.#steps?.destroy();
		this.#details?.destroy();
		this.#action?.destroy();
		this.#again.destroy();
		super.destroy();
	}

	get #title() {
		const title = this.#options.title;
		return typeof title === 'string' ? title : (title?.textContent ?? '');
	}

	#draw() {
		const { title, steps, reason } = this.#options;
		fill(this.#parts.title, [content(title)]);
		this.#parts.bar.setAttribute('aria-label', this.#labels.text('progress', { title: this.#title }));
		if (Array.isArray(steps)) {
			if (this.#steps) this.#steps.steps = steps;
			else this.#steps = new Steps({ label: this.#title, steps, clock: this.#clock, locale: this.#options.locale, labels: { ...this.#options.words, details: this.#options.details } }).mount(this.#parts.body);
		} else {
			this.#steps?.destroy();
			this.#steps = null;
		}
		this.#reason(reason);
		this.#measure();
	}

	#reason(reason) {
		this.#details?.destroy();
		this.#action?.destroy();
		this.#details = reason?.details ? new TechnicalDetails({ ...reason.details, locale: this.#options.locale, labels: this.#options.details }) : null;
		const action = reason?.action?.label ? reason.action : null;
		this.#action = action ? new Button({ label: action.label, href: action.href ?? null, variant: 'primary', onclick: action.href ? null : () => action.run?.() }) : null;
		fill(this.#parts.reason, reason?.text ? [el('p', { class: 'bui-awaited-why' }, [content(reason.text), reason.way ? ' ' : null, reason.way ? content(reason.way) : null]), this.#action?.element, this.#details?.element] : []);
	}

	#measure() {
		const { since, expected, reason, check } = this.#options;
		const now = this.#clock.now;
		const timing = new Timing({ since, expected }, now);
		const state = this.#ended ?? (reason?.text ? 'stalled' : timing.slow ? 'slow' : timing.late ? 'late' : 'progress');
		const { mark, since: start, time, bar, reason: why, actions } = this.#parts;
		const moment = TimeWords.moment(since);
		start.textContent = moment === null ? '' : this.#labels.text('since', { time: this.#words.at(moment, now) });
		start.hidden = moment === null;
		time.textContent = this.#time(state, timing);
		bar.hidden = state === 'stalled' || state === 'failed';
		if (state === 'done') bar.value = 1;
		else if (timing.fraction === null) bar.removeAttribute('value');
		else bar.value = timing.fraction;
		bar.setAttribute('aria-valuetext', time.textContent || this.#labels.text('unknown'));
		why.hidden = state !== 'stalled';
		actions.hidden = !check || !(state === 'slow' || state === 'stalled');
		this.#element.dataset.state = state;
		if (state !== this.#state) {
			fill(mark, [state === 'done' ? glyph('check') : state === 'stalled' || state === 'failed' ? glyph('alert') : el('span', { class: 'bui-spinner' })]);
			if (this.#state !== null) this.#announce(state);
			this.#state = state;
		}
	}

	#time(state, timing) {
		if (state === 'done' || state === 'failed') return this.#labels.text(state);
		if (state === 'stalled') return '';
		if (state === 'slow') return this.#labels.text('slow');
		const remaining = timing.remaining;
		if (remaining === null) return '';
		return remaining < 60_000 ? this.#labels.text('brief') : this.#labels.text('left', { duration: this.#words.left(remaining) });
	}

	#announce(state) {
		const title = this.#title;
		const key = { slow: 'late', stalled: 'blocked', done: 'ended', failed: 'stopped' }[state];
		const reason = this.#options.reason?.text;
		if (key) this.#announcer.say(this.#labels.text(key, { title, reason: typeof reason === 'string' ? reason : (reason?.textContent ?? '') }));
	}
}
