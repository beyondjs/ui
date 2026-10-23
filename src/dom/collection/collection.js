import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Labels } from '../core/labels.js';
import { CollectionTools } from './tools.js';
import { callout, skeleton } from '../feedback.js';
import { Loader, local } from './loader.js';
import { Table } from './table.js';
import { CollectionRows } from './rows.js';
import { ColumnFit } from './columns.js';
import { defaults, spanish } from './labels.js';

/**
 * A compact collection: search, finite filters, a table of rows that open their detail, and paging.
 *
 * Its states are distinct and stated: loading, a failure with retry, an empty collection that
 * invites its first action, and no matches for the search or filters with a way to clear them. The
 * query, filters and page are the collection's `state`; `onstate` reports every change so the
 * product can keep it in the address, and passing it back as `state` restores the same view after
 * back, forward or a reload. The source decides what the person may see. Columns with a `priority`
 * leave, the highest number first, as the region narrows, and "Show 2 more columns" brings them back
 * (0.7.0, `ColumnFit`).
 *
 * Since 0.15.0 (DQ-12): what fits on one page shows no range and no pager; the search is one compact
 * field whose placeholder names what it searches (its label is kept for assistive technology); and
 * `presentation: 'list'` draws the rows as `ListRow`s (the primary column the name, `end` columns at the
 * row's end, the others its muted line), which stay two short lines on a phone.
 */
