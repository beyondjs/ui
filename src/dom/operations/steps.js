import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { Labels } from '../core/labels.js';
import { Clock } from '../time/clock.js';
import { TimeWords } from '../time/words.js';
import { Announcer } from './announcer.js';
import { StepView } from './step.js';
import { steps as copy } from './labels.js';

/**
 * The steps of a long operation, each with what its time says (decision D50, long operations).
 *
 * Each step is `{ id?, label, state, since?, until?, expected?: { median, p90 }, phase?: { label,
 * since }, reason?: string | { text, details?: { text, request, time } } }` with `state` one of
 * `done`, `progress`, `stalled` (it finished its part and something else blocks it), `failed` and
 * `waiting` (not begun). A finished step says how long it took; the step in progress how long it has
 * run against "usually about {median}", and past its 90th percentile (not the median) "Taking longer
 * than usual"; a blocked or failed step says its reason, with "Technical details" folded under it.
 * Every state is said in words, never by color alone.
 *
 * What it shows is computed from the given steps and the clock only, so a reload shows the same. The
 * clock re-evaluates the times on its beat (not only when new steps arrive), and a polite live region
 * announces each change of a step's state and a step that becomes slow, never the ticking times.
 * With `announce: false` (0.10.0) the steps have no live region of their own, for a page that already
 * says changes through one region (a plan inside a conversation); `announced` still holds the words.
 * Nothing moves under reduced motion.
 */
export class Steps extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;

	#element;
	#list;
	#labels;
	#words;
	#clock;
	#locale;
	#details;
	#announcer = new Announcer();
	#views = [];
	#slow = new Set();
	#release;

	/**
	 * @param {object} options
	 * @param {string} options.label the list's name, for assistive technology ("Preparing My first VM")
	 * @param {Array<object>} [options.steps]
	 * @param {Clock} [options.clock] the page's clock (`Clock.system`)
	 * @param {string} [options.locale] the language of times of day
	 * @param {object} [options.labels] replaces entries of `Steps.labels.en`; `labels.details` those of the technical details
	 * @param {boolean} [options.announce] whether the steps say their changes in a live region of their own (default true)
	 */
	constructor({ label, steps = [], clock = Clock.system, locale = undefined, labels = {}, announce = true }) {
		super();
		const { details = {}, ...own } = labels ?? {};
		this.#labels = new Labels(copy.en, own);
		this.#details = details;
		this.#words = new TimeWords(this.#labels, locale);
		this.#clock = clock;
		this.#locale = locale;
		this.#list = el('ol', { class: 'bui-steps-list', 'aria-label': label });
		// Without its own region the words are still kept (`announced`), for the page's one region to say
		this.#element = el('div', { class: 'bui-steps' }, [this.#list, announce === false ? null : this.#announcer.element]);
		this.#draw(steps, false);
		this.#release = clock.subscribe(() => this.tick());
	}

	get element() {
		return this.#element;
	}

	/** The words last announced. */
	get announced() {
		return this.#announcer.text;
	}

	/** The steps as normalized: each with `key`, `state` and its times in milliseconds. */
	get steps() {
		return this.#views.map(view => ({ key: view.key, label: view.label, state: view.state }));
	}

	/** Replaces the steps; a step whose state changed (by `id`, else by place) is announced. */
	set steps(steps) {
		this.#draw(steps ?? [], true);
	}

	/** Re-evaluates every time against the clock now; announces a step that just became slow. */
	tick() {
		if (this.destroyed) return;
		const now = this.#clock.now;
		const late = [];
		for (const view of this.#views) {
			const slow = view.measure(now);
			if (slow && !this.#slow.has(view.key)) late.push(this.#labels.text('late', { step: view.label }));
			if (slow) this.#slow.add(view.key);
			else this.#slow.delete(view.key);
		}
		this.#announcer.say(...late);
	}

	destroy() {
		this.#release();
		for (const view of this.#views) view.destroy();
		this.#views = [];
		super.destroy();
	}

	#draw(steps, announce) {
		const before = new Map(this.#views.map(view => [view.key, view.state]));
		for (const view of this.#views) view.destroy();
		const context = { labels: this.#labels, words: this.#words, locale: this.#locale, details: this.#details };
		this.#views = steps.filter(Boolean).map((step, index) => new StepView(StepView.state(step, index), index, context));
		this.#list.replaceChildren(...this.#views.map(view => view.element));
		const changed = announce ? this.#views.filter(view => before.has(view.key) && before.get(view.key) !== view.state) : [];
		// A step that has just become slow is said by the tick; one already slow when drawn is not repeated.
		const now = this.#clock.now;
		const slow = new Set(this.#views.filter(view => view.measure(now)).map(view => view.key));
		const late = announce ? this.#views.filter(view => slow.has(view.key) && !this.#slow.has(view.key) && !changed.includes(view)) : [];
		this.#slow = slow;
		this.#announcer.say(
			...changed.map(view => this.#labels.text('change', { step: view.label, state: this.#labels.text(view.state) })),
			...late.map(view => this.#labels.text('late', { step: view.label }))
		);
	}
}
