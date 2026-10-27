import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { Labels } from '../core/labels.js';
import { KeyedList } from '../core/keyed.js';
import { TurnMark } from './mark.js';
import { TurnKeys } from './keys.js';
import { TurnWatch } from './watch.js';
import { TurnPreview } from './preview.js';
import { turns as copy } from './labels.js';

const said = value => value !== null && value !== undefined && value !== '';

/**
 * A thread's index of its turns (0.29.0, D182): one mark per turn in the thread's gutter, beside the turns,
 * halfway down the window while the thread scrolls, shown from two turns and from a 1024 px region.
 *
 * - **Marks** (`TurnMark`): a short dash each, in the product's order; the turn being read is longer and in
 *   the text's colour (`aria-current`), and a turn that runs, needs the person or failed carries that
 *   state's `Status` shape. Under the pointer a mark and its neighbours lengthen (never under reduced motion).
 * - **Preview** (`TurnPreview`): the pointer resting on a mark, or focus on it, shows the turn's message, the
 *   start of its answer, its state and facts, and the keys that move between turns, beside the index.
 * - **Choosing**: a mark with an address (`href`) is a link the browser follows (so it opens in another tab
 *   and copies as a link); one without is a button that calls `choose(key, 'press')`. From the page,
 *   Option or Alt with ArrowUp and ArrowDown move to the previous and next turn (`move()`), calling
 *   `choose(key, 'key')`, else replacing the address with the turn's, else scrolling to it; while the
 *   person reads a turn whose message went out of view, ArrowUp goes back to that message first.
 * - **Reading** (`TurnWatch`): the turn under the page's sticky edge is the current one; `onview({ key,
 *   covered })` tells the product which, and whether its opening message (`head`) is out of view, so the
 *   page can say it in the header's compact line (D181).
 * - **Keyboard**: one mark in the tab order; arrows, Home and End move within the index.
 *
 * `update({ turns })` patches marks by key, so the one that holds focus keeps it. A turn is
 * `{ key, title, summary?, facts?, state?, stateLabel?, href?, element?, head? }`: `title` names it (the
 * person's message), `element` is the turn on the page and `head` its opening message.
 */
