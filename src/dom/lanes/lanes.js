import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { Labels } from '../core/labels.js';
import { KeyedList } from '../core/keyed.js';
import { Clock } from '../time/clock.js';
import { Lane } from './lane.js';
import { LaneAxis } from './axis.js';
import { LaneKeys } from './keys.js';
import { LaneRoom } from './room.js';
import { LaneTree } from './tree.js';
import { LaneWords } from './words.js';
import { lanes as copy } from './labels.js';

const said = value => value !== null && value !== undefined && value !== '';

/**
 * Concurrent work drawn as lanes on one time axis (0.27.0): a coding agent's subagents first, and any
 * parallel work a product follows (a preparation's parallel steps, a delivery's jobs). A group named by
 * `label` holds one button per lane, in the product's order (never sorted here), each one row of a grid
 * whose columns every lane shares, so they align: the mark and the title (indented by depth under a tree
 * connector), the kind, the live line, the time, the facts in tabular figures and the trace, a bar on the
 * block's axis from the lane's start to its end, or to now while it is live.
 *
 * - **States** (`Lanes.states`): `running`, `waiting`, `done`, `failed`, `stopped` and `unknown`, each
 *   with the shape and hue of a `Status` (a half-filled circle, a diamond, a filled circle, a square, a
 *   hollow circle, a dashed circle) that never pulses; the product's word for it (`stateLabel`) is read
 *   before the title.
 * - **Time**: a live lane (running or waiting, started, not ended) counts on `clock`; a tick writes only
 *   the live lanes' times and bars, and the axis' span when it reaches its next step (`Lanes.steps`).
 * - **Geometry**: a lane is one line from 40rem of the block's width and two below it (title and time,
 *   then the live line and the facts; no kind and no trace), by a container query; a change of its words
 *   or times never changes its height, and a new lane takes its place in the order. Since 0.41.0 a title
 *   gets its room first: before one is cut, the block folds its trace, then its kind (`LaneRoom`).
 * - **Keyboard**: one lane in the tab order; arrows, Home and End move; Enter and Space choose it, as a
 *   press does, by calling `choose(key, event)`; the product decides what choosing opens and marks that
 *   lane `current`. `update()` patches lanes by key, so the lane that holds focus keeps it.
 */
