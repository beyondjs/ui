import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { Clock } from '../time/clock.js';
import { TimeWords } from '../time/words.js';
import { ActivityHead } from './head.js';
import { ActivityExchange } from './exchange.js';
import { ActivitySection } from './section.js';
import { activity as copy } from './labels.js';

/**
 * One step of work in a feed of activity, such as a tool call of a coding agent: a disclosure row with
 * the kind's glyph, a title ("Ran npm test"), its meta in words ("exit 1", "+12 −3"), its state
 * (`running`, `done`, `failed`, `denied` or `waiting`) in words and, when the product gives the times,
 * how long it took or has run on the page's `Clock`.
 *
 * Opening it builds its body once, from `body()`: nodes, components or section records such as
 * `{ label: 'Output', text }` (`ActivitySection`: the first 12 lines, "Show all", "Copy"), or
 * `{ exchange: [{ label: 'In', text }, { label: 'Out', text }] }` for what a step was given and gave back
 * in one box (`ActivityExchange`, 0.12.0). `update()`
 * patches only what changed, so a live change keeps the row open or closed and keeps focus; a new
 * `body` is built again at once when open, at the next opening otherwise. A running row may show the
 * last lines of its output under it (`tail`), which the product clears when the step ends. A row
 * without a body is plain text. `watch(listener)` hears every update (an `ActivityGroup` follows its
 * rows with it). Times are never announced; the page's own live region says what matters.
 */