export class TurnIndex extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;
	/** The states a turn's mark says: `running`, `waiting` (needs the person) and `failed`. */
	static states = TurnMark.states;

	#element;
	#list = el('ol', { class: 'bui-turns-list' });
	#order = new KeyedList(this.#list);
	#marks = new Map();
	#sequence = [];
	#labels;
	#keys;
	#watch;
	#preview;
	#choose;
	#onview;
	#view;
	#current = null;
	#covered = false;
	#near = null;

	/**
	 * @param {object} [options]
	 * @param {string|null} [options.label] the index's name ("Turns")
	 * @param {object} [options.labels] the copy (`TurnIndex.labels.es`)
	 * @param {((key: string, how: 'press'|'key') => void)|null} [options.choose] what choosing a turn does
	 * @param {((seen: {key: string|null, covered: boolean}) => void)|null} [options.onview] the turn being read changed
	 * @param {boolean} [options.keys] Option/Alt with the arrows on the page (default true)
	 */
	constructor({ label = null, labels = {}, choose = null, onview = null, keys = true } = {}) {
		super();
		this.#labels = new Labels(copy, labels);
		this.#choose = typeof choose === 'function' ? choose : null;
		this.#onview = typeof onview === 'function' ? onview : null;
		this.#element = el('nav', { class: 'bui-turns', hidden: true }, [this.#list]);
		this.#view = this.#list.ownerDocument.defaultView;
		const page = keys !== false;
		this.#keys = new TurnKeys(this.#list, { marks: () => this.#sequence, move: step => this.move(step), page });
		const modifier = TurnKeys.modifier(this.#view);
		this.#preview = new TurnPreview({ side: this.#list, keys: page ? { previous: `${modifier}↑`, next: `${modifier}↓`, words: this.#labels.text('keys') } : null });
		this.#watch = new TurnWatch(this.#view, { turns: () => this.#sequence.map(mark => mark.item), change: seen => this.#seen(seen) });
		this.listen(this.#list, 'pointermove', event => this.#point(event));
		this.listen(this.#list, 'pointerleave', () => this.#point(null));
		this.listen(this.#list, 'focusin', event => this.#preview.show(this.#mark(event.target)));
		this.listen(this.#list, 'focusout', event => !this.#list.contains(event.relatedTarget) && this.#near === null && this.#preview.hide());
		this.listen(this.#list, 'click', event => this.#press(event));
		if (this.#view) this.listen(this.#view, 'resize', () => this.#fit());
		this.update({ label, turns: [] });
	}

	get element() {
		return this.#element;
	}

	/** The turns' keys in their order. */
	get keys() {
		return this.#sequence.map(mark => mark.key);
	}

	/** The key of the turn being read, or null. */
	get current() {
		return this.#current;
	}

	/** Whether the opening message of the turn being read is out of view, above the page's sticky edge. */
	get covered() {
		return this.#covered;
	}

	/**
	 * Changes what is given: `turns` (patched by key: a mark that stays keeps its control and focus, a new
	 * one is placed in the order, one no longer given is removed) and `label`.
	 *
	 * @param {{turns?: object[], label?: string|null}} values
	 */
	update(values = {}) {
		if (this.destroyed) return this;
		if (Object.hasOwn(values, 'label')) this.#element.setAttribute('aria-label', said(values.label) ? String(values.label) : this.#labels.text('group'));
		if (Object.hasOwn(values, 'turns')) this.#draw(values.turns);
		return this;
	}

	/** Decides now which turn is read, as after the page placed or changed the turns. */
	measure() {
		this.#watch.measure();
	}

	/**
	 * Moves `step` turns from the one being read (-1 the previous, 1 the next); going back from inside a
	 * turn whose message is out of view goes to that message first. False when there is nowhere to go.
	 */
	move(step) {
		const index = this.#sequence.findIndex(mark => mark.key === this.#current);
		const back = step < 0 && this.#covered && index >= 0;
		// With no turn read yet (turns given without their elements), the next turn is the first and the previous the last
		const from = index >= 0 ? index : step > 0 ? -1 : this.#sequence.length;
		const goal = back ? this.#sequence[index] : this.#sequence[Math.min(Math.max(from + step, 0), this.#sequence.length - 1)];
		if (!goal || (!back && goal.key === this.#current)) return false;
		// The goal is read from now on, its message in view: a second press moves on from it, before the scroll ends
		this.#seen({ key: goal.key, covered: false });
		this.#go(goal, 'key');
		return true;
	}

	/** Moves focus to the mark of `key` and gives it the tab order; false when there is none. */
	focus(key, options = {}) {
		const mark = this.#marks.get(String(key));
		if (!mark || this.destroyed) return false;
		this.#keys.stop = mark;
		mark.focus(options);
		return true;
	}

	destroy() {
		if (this.destroyed) return;
		this.#watch.destroy();
		this.#keys.destroy();
		this.#preview.destroy();
		for (const mark of this.#sequence) mark.destroy();
		this.#marks.clear();
		this.#sequence = [];
		super.destroy();
	}

	#draw(list) {
		const items = this.#items(list);
		const kept = new Set(items.map(item => item.key));
		const active = this.#list.ownerDocument.activeElement;
		const lost = this.#sequence.findIndex(mark => mark.control === active && !kept.has(mark.key));
		const leaving = this.#sequence.filter(mark => !kept.has(mark.key));
		const sequence = items.map(item => this.#take(item.key).update(item));
		for (const mark of leaving) this.#marks.delete(mark.key);
		this.#order.order(sequence.map(mark => mark.element));
		for (const mark of leaving) mark.destroy();
		this.#sequence = sequence;
		this.#element.hidden = sequence.length < 2;
		for (const mark of sequence) mark.current = mark.key === this.#current;
		this.#fit();
		this.#keys.settle();
		// The mark that held focus left: its place keeps the keyboard, so focus never falls to the page
		if (lost >= 0 && sequence.length) sequence[Math.min(lost, sequence.length - 1)].focus({ preventScroll: true });
		const shown = this.#preview.mark;
		if (shown && !kept.has(shown.key)) this.#preview.hide();
		else if (shown && this.#preview.shown) this.#preview.show(shown);
		this.#watch.measure();
	}

	/** The given turns with a key, each key once, keys as strings. */
	#items(list) {
		const seen = new Set();
		const items = [];
		for (const item of [].concat(list ?? [])) {
			if (!item || !said(item.key)) continue;
			const key = String(item.key);
			if (seen.has(key)) continue;
			seen.add(key);
			items.push({ ...item, key });
		}
		return items;
	}

	#take(key) {
		let mark = this.#marks.get(key);
		if (!mark) {
			mark = new TurnMark(key, { labels: this.#labels });
			this.#marks.set(key, mark);
		}
		return mark;
	}

	#seen({ key, covered }) {
		this.#current = key;
		this.#covered = covered;
		for (const mark of this.#sequence) mark.current = mark.key === key;
		this.#keys.settle();
		this.#reveal();
		this.#onview?.({ key, covered });
	}

	#mark(node) {
		const control = node?.closest?.('.bui-turns-mark');
		return control ? (this.#sequence.find(mark => mark.control === control) ?? null) : null;
	}

	/** The mark under the pointer and its neighbours lengthen, and the preview shows its turn. */
	#point(event) {
		const mark = event && event.pointerType !== 'touch' ? this.#mark(event.target) : null;
		if (mark === this.#near) return;
		this.#near = mark;
		const index = mark ? this.#sequence.indexOf(mark) : -1;
		this.#sequence.forEach((each, at) => (each.near = index < 0 ? null : Math.abs(at - index)));
		if (mark) return this.#preview.show(mark);
		// The pointer left: a preview still shown follows the mark that holds focus; one Escape hid stays hidden
		const focused = this.#mark(this.#list.ownerDocument.activeElement);
		if (focused && this.#preview.shown) this.#preview.show(focused);
		else this.#preview.hide();
	}

	/** A press on a mark with no address chooses it; a link is the browser's to follow. */
	#press(event) {
		const mark = this.#mark(event.target);
		if (!mark || mark.control.tagName === 'A') return;
		this.#go(mark, 'press');
	}

	#go(mark, how) {
		if (this.#choose) return this.#choose(mark.key, how);
		const href = mark.item?.href;
		if (said(href) && this.#view) return how === 'key' ? this.#view.location.replace(href) : this.#view.location.assign(href);
		mark.item?.element?.scrollIntoView?.({ block: 'start' });
	}

	/** The distance between marks: what the window holds for them, between 4 and 12 px (12 and 24 on touch). */
	#fit() {
		const view = this.#view;
		if (!view) return;
		const coarse = view.matchMedia?.('(pointer: coarse)')?.matches ?? false;
		const [least, most] = coarse ? [12, 24] : [4, 12];
		const room = Math.max(120, (view.innerHeight || 0) * 0.6);
		const pitch = Math.max(least, Math.min(most, Math.floor(room / Math.max(1, this.#sequence.length))));
		this.#element.style.setProperty('--bui-turns-pitch', `${pitch}px`);
	}

	/** A list taller than its room keeps the current mark in view inside it. */
	#reveal() {
		const list = this.#list;
		if (list.scrollHeight <= list.clientHeight) return;
		const row = this.#marks.get(this.#current ?? '')?.element;
		if (row) list.scrollTop = Math.max(0, row.offsetTop - (list.clientHeight - row.offsetHeight) / 2);
	}
}