export class Lanes extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;
	/** The states a lane may be in. */
	static states = Lane.states;
	/** The steps of a live axis, in minutes (then doubling). */
	static steps = LaneAxis.steps;

	#element;
	#list = el('div', { class: 'bui-lanes-list' });
	#order = new KeyedList(this.#list);
	#lanes = new Map();
	#sequence = [];
	#axis = new LaneAxis();
	#labels;
	#words;
	#clock;
	#choose;
	#keyboard;
	#room;
	#release = null;

	/**
	 * @param {object} [options]
	 * @param {string|null} [options.label] the group's name ("Subagents of this turn")
	 * @param {import('../time/clock.js').Clock} [options.clock] the page's clock (`Clock.system`)
	 * @param {string} [options.locale] a BCP 47 tag for times of day
	 * @param {object} [options.labels] the copy (`Lanes.labels.es`)
	 * @param {boolean} [options.trace] the trace column (default true)
	 * @param {((key: string, event: Event) => void)|null} [options.choose] what choosing a lane does
	 */
	constructor({ label = null, clock = Clock.system, locale = undefined, labels = {}, trace = true, choose = null } = {}) {
		super();
		this.#labels = new Labels(copy.en, labels);
		this.#words = new LaneWords(this.#labels, locale);
		this.#clock = clock;
		this.#choose = typeof choose === 'function' ? choose : null;
		this.#element = el('div', { class: 'bui-lanes', role: 'group' }, [this.#list]);
		this.#keyboard = new LaneKeys(this.#list, { lanes: () => this.#sequence });
		this.#room = new LaneRoom(this.#element, () => this.#sequence.some(lane => lane.cramped));
		this.#list.addEventListener('click', event => this.#press(event));
		this.update({ label, trace, lanes: [] });
	}

	get element() {
		return this.#element;
	}

	/** The lanes' keys in their order. */
	get keys() {
		return this.#sequence.map(lane => lane.key);
	}

	/**
	 * Changes what is given: `lanes` (patched by key: a lane that stays keeps its button and focus, a new
	 * one is placed in the order, one no longer given is removed), `label` and `trace`.
	 *
	 * @param {{lanes?: object[], label?: string|null, trace?: boolean}} values
	 */
	update(values = {}) {
		if (this.destroyed) return this;
		const given = key => Object.hasOwn(values, key);
		if (given('label')) this.#element.setAttribute('aria-label', said(values.label) ? String(values.label) : this.#labels.text('group'));
		if (given('trace')) this.#element.toggleAttribute('data-trace', values.trace !== false);
		if (given('lanes')) this.#draw(values.lanes);
		else if (given('trace')) this.#room.fit();
		return this;
	}

	/** Moves focus to the lane of `key` and gives it the tab order; false when there is none. */
	focus(key, options = {}) {
		const lane = this.#lanes.get(String(key));
		if (!lane || this.destroyed) return false;
		this.#keyboard.stop = lane;
		lane.focus(options);
		return true;
	}

	destroy() {
		if (this.destroyed) return;
		this.#follow(false);
		this.#room.destroy();
		for (const lane of this.#sequence) lane.destroy();
		this.#lanes.clear();
		this.#sequence = [];
		super.destroy();
	}

	#draw(list) {
		const items = this.#items(list);
		const tree = LaneTree.of(items.map(item => LaneTree.depth(item.depth)));
		const kept = new Set(items.map(item => item.key));
		const active = this.#element.ownerDocument.activeElement;
		const lost = this.#sequence.findIndex(lane => lane.element === active && !kept.has(lane.key));
		const leaving = this.#sequence.filter(lane => !kept.has(lane.key));
		const sequence = items.map((item, index) => this.#lane(item.key).update(item, tree[index]));
		for (const lane of leaving) this.#lanes.delete(lane.key);
		this.#order.order(sequence.map(lane => lane.element));
		for (const lane of leaving) lane.destroy();
		this.#sequence = sequence;
		this.#element.toggleAttribute('data-kind', items.some(item => said(item.kind)));
		this.#element.toggleAttribute('data-facts', items.some(item => Array.isArray(item.facts) && item.facts.some(said)));
		this.#measure();
		this.#room.fit();
		this.#keyboard.settle();
		// The lane that held focus left: its place keeps the keyboard, so focus never falls to the page.
		if (lost >= 0 && sequence.length) sequence[Math.min(lost, sequence.length - 1)].focus({ preventScroll: true });
		this.#follow(sequence.some(lane => lane.live));
	}

	/** The given lanes with a key, each key once, keys as strings. */
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

	#lane(key) {
		let lane = this.#lanes.get(key);
		if (!lane) {
			lane = new Lane(key, { labels: this.#labels, words: this.#words, now: () => this.#clock.now });
			this.#lanes.set(key, lane);
		}
		return lane;
	}

	/** The axis and every lane's time and bar at the clock's now. */
	#measure() {
		const now = this.#clock.now;
		this.#axis.measure(this.#sequence.map(lane => lane.times), now);
		this.#span();
		for (const lane of this.#sequence) lane.place(this.#axis.start, now);
	}

	/** A tick: the live lanes' times and bars, and the axis' span when it reaches its next step. Nothing else. */
	#tick(now) {
		const live = this.#sequence.filter(lane => lane.live);
		if (!live.length) return this.#follow(false);
		if (this.#axis.measure(this.#sequence.map(lane => lane.times), now)) this.#span();
		for (const lane of live) lane.place(this.#axis.start, now);
	}

	#span() {
		const span = String(this.#axis.span);
		if (this.#element.style.getPropertyValue('--bui-lanes-span') !== span) this.#element.style.setProperty('--bui-lanes-span', span);
	}

	/** Listens to the clock while a lane is live, and to nothing otherwise. */
	#follow(live) {
		if (live && !this.#release) this.#release = this.#clock.subscribe(now => this.#tick(now));
		else if (!live && this.#release) {
			this.#release();
			this.#release = null;
		}
	}

	#press(event) {
		const button = event.target.closest?.('.bui-lanes-lane');
		const lane = this.#sequence.find(item => item.element === button);
		if (lane) this.#choose?.(lane.key, event);
	}
}