export class Collection extends Component {
	static local = local;
	static Tools = CollectionTools;
	/** The copy in English and Spanish. */
	static labels = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze(spanish) });

	#element;
	#labels;
	#options;
	#loader;
	#state;
	#tools;
	#region;
	#pager;
	#status;
	#paged = false;
	#columns;
	#rows = null;

	/**
	 * @param {object} options
	 * @param {string} options.label names the table and the search field
	 * @param {Array<{key: string, label: string, value?: (row: object) => Node|string, numeric?: boolean, primary?: boolean}>} options.columns
	 * @param {(request: {query: string, filters: object, page: number, limit: number, signal: AbortSignal}) => Promise<{rows: object[], total?: number, more?: boolean}>} options.source
	 * @param {(row: object) => string} [options.link] the address of a row's detail
	 * @param {{query?: string, filters?: object, page?: number}} [options.state] initial state, usually from the address
	 * @param {'compact'|'expanded'|'external'} [options.tools] shared tools placement; expanded keeps search open
	 * @param {(state: {query: string, filters: object, page: number}) => void} [options.onstate]
	 * @param {{title: string, body?: string, action?: Node}} [options.empty] the empty collection
	 * @param {() => void} [options.onrender] runs after each redraw of the rows (the React adapter fills cells then)
	 * @param {(row: object) => object} [options.row] the list presentation's own `ListRow` options for a row (0.21.1)
	 * @param {(row: object) => {key: string, label: string}} [options.group] groups consecutive rows under a label (0.21.1, `Recency`)
	 * @param {boolean|string|Node|((list: {count: number}) => string|Node)} [options.end] the list's end line on its
	 * last page (0.21.1): true (default) says the family's words, a text, node or function of how many rows the
	 * list holds the product's, false none
	 */
	constructor(options) {
		super();
		const { label, source, search = true, filters = [], state = {}, labels = {} } = options;
		this.#options = options;
		this.#labels = new Labels(defaults, labels);
		this.#loader = new Loader(source);
		this.#state = { query: state.query ?? '', filters: { ...(state.filters ?? {}) }, page: Math.max(1, Number(state.page) || 1) };
		this.#tools = new CollectionTools({ label, search, filters, state: this.#state, labels, compact: options.tools !== 'expanded', delay: options.delay ?? 250, onchange: state => this.#change(state) });
		this.#tools.element.classList.add('bui-collection-tools');
		// Down from the search reaches the first row (the list rule L7), wherever the tools are placed
		this.#tools.element.addEventListener('keydown', event => {
			// Not while a language's input method chooses, nor while an answer that replaces the rows is on its way
			if (event.key !== 'ArrowDown' || event.isComposing || !event.target.matches?.('input') || this.#region.getAttribute('aria-busy') === 'true') return;
			if (this.#rows?.first?.()) event.preventDefault();
		});
		this.#region = el('div', { class: 'bui-collection-body', tabindex: '-1', 'aria-busy': 'false' });
		this.#status = el('p', { class: 'bui-hidden', role: 'status' });
		this.#pager = el('nav', { class: 'bui-pager', 'aria-label': this.#labels.text('pages', { label }) });
		this.#columns = new ColumnFit({ columns: options.columns, labels: this.#labels });
		this.#element = el('section', { class: 'bui-collection', 'aria-label': typeof label === 'string' ? label : null }, [
			options.tools === 'external' ? null : this.#tools.element,
			this.#status,
			this.#region,
			this.#columns.element,
			this.#pager
		]);
		this.load();
	}

	get element() {
		return this.#element;
	}

	/** The same tools can be placed beside page actions with tools: external. */
	get tools() { return this.#tools; }

	/** The query, filters and page in view. */
	get state() {
		return { query: this.#state.query, filters: { ...this.#state.filters }, page: this.#state.page };
	}

	/** Changes the state (for example from the address on back or forward) and loads it. */
	set state(state) {
		this.#state = { query: state.query ?? '', filters: { ...(state.filters ?? {}) }, page: Math.max(1, Number(state.page) || 1) };
		this.#tools.state = this.#state;
		this.load();
	}

	/** Loads the current state again. */
	async load() {
		const limit = this.#options.limit ?? 20;
		this.#region.setAttribute('aria-busy', 'true');
		this.#status.textContent = this.#labels.text('loading');
		if (!this.#region.querySelector('table, .bui-rows')) fill(this.#region, [skeleton({ rows: 4, kind: this.#options.presentation === 'list' ? 'list' : 'table' })]);
		const result = await this.#loader.load({ ...this.state, limit });
		if (result.stale || this.destroyed) return;
		this.#region.setAttribute('aria-busy', 'false');
		if (result.error) return this.#failed(result.error);
		const { rows = [], total = null, more = null } = result.answer ?? {};
		const pages = total !== null ? Math.max(1, Math.ceil(total / limit)) : null;
		if (!rows.length && this.#state.page > 1 && (pages === null || this.#state.page > pages)) return this.#go(pages ?? this.#state.page - 1);
		// A row's name that holds the focus keeps it across the redraw, as the arrow keys leave it there
		const focused = this.#region.contains(document.activeElement) ? document.activeElement.closest('[data-key]')?.dataset.key ?? null : null;
		this.#rows?.destroy?.();
		this.#rows = rows.length ? this.#table(rows) : null;
		const table = this.#rows?.element ?? null;
		const further = more ?? (pages !== null ? this.#state.page < pages : false);
		fill(this.#region, [table ?? this.#nothing(), table && !further ? this.#end((this.#state.page - 1) * limit + rows.length) : null]);
		if (focused !== null) [...this.#region.querySelectorAll('[data-key]')].find(row => row.dataset.key === focused)?.querySelector('.bui-row-title, .bui-row-link')?.focus({ preventScroll: true });
		this.#columns.attach(table?.localName === 'table' ? table : null, this.#region);
		this.#options.onrender?.();
		const summary = this.#paging({ rows, total, more: further, pages, limit });
		this.#status.textContent = rows.length ? summary : this.#region.textContent;
		// After a page change focus moves to the new rows, so the pager button that was pressed can disable itself.
		if (this.#paged) this.#region.focus();
		this.#paged = false;
	}

	destroy() {
		this.#loader.cancel();
		this.#rows?.destroy?.();
		this.#columns.release();
		this.#tools.destroy();
		super.destroy();
	}

	#table(rows) {
		const { label, columns, link = null, onopen = null, key, presentation = 'table', row = null, group = null } = this.#options;
		return presentation === 'list' ? new CollectionRows({ label, columns, rows, link, onopen, key, row, group, query: this.#state.query }) : new Table({ label, columns, rows, link, onopen, key });
	}

	/**
	 * A list's end line on its last page (0.21.1, the list rule L5): it says the list is whole, so a short
	 * list never reads as one still loading, and where a pointer moves it, the keys that go through it
	 */
	#end(count) {
		const { end = true, presentation = 'table' } = this.#options;
		if (presentation !== 'list' || end === false) return null;
		const said = end === true ? this.#labels.text('end') : typeof end === 'function' ? end({ count }) : end;
		// The keys open only rows that open: a list of names without a destination says no keys
		const keys = this.#options.link ? el('span', { class: 'bui-keys bui-rows-keys', text: this.#labels.text('keys') }) : null;
		return el('p', { class: 'bui-rows-end' }, [el('span', {}, [content(said)]), keys]);
	}

	#change(part) {
		this.#state = { ...this.#state, ...part, page: part.page ?? 1 };
		this.#options.onstate?.(this.state);
		this.load();
	}

	#go(page) {
		this.#paged = true;
		this.#change({ page: Math.max(1, page) });
	}

	#clear() {
		this.state = { query: '', filters: {}, page: 1 };
		this.#options.onstate?.(this.state);
		this.#tools.focus();
	}

	#filtered() {
		return Boolean(this.#state.query) || Object.values(this.#state.filters).some(Boolean);
	}

	#nothing() {
		if (this.#filtered()) {
			return el('div', { class: 'bui-empty' }, [
				el('p', { class: 'bui-empty-title', text: this.#labels.text('matches', { query: this.#state.query }) }),
				el('button', { type: 'button', class: 'bui-button bui-button-secondary', onclick: () => this.#clear() }, [this.#labels.text('clear')])
			]);
		}
		const empty = this.#options.empty ?? {};
		return el('div', { class: 'bui-empty' }, [
			el('p', { class: 'bui-empty-title' }, [content(empty.title ?? this.#labels.text('empty'))]),
			empty.body ? el('p', { class: 'bui-empty-body' }, [content(empty.body)]) : null,
			empty.action ?? null
		]);
	}

	#failed(error) {
		const retry = el('button', { type: 'button', class: 'bui-button bui-button-secondary', onclick: () => this.load() }, [glyph('refresh'), el('span', { text: this.#labels.text('retry') })]);
		const message = this.#options.explain?.(error) ?? this.#labels.text('failure');
		fill(this.#region, [callout({ tone: 'danger', title: message, actions: [retry] })]);
		this.#columns.attach(null, this.#region);
		fill(this.#pager, []);
		this.#status.textContent = message;
		this.#paged = false;
		this.#options.onrender?.();
	}

	#paging({ rows, total, more, pages, limit }) {
		const page = this.#state.page;
		// Nothing to count: the empty state says why, and a range such as "1–0 of 0" would contradict it
		if (!rows.length && page === 1 && !more) return fill(this.#pager, []), '';
		const first = (page - 1) * limit + 1;
		const summary = total !== null ? this.#labels.text('range', { first, last: first + rows.length - 1, total }) : this.#labels.text('page', { page });
		const button = (text, target, enabled) =>
			el('button', { type: 'button', class: 'bui-button bui-button-secondary bui-button-small', disabled: !enabled, onclick: () => this.#go(target) }, [text]);
		// What fits on one page needs no range and no pager (0.15.0, DQ-12): the status still says the count
		if (page === 1 && !more) return fill(this.#pager, []), summary;
		fill(this.#pager, [
			button(this.#labels.text('previous'), page - 1, page > 1),
			el('p', { class: 'bui-pager-summary', text: pages ? `${summary} · ${this.#labels.text('of', { page, pages })}` : summary }),
			button(this.#labels.text('next'), page + 1, more)
		]);
		return summary;
	}
}
