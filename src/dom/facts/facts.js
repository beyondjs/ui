import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { KeyedList } from '../core/keyed.js';
import { FactsRow } from './row.js';
import { labels as copy } from './labels.js';

const tones = Object.freeze(['neutral', 'success', 'warning', 'danger', 'info', 'progress']);

/**
 * Label and value rows for a resource's panel (0.11.0), such as a conversation's changes, its
 * environment or its AI engine: a description list whose values sit at the row's end, identifiers,
 * commands, paths and models in the monospaced face (`mono`), each row with an optional action of its
 * own (Copy). When its container is narrow (a container query, never the window) a row's value wraps
 * under its label. An optional head says what the rows are about: a title (a heading of `level`), one
 * summary value ("3 files · +52 −3") and one state in words with its tone ("Not pushed").
 *
 * A row may be stale (`stale: true` or the product's note, "Not reported since 23:10"): its value is
 * muted and the note follows it, read with it. It is flat: no card, no elevation (D10, D52, D53).
 *
 * Rows are patched by `key` (else their label), so a live change never redraws a row that stays and
 * never moves the action that holds focus.
 */
export class Facts extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;
	static tones = tones;

	#element;
	#head = el('div', { class: 'bui-facts-head' });
	#list = el('dl', { class: 'bui-facts-list' });
	#order = new KeyedList(this.#list);
	#rows = new Map();
	#labels;
	#id = Ids.next('bui-facts');
	#label;

	/**
	 * @param {object} [options]
	 * @param {{title?: string|Node|null, value?: string|Node|null, state?: [string, string]|{label: string, tone?: string}|null, level?: 2|3|4}|null} [options.head]
	 *   what the rows are about: a heading (level 3 by default), one summary value and one state in words
	 * @param {Array<object|null|false>} [options.rows] `{ key?, label, value, mono?, action?, stale? }`
	 * @param {string|null} [options.label] the rows' accessible name when the head has no title
	 * @param {{stale?: string}} [options.labels]
	 */
	constructor({ head = null, rows = [], label = null, labels = {} } = {}) {
		super();
		this.#labels = new Labels(copy.en, labels);
		this.#label = label;
		this.#element = el('div', { class: 'bui-facts', role: 'group' }, [this.#head, this.#list]);
		this.head = head;
		this.rows = rows;
	}

	get element() {
		return this.#element;
	}

	/** The description list, for a product that measures it. */
	get list() {
		return this.#list;
	}

	/** Replaces the head; null leaves the rows without one (named by `label`). */
	set head(head) {
		const { title = null, value = null, state = null, level = 3 } = head ?? {};
		const word = Facts.state(state);
		const heading = title ? el(`h${[2, 3, 4].includes(level) ? level : 3}`, { id: `${this.#id}-title`, class: 'bui-facts-title' }, [content(title)]) : null;
		fill(this.#head, [heading, Facts.#part(value, 'bui-facts-summary'), word ? Facts.#status(word) : null]);
		this.#head.hidden = !this.#head.childNodes.length;
		if (heading) {
			this.#element.setAttribute('aria-labelledby', heading.id);
			this.#element.removeAttribute('aria-label');
		} else {
			this.#element.removeAttribute('aria-labelledby');
			if (this.#label) this.#element.setAttribute('aria-label', this.#label);
			else this.#element.removeAttribute('aria-label');
		}
	}

	/** Replaces the rows, patched by key: a row that stays keeps its element and its focused action. */
	set rows(rows) {
		const next = new Map();
		for (const row of (Array.isArray(rows) ? rows : []).filter(Boolean)) {
			const base = String(row.key ?? (typeof row.label === 'string' ? row.label : next.size));
			const key = next.has(base) ? `${base}\u0000${next.size}` : base;
			const view = this.#rows.get(key) ?? new FactsRow();
			view.update(row, this.#labels);
			next.set(key, view);
		}
		this.#order.order([...next.values()].map(view => view.element));
		this.#rows = next;
		this.#list.hidden = !next.size;
	}

	/** A state as `{ label, tone }` from `[label, tone]` or `{ label, tone }`; null for none. */
	static state(state) {
		if (!state) return null;
		const [label, tone] = Array.isArray(state) ? state : [state.label, state.tone];
		if (!label) return null;
		return { label, tone: tones.includes(tone) ? tone : 'neutral' };
	}

	static #status({ label, tone }) {
		return el('span', { class: `bui-status bui-status-${tone} bui-facts-state` }, [el('span', { class: 'bui-status-dot', 'aria-hidden': 'true' }), label]);
	}

	static #part(value, name) {
		if (value === null || value === undefined || value === '') return null;
		return el('span', { class: name }, [content(value)]);
	}
}
