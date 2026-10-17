import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { callout, skeleton } from '../feedback.js';
import { EmptyState } from '../checklist/empty.js';
import { DataQuery } from './query.js';
import { DataTableView } from './view.js';
import { words } from './labels.js';

/**
 * A table of rows the product holds (0.15.0, the audit's DQ-12 and family cause 5): search, sort by a
 * column, groups with their count, and pages, with its state kept by the product. The table never reads
 * or writes the address: every change the person makes is reported to `onchange` (`{ query, sort,
 * direction, page }`), so the product keeps it in its address; setting `state` (back and forward) draws
 * it again without reporting it.
 *
 * It tells its states apart: `status` `loading` (skeleton rows in the table's shape, the loading line
 * for assistive technology), `failed` (the product's reason with Try again, `onretry`), and with rows
 * `ready`. With no row at all the controls are hidden and the empty state is shown (the product's node,
 * or `{ title, text, action }`); a search that matches nothing says so with "Clear the search". What
 * fits on one page shows no range and no pager. On a narrow region (a container query on the table's
 * own width) each row is two short lines: the primary cell, then the others in one muted line.
 *
 * Columns: `{ key, label, value?(row), render?(row) → string|Node, sort?: boolean|((a, b) => number),
 * mono?, align?: 'start'|'end', primary? }`.
 */
export class DataTable extends Component {
	/** The copy in English and Spanish. */
	static labels = words;

	#element;
	#labels;
	#options;
	#query;
	#view;
	#rows = [];
	#state;
	#status = 'ready';
	#reason = null;
	#input = null;
	#body = el('div', { class: 'bui-data-body' });
	#pager;
	#said = el('p', { class: 'bui-hidden', role: 'status' });
	#pending = null;

	/**
	 * @param {object} options
	 * @param {string} options.label names the table, its search and its pages
	 * @param {Array<object>} options.columns
	 * @param {Array<object>} [options.rows]
	 * @param {(row: object) => string} [options.key] each row's stable key (`row.id`)
	 * @param {boolean|{match?: (row: object, query: string) => boolean}} [options.search]
	 * @param {{by: (row: object) => string, label?: (key: string, rows: object[]) => string}|null} [options.group]
	 * @param {{query?: string, sort?: string|null, direction?: 'ascending'|'descending', page?: number}} [options.state]
	 * @param {(state: object) => void} [options.onchange] the person changed the state (write it to the address)
	 * @param {number} [options.size] rows a page (50)
	 * @param {((row: object) => string)|null} [options.link] a row's address
	 * @param {((row: object, event: Event) => void)|null} [options.onopen] takes over plain clicks on a row
	 * @param {Node|{title: string|Node, text?: string|Node|null, action?: object|Node|null}|null} [options.empty] the table with no row
	 * @param {(() => void)|null} [options.onretry] Try again after a failure
	 * @param {(() => void)|null} [options.onrender] runs after each drawing of the rows (the React adapter fills cells then)
	 */
	constructor(options) {
		super();
		const { label, columns, rows = [], search = true, group = null, state = {}, size = 50, labels = {} } = options;
		this.#options = options;
		this.#labels = new Labels(words.en, labels);
		this.#query = new DataQuery({ columns, group, match: typeof search === 'object' ? (search.match ?? null) : null, size });
		this.#view = new DataTableView({ label, columns, key: options.key, link: options.link ?? null, onopen: options.onopen ?? null, labels: this.#labels, onsort: column => this.#sort(column) });
		this.#state = DataTable.#clean(state);
		const id = Ids.next('bui-data');
		if (search) this.#input = el('input', { id: `${id}-search`, type: 'search', class: 'bui-input', autocomplete: 'off', value: this.#state.query, placeholder: this.#labels.text('search', { label }), oninput: () => this.#typed() });
		const tools = this.#input ? el('div', { class: 'bui-data-tools' }, [el('label', { for: this.#input.id, class: 'bui-hidden', text: this.#labels.text('search', { label }) }), el('span', { class: 'bui-picker-search' }, [glyph('search'), this.#input])]) : null;
		this.#pager = el('nav', { class: 'bui-pager', 'aria-label': this.#labels.text('pages', { label }) });
		this.#element = el('section', { class: 'bui-data-table', 'aria-label': typeof label === 'string' ? label : null }, [tools, this.#said, this.#body, this.#pager]);
		this.rows = rows;
	}

	get element() {
		return this.#element;
	}

