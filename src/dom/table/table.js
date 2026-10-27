import { Component } from '../core/component.js';
import { el, fill } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { CollectionTools } from '../collection/tools.js';
import { Labels } from '../core/labels.js';
import { callout, skeleton } from '../feedback.js';
import { EmptyState } from '../checklist/empty.js';
import { DataQuery } from './query.js';
import { DataTableView } from './view.js';
import { DataHead } from './head.js';
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
 * `ready`. With no row at all the tools remain reachable and the empty state is shown (the product's node,
 * or `{ title, text, action }`); a search that matches nothing says so with "Clear the search". What
 * fits on one page shows no range and no pager. On a narrow region (a container query on the table's
 * own width) each row is two short lines: the primary cell, then the others in one muted line; since 0.41.0 its
 * hidden header's sort buttons leave the Tab order there (`DataHead`, D187).
 *
 * `framed` (0.41.0, D184) says the table is drawn at the top of a framed box (a raised section, a card): with no
 * tools above it, its first line's capitals stand at the box's inset (the header's, or a narrow table's first
 * row's), while its rows' fills hang into the box's padding as a list's rows hang into the gutter.
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
	#tools;
	#body = el('div', { class: 'bui-data-body' });
	#pager;
	#said = el('p', { class: 'bui-hidden', role: 'status' });
	#head;

	/**
	 * @param {object} options
	 * @param {string} options.label names the table, its search and its pages
	 * @param {Array<object>} options.columns
	 * @param {Array<object>} [options.rows]
	 * @param {(row: object) => string} [options.key] each row's stable key (`row.id`)
	 * @param {boolean|{match?: (row: object, query: string) => boolean}} [options.search]
	 * @param {Array<{name: string, label: string, all?: string, options: object[], match: (row: object, value: string) => boolean}>} [options.filters] supported finite restrictions
	 * @param {'compact'|'expanded'|'external'} [options.tools] shared tools placement; expanded keeps search open
	 * @param {{by: (row: object) => string, label?: (key: string, rows: object[]) => string}|null} [options.group]
	 * @param {{query?: string, filters?: object, sort?: string|null, direction?: 'ascending'|'descending', page?: number}} [options.state]
	 * @param {(state: object) => void} [options.onchange] the person changed the state (write it to the address)
	 * @param {number} [options.size] rows a page (50)
	 * @param {((row: object) => string)|null} [options.link] a row's address
	 * @param {((row: object, event: Event) => void)|null} [options.onopen] takes over plain clicks on a row
	 * @param {Node|{title: string|Node, text?: string|Node|null, action?: object|Node|null}|null} [options.empty] the table with no row
	 * @param {(() => void)|null} [options.onretry] Try again after a failure
	 * @param {(() => void)|null} [options.onrender] runs after each drawing of the rows (the React adapter fills cells then)
	 * @param {boolean} [options.framed] drawn at the top of a framed box, its first capitals at the box's inset (0.41.0)
	 */
	constructor(options) {
		super();
		const { label, columns, rows = [], search = true, group = null, state = {}, size = 50, labels = {} } = options;
		this.#options = options;
		this.#labels = new Labels(words, labels);
		this.#query = new DataQuery({ columns, group, match: typeof search === 'object' ? (search.match ?? null) : null, size });
		this.#view = new DataTableView({ label, columns, key: options.key, link: options.link ?? null, onopen: options.onopen ?? null, labels: this.#labels, onsort: column => this.#sort(column) });
		this.#state = DataTable.#clean(state, Boolean(options.filters?.length));
		this.#tools = new CollectionTools({ label, search, filters: options.filters ?? [], state: this.#state, labels, compact: options.tools !== 'expanded', delay: options.delay ?? 200, onchange: state => this.#change({ query: state.query, ...(options.filters?.length ? { filters: state.filters } : {}), page: 1 }) });
		this.#tools.element.classList.add('bui-data-tools');
		this.#pager = el('nav', { class: 'bui-pager', 'aria-label': this.#labels.text('pages', { label }) });
		this.#element = el('section', { class: 'bui-data-table', 'aria-label': typeof label === 'string' ? label : null }, [options.tools === 'external' ? null : this.#tools.element, this.#said, this.#body, this.#pager]);
		this.#head = new DataHead(this.#element);
		this.framed = options.framed ?? false;
		this.rows = rows;
	}

	get element() {
		return this.#element;
	}

	/** Shared tools, available for placement beside page actions in external mode. */
	get tools() { return this.#tools; }

	/** The query, sort, direction and page in view. */
	get state() {
		return { ...this.#state, ...(this.#state.filters ? { filters: { ...this.#state.filters } } : {}) };
	}

	/** Restores a state (from the address on back or forward) without reporting it. */
	set state(state) {
		this.#state = DataTable.#clean(state, Boolean(this.#options.filters?.length));
		this.#tools.state = this.#state;
		this.#draw();
	}

	/** Whether it is drawn at the top of a framed box (0.41.0). */
	get framed() {
		return this.#element.hasAttribute('data-framed');
	}

	set framed(framed) {
		this.#element.toggleAttribute('data-framed', Boolean(framed));
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
		this.#tools.destroy();
		this.#head.destroy();
		super.destroy();
	}

	#draw() {
		const label = this.#options.label;
		this.#element.dataset.status = this.#status;
		if (this.#status === 'loading') {
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
		// Tools remain reachable through loading and empty results, including restored restrictions.
		if (!this.#rows.length && !this.#filtered()) {
			fill(this.#pager, []);
			this.#said.textContent = '';
			return fill(this.#body, [this.#empty()]);
		}
		const rows = this.#rows.filter(row => (this.#options.filters ?? []).every(filter => !this.#state.filters?.[filter.name] || filter.match(row, this.#state.filters[filter.name])));
		const answer = this.#query.run(rows, this.#state);
		this.#state.page = answer.page;
		if (!answer.total) {
			fill(this.#pager, []);
			const none = new EmptyState({ kind: 'match', title: this.#labels.text('matches', { query: this.#state.query }), clear: () => this.#clear(), labels: { clear: this.#labels.text(this.#options.filters?.length ? 'clearFilters' : 'clear') } });
			this.#said.textContent = none.element.querySelector('.bui-empty-title').textContent;
			return fill(this.#body, [none.element]);
		}
		fill(this.#body, [this.#view.draw(answer, this.#state)]);
		this.#head.apply();
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

	#filtered() {
		return Boolean(this.#state.query) || Object.values(this.#state.filters ?? {}).some(Boolean);
	}

	#clear() {
		const part = { query: '', ...(this.#state.filters ? { filters: {} } : {}), page: 1 };
		this.#tools.state = part;
		this.#change(part);
		this.#tools.focus();
	}

	#change(part, paged = false) {
		this.#state = { ...this.#state, ...part };
		this.#draw();
		this.#options.onchange?.(this.state);
		if (paged) this.#body.querySelector('tbody .bui-row-link, tbody th')?.focus?.({ preventScroll: true });
	}

	static #clean(state = {}, filters = false) {
		return { ...(filters || state?.filters ? { filters: { ...(state?.filters ?? {}) } } : {}), query: String(state?.query ?? ''), sort: state?.sort ?? null, direction: state?.direction === 'descending' ? 'descending' : 'ascending', page: Math.max(1, Number(state?.page) || 1) };
	}
}
