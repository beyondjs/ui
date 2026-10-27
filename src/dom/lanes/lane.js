import { el, content } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Cut } from '../core/cut.js';
import { Same } from '../core/same.js';
import { Status } from '../status/status.js';
import { TimeWords } from '../time/words.js';
import { LaneTip } from './tip.js';

const states = Object.freeze(['running', 'waiting', 'done', 'failed', 'stopped', 'unknown']);
/** Each lane state as the `Status` state whose shape and hue its mark takes. */
const marks = Object.freeze({ running: 'running', waiting: 'attention', done: 'done', failed: 'failed', stopped: 'stopped', unknown: 'unknown' });
const said = value => value !== null && value !== undefined && value !== '';
const separator = () => el('span', { class: 'bui-hidden', text: ', ' });

/**
 * One lane of a `Lanes` block (0.27.0): a button that is one row of the block's grid, its cells in the
 * block's shared columns: the mark (the state's `Status` shape and hue, still) beside the title, indented
 * by its depth under a tree connector; the kind; the live line; the time; the facts; the trace. A hidden
 * state word is read before the title, separators make the name read as a sentence, and the start is its
 * description, while the mark and the trace are hidden from assistive technology.
 *
 * `update()` writes only what changed, so the button that may hold focus is never replaced; `place()`
 * writes the time and the bar against the block's axis and is all a tick does. A cut title (or kind, or a
 * kind the block folded, 0.41.0) is shown whole in a tooltip on hover and keyboard focus (D44); the trace's
 * tooltip says when it started and how long it ran.
 */
export class Lane {
	static states = states;

	#key;
	#element;
	#mark = el('span', { class: 'bui-lanes-mark bui-status', 'aria-hidden': 'true' }, [el('span', { class: 'bui-status-dot' })]);
	#word = el('span', { class: 'bui-hidden' });
	#title = el('span', { class: 'bui-lanes-title' });
	#kind = el('span', { class: 'bui-lanes-kind', hidden: true });
	#now = el('span', { class: 'bui-lanes-now' });
	#time = el('span', { class: 'bui-lanes-time', hidden: true });
	#elapsed = document.createTextNode('');
	#facts = el('span', { class: 'bui-lanes-facts', hidden: true });
	#trace = el('span', { class: 'bui-lanes-trace', 'aria-hidden': 'true' });
	#bar = el('span', { class: 'bui-lanes-bar', hidden: true });
	#start = el('span', { id: Ids.next('bui-lanes-start'), hidden: true });
	#labels;
	#words;
	#clock;
	#name;
	#tip;
	#given = { title: undefined, kind: undefined, now: undefined };
	#listed = new Same();
	#state = null;
	#current = false;
	#since = null;
	#until = null;
	#placed = { from: null, to: null };

	/**
	 * @param {string} key the lane's identity in its block
	 * @param {object} context
	 * @param {import('../core/labels.js').Labels} context.labels the block's copy
	 * @param {import('./words.js').LaneWords} context.words the block's words for times
	 * @param {() => number} context.now the block's clock
	 */
	constructor(key, { labels, words, now }) {
		this.#key = key;
		this.#labels = labels;
		this.#words = words;
		this.#clock = now;
		this.#time.append(separator(), this.#elapsed);
		this.#trace.append(this.#bar);
		const head = el('span', { class: 'bui-lanes-head' }, [this.#mark, this.#word, this.#title]);
		this.#element = el('button', { type: 'button', class: 'bui-lanes-lane', tabindex: '-1', dataset: { key } }, [head, this.#kind, this.#now, this.#time, this.#facts, this.#trace, this.#start]);
		this.#name = new LaneTip(this.#element, { focus: true, text: () => this.#whole(), when: () => this.cut && !this.#tip.shown });
		this.#tip = new LaneTip(this.#trace, {
			text: () => this.#words.trace(this.times, this.#clock()),
			when: () => {
				this.#name.hide();
				return this.#since !== null;
			}
		});
	}

	get key() {
		return this.#key;
	}

	get element() {
		return this.#element;
	}

	get state() {
		return this.#state;
	}

	/** Whether this is the lane whose detail is open. */
	get current() {
		return this.#current;
	}