	/** The query, sort, direction and page in view. */
	get state() {
		return { ...this.#state };
	}

	/** Restores a state (from the address on back or forward) without reporting it. */
	set state(state) {
		this.#state = DataTable.#clean(state);
		if (this.#input) this.#input.value = this.#state.query;
		this.#draw();
	}

	get rows() {
		return this.#rows;
	}

	/** Replaces the rows (a live list) and draws them; the state stays. */
	set rows(rows) {
		this.#rows = [...(rows ?? [])];
		this.#status = 'ready';
		this.#draw();
	}

	/** `loading`, `ready`, or `{ failed: reason }` (a reason in words, or null for the table's own). */
	set status(status) {
		this.#status = status === 'loading' ? 'loading' : status?.failed !== undefined ? 'failed' : 'ready';
		this.#reason = this.#status === 'failed' ? (status.failed ?? null) : null;
		this.#draw();
	}

	get status() {
		return this.#status;
	}

	destroy() {
		this.#pending?.();
		super.destroy();
	}

	#draw() {
		const label = this.#options.label;
		const tools = this.#element.querySelector('.bui-data-tools');
		this.#element.dataset.status = this.#status;
		if (this.#status === 'loading') {
			if (tools) tools.hidden = true;
			fill(this.#pager, []);
			this.#said.textContent = this.#labels.text('loading', { label });
			return fill(this.#body, [skeleton({ rows: 5, kind: 'table' })]);
		}
		if (this.#status === 'failed') {
			const retry = this.#options.onretry ? el('button', { type: 'button', class: 'bui-button bui-button-secondary', onclick: () => this.#options.onretry() }, [glyph('refresh'), el('span', { text: this.#labels.text('retry') })]) : null;
			fill(this.#pager, []);
			this.#said.textContent = this.#reason ?? this.#labels.text('failure');
			return fill(this.#body, [callout({ tone: 'danger', title: this.#reason ?? this.#labels.text('failure'), actions: [retry].filter(Boolean) })]);
		}
		// No row at all: no controls, only the empty state
		if (tools) tools.hidden = !this.#rows.length;
		if (!this.#rows.length) {
			fill(this.#pager, []);
			this.#said.textContent = '';
			return fill(this.#body, [this.#empty()]);
		}
		const answer = this.#query.run(this.#rows, this.#state);
		this.#state.page = answer.page;
		if (!answer.total) {
			fill(this.#pager, []);
			const none = new EmptyState({ kind: 'match', title: this.#labels.text('matches', { query: this.#state.query }), clear: () => this.#clear(), labels: { clear: this.#labels.text('clear') } });
			this.#said.textContent = none.element.querySelector('.bui-empty-title').textContent;
			return fill(this.#body, [none.element]);
		}
		fill(this.#body, [this.#view.draw(answer, this.#state)]);
		this.#paging(answer);
		this.#said.textContent = this.#labels.text('shown', { count: answer.total });
		this.#options.onrender?.();
	}

	#empty() {
		const empty = this.#options.empty;
		if (empty && typeof empty.nodeType === 'number') return empty;
		return new EmptyState({ kind: 'empty', title: empty?.title ?? this.#labels.text('empty'), text: empty?.text ?? null, action: empty?.action ?? null }).element;
	}

	#paging({ pages, page, first, last, total }) {
		if (pages <= 1) return fill(this.#pager, []);
		const button = (text, target, enabled) => el('button', { type: 'button', class: 'bui-button bui-button-secondary bui-button-small', disabled: !enabled, onclick: () => this.#change({ page: target }, true) }, [text]);
		fill(this.#pager, [button(this.#labels.text('previous'), page - 1, page > 1), el('p', { class: 'bui-pager-summary', text: this.#labels.text('range', { first, last, total }) }), button(this.#labels.text('next'), page + 1, page < pages)]);
	}

	#sort(column) {
		const same = this.#state.sort === column.key;
		this.#change({ sort: column.key, direction: same && this.#state.direction === 'ascending' ? 'descending' : 'ascending', page: 1 });
		this.#refocus(column);
	}

	/** After a sort the same header button keeps focus, though the table was drawn again. */
	#refocus(column) {
		const index = this.#options.columns.indexOf(column);
		this.#body.querySelectorAll('thead th')[index]?.querySelector('button')?.focus({ preventScroll: true });
	}

	#typed() {
		this.#pending?.();
		this.#pending = this.later(() => this.#change({ query: this.#input.value.trim(), page: 1 }), this.#options.delay ?? 200);
	}

	#clear() {
		if (this.#input) this.#input.value = '';
		this.#change({ query: '', page: 1 });
		this.#input?.focus();
	}

	#change(part, paged = false) {
		this.#state = { ...this.#state, ...part };
		this.#draw();
		this.#options.onchange?.(this.state);
		if (paged) this.#body.querySelector('tbody .bui-row-link, tbody th')?.focus?.({ preventScroll: true });
	}

	static #clean(state = {}) {
		return { query: String(state?.query ?? ''), sort: state?.sort ?? null, direction: state?.direction === 'descending' ? 'descending' : 'ascending', page: Math.max(1, Number(state?.page) || 1) };
	}
}