export class ActivityRow extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;
	static states = ActivityHead.states;
	/** The lines of a live tail kept under a running row. */
	static tail = 6;

	#element;
	#head = null;
	#tail = el('pre', { class: 'bui-activity-tail', hidden: true });
	#whole = el('p', { class: 'bui-activity-whole', hidden: true });
	#content = el('div', { class: 'bui-activity-content' });
	#body;
	#labels;
	#words;
	#clock;
	#values = { glyph: 'box', title: '', meta: null, state: 'done', since: null, until: null, duration: null, tail: null };
	#builder = null;
	#built = false;
	#stale = false;
	#open = false;
	#release = null;
	#watchers = new Set();

	/**
	 * @param {object} options
	 * @param {string} [options.glyph] a name of the icon catalog for the kind of work (default `box`)
	 * @param {string|Node} options.title what was done, in the product's words
	 * @param {string|Node|null} [options.meta] its result in words
	 * @param {'running'|'done'|'failed'|'denied'|'waiting'} [options.state] (default `done`; anything else reads as `waiting`)
	 * @param {string|number|Date|null} [options.since] when it started: a running row counts from it
	 * @param {string|number|Date|null} [options.until] when it ended: with `since`, how long it took
	 * @param {number|null} [options.duration] how long it took, in milliseconds, when the times are not known
	 * @param {string|null} [options.tail] the last output of a running step, shown under the row
	 * @param {(() => unknown)|unknown[]|Node|null} [options.body] what opening shows, built on first open
	 * @param {boolean} [options.open] opened at once
	 */
	constructor({ glyph = 'box', title, meta = null, state = 'done', since = null, until = null, duration = null, tail = null, body = null, open = false, clock = Clock.system, locale = undefined, labels = {} }) {
		super();
		this.#labels = new Labels(copy.en, labels);
		this.#words = new TimeWords(this.#labels, locale);
		this.#clock = clock;
		this.#body = el('div', { id: Ids.next('bui-activity'), class: 'bui-activity-body', hidden: true }, [this.#whole, this.#content]);
		this.#element = el('div', { class: 'bui-activity' }, [this.#tail, this.#body]);
		this.update({ glyph, title, meta, state, since, until, duration, tail, body });
		if (open) this.open();
	}

	get element() {
		return this.#element;
	}

	get state() {
		return this.#values.state;
	}

	/** Whether the body is shown. */
	get expanded() {
		return this.#open;
	}

	/** The body's element, once built (for a product that patches its own content). */
	get body() {
		return this.#content;
	}

	/**
	 * Changes what is given (`glyph`, `title`, `meta`, `state`, `since`, `until`, `duration`, `tail`,
	 * `body`) and leaves the rest, the open state and focus as they are.
	 */
	update(values = {}) {
		if (this.destroyed) return this;
		const given = key => Object.hasOwn(values, key);
		for (const key of Object.keys(this.#values)) if (given(key)) this.#values[key] = values[key];
		this.#values.state = ActivityHead.state(this.#values.state);
		if (given('body') || !this.#head) this.#holder(given('body') ? values.body : null);
		const head = this.#head;
		head.glyph = this.#values.glyph ?? 'box';
		head.title = this.#values.title ?? '';
		head.meta = this.#values.meta;
		head.state = this.#values.state;
		this.#element.dataset.state = this.#values.state;
		if (given('tail')) this.#write(this.#values.tail);
		this.#measure(this.#clock.now);
		this.#follow();
		for (const watcher of [...this.#watchers]) watcher(this);
		return this;
	}

	open() {
		if (this.#open || !this.#builder || this.destroyed) return;
		this.#open = true;
		if (!this.#built || this.#stale) this.#build();
		// A title cut in the head is shown whole at the top of the body (D44)
		this.#whole.hidden = !this.#head.cut;
		this.#whole.textContent = this.#whole.hidden ? '' : this.#head.text;
		this.#body.hidden = false;
		this.#head.expanded = true;
	}

	/** Closes the body; focus inside it goes back to the row's button. */
	close() {
		if (!this.#open) return;
		const inside = this.#body.contains(this.#element.ownerDocument.activeElement);
		this.#open = false;
		this.#body.hidden = true;
		this.#head.expanded = false;
		if (inside) this.#head.element.focus({ preventScroll: true });
	}

	toggle() {
		if (this.#open) this.close();
		else this.open();
	}

	/** Calls `listener(row)` after every update; returns the release. */
	watch(listener) {
		this.#watchers.add(listener);
		return () => this.#watchers.delete(listener);
	}

	destroy() {
		this.#release?.();
		this.#release = null;
		this.#watchers.clear();
		this.#head?.destroy();
		super.destroy();
	}

	/** Takes a new body builder; a row that gains or loses one gets a new head (a button, or text). */
	#holder(body) {
		const builder = typeof body === 'function' ? body : body ? () => body : null;
		const toggles = Boolean(builder);
		this.#builder = builder;
		if (this.#built) {
			if (this.#open && builder) this.#build();
			else this.#stale = true;
		}
		if (this.#head && (this.#head.element.tagName === 'BUTTON') === toggles) return;
		const focused = this.#head?.element === this.#element.ownerDocument.activeElement;
		const head = new ActivityHead({ controls: toggles ? this.#body.id : null, labels: this.#labels });
		if (toggles) head.element.addEventListener('click', () => this.toggle());
		if (this.#head) {
			this.#head.element.replaceWith(head.element);
			this.#head.destroy();
		} else this.#element.prepend(head.element);
		this.#head = head;
		if (!toggles) this.close();
		if (focused && toggles) head.element.focus({ preventScroll: true });
	}

	#build() {
		this.#built = true;
		this.#stale = false;
		const inside = this.#content.contains(this.#element.ownerDocument.activeElement);
		let made = [];
		try {
			made = this.#builder?.() ?? [];
		} catch (error) {
			globalThis.reportError?.(error);
		}
		const parts = [].concat(made).filter(part => part !== null && part !== undefined && part !== false && part !== '');
		this.#content.replaceChildren(...parts.map(part => this.#part(part)));
		if (inside) this.#head.element.focus({ preventScroll: true });
	}

	#part(part) {
		if (part.nodeType) return part;
		if (part.element?.nodeType) return part.element;
		if (typeof part === 'string') return el('p', { class: 'bui-activity-note', text: part });
		if (Array.isArray(part.exchange)) return new ActivityExchange(part.exchange, this.#labels).element;
		return new ActivitySection(part, this.#labels).element;
	}

	/** Keeps the last lines of a live output under the row. */
	#write(tail) {
		const text = typeof tail === 'string' ? tail.replace(/\n+$/, '') : '';
		const kept = text ? text.split('\n').slice(-ActivityRow.tail).join('\n') : '';
		this.#tail.hidden = !kept;
		if (this.#tail.textContent !== kept) this.#tail.textContent = kept;
	}

	/** The time so far of a running row, or how long a finished one took; under a second says nothing ("0 s"). */
	#measure(now) {
		const { state, since, until, duration } = this.#values;
		const start = TimeWords.moment(since);
		const end = TimeWords.moment(until);
		const spent = state === 'running' ? (start === null ? null : now - start) : state === 'waiting' ? null : Number.isFinite(duration) ? duration : start !== null && end !== null ? end - start : null;
		const key = state === 'running' ? 'elapsed' : 'took';
		this.#head.time = spent === null || spent < 1000 ? null : this.#labels.text(key, { duration: this.#words.exact(spent) });
	}

	/** A running row with a start follows the clock; any other row does not listen to it. */
	#follow() {
		const ticking = this.#values.state === 'running' && TimeWords.moment(this.#values.since) !== null;
		if (ticking && !this.#release) this.#release = this.#clock.subscribe(now => this.#measure(now));
		else if (!ticking && this.#release) {
			this.#release();
			this.#release = null;
		}
	}
}