	/** Its times in milliseconds since the epoch, and whether it is live: running or waiting, started and not ended. */
	get times() {
		const live = (this.#state === 'running' || this.#state === 'waiting') && this.#since !== null && this.#until === null;
		return { since: this.#since, until: this.#until, live };
	}

	get live() {
		return this.times.live;
	}

	/** Whether its title is shown cut now: what the block's room folds its trace and kind for (0.41.0). */
	get cramped() {
		return Cut.text(this.#title);
	}

	/** What decides its title's room (0.41.0): its depth, and its title's, kind's and facts' words. */
	get said() {
		const words = [this.#title, this.#kind, this.#facts].map(cell => (cell.hidden ? '' : cell.textContent));
		return [this.#element.dataset.depth ?? '', ...words].join('|');
	}

	/** Whether its title, or its kind, is shown cut now; a folded kind is cut (0.41.0). */
	get cut() {
		return Cut.text(this.#title) || (!this.#kind.hidden && Cut.text(this.#kind));
	}

	/**
	 * Takes the lane's values and its place in the tree, writing only what changed.
	 *
	 * @param {object} values a lane of `Lanes.update()`
	 * @param {{depth: number, branch: 'middle'|'last'|null, through: number[]}} branch from `LaneTree`
	 */
	update(values, { depth, branch, through }) {
		this.#mood(states.includes(values.state) ? values.state : 'unknown');
		const word = said(values.stateLabel) ? String(values.stateLabel) : this.#labels.text(this.#state);
		if (this.#word.textContent !== word) this.#word.textContent = word;
		this.#write('title', this.#title, values.title ?? '');
		this.#write('kind', this.#kind, values.kind ?? null);
		this.#write('now', this.#now, values.now ?? null);
		this.#list(Array.isArray(values.facts) ? values.facts : []);
		this.#since = TimeWords.moment(values.since);
		this.#until = TimeWords.moment(values.until);
		this.#describe();
		this.#current = Boolean(values.current);
		if (this.#current) this.#element.setAttribute('aria-current', 'true');
		else this.#element.removeAttribute('aria-current');
		this.#hang(depth, branch, through);
		return this;
	}

	/**
	 * Writes its time and its bar against the block's axis at `now`: all a tick changes. The time is the
	 * duration from its start to its end, or to now while it is live; the bar runs from its start to the
	 * same end, or marks only its start when the end is not known.
	 *
	 * @param {number|null} start the axis' start
	 * @param {number} now
	 */
	place(start, now) {
		const { since, until, live } = this.times;
		const end = until ?? (live ? now : null);
		const text = since !== null && end !== null ? this.#words.duration(end - since) : '';
		if (this.#elapsed.data !== text) this.#elapsed.data = text;
		this.#time.hidden = !text;
		const drawn = since !== null && start !== null;
		this.#bar.hidden = !drawn;
		if (drawn) {
			const from = since - start;
			this.#set('from', from);
			this.#set('to', Math.max(from, (end ?? since) - start));
			this.#bar.toggleAttribute('data-open', end === null);
		}
		this.#tip.refresh();
	}

	/** Moves focus to the lane (`options` as for `HTMLElement.focus`). */
	focus(options = {}) {
		this.#element.focus(options);
	}

	destroy() {
		this.#name.destroy();
		this.#tip.destroy();
		this.#element.remove();
	}

	/** The state's mark: the `Status` shape and hue of its tone, beside the words. */
	#mood(state) {
		if (state === this.#state) return;
		this.#state = state;
		const tone = Status.tone(marks[state]);
		this.#mark.className = `bui-lanes-mark bui-status bui-status-${tone}`;
		this.#element.dataset.state = state;
		this.#element.dataset.tone = tone;
	}

	/** A cell's words or node after a hidden separator, written only when they changed; an empty cell is hidden. */
	#write(name, cell, value) {
		if (Same.equal(this.#given[name], value) && this.#given[name] !== undefined) return;
		this.#given[name] = value;
		const shown = said(value);
		if (cell !== this.#title) cell.hidden = !shown;
		cell.replaceChildren(...(shown ? [separator(), content(value)] : []));
	}

	/** The facts in tabular figures, each with its hidden label ("48k" read "48k tokens"). */
	#list(facts) {
		if (this.#listed.keep(facts)) return;
		const items = facts.filter(fact => said(fact) && (typeof fact !== 'object' || said(fact.text)));
		this.#facts.hidden = !items.length;
		this.#facts.replaceChildren(
			...items.map(fact => {
				const { text, label } = typeof fact === 'object' ? fact : { text: fact, label: null };
				return el('span', { class: 'bui-lanes-fact' }, [separator(), String(text), said(label) ? el('span', { class: 'bui-hidden', text: ` ${label}` }) : null]);
			})
		);
	}

	/** The start as the lane's description: "Started 10:42:05". */
	#describe() {
		const text = this.#since === null ? '' : this.#words.started(this.#since, this.#clock());
		if (this.#start.textContent !== text) this.#start.textContent = text;
		if (text) this.#element.setAttribute('aria-describedby', this.#start.id);
		else this.#element.removeAttribute('aria-describedby');
	}

	/** Its depth and the tree connector it hangs from. */
	#hang(depth, branch, through) {
		this.#element.dataset.depth = String(depth);
		this.#element.style.setProperty('--bui-lanes-depth', String(depth));
		if (branch) this.#element.dataset.branch = branch;
		else delete this.#element.dataset.branch;
		if (through.length) this.#element.dataset.through = through.join(' ');
		else delete this.#element.dataset.through;
	}

	/** One of the bar's custom properties, written only when it changed. */
	#set(name, value) {
		if (this.#placed[name] === value) return;
		this.#placed[name] = value;
		this.#bar.style.setProperty(`--bui-lanes-${name}`, String(value));
	}

	/** The words its name tooltip shows: the whole title, and the kind when that is cut too. */
	#whole() {
		const kind = !this.#kind.hidden && Cut.text(this.#kind) ? this.#kind.lastChild?.textContent : null;
		return [this.#title.lastChild?.textContent ?? '', kind].filter(Boolean).join(' · ');
	}
}
