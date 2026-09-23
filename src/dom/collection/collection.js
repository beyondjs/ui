import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { icon } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { Select } from '../select.js';
import { callout, skeleton } from '../feedback.js';
import { Loader, local } from './loader.js';
import { Table } from './table.js';
import { defaults } from './labels.js';

/**
 * A compact collection: search, finite filters, a table of rows that open their detail, and paging.
 *
 * Its states are distinct and stated: loading, a failure with retry, an empty collection that
 * invites its first action, and no matches for the search or filters with a way to clear them. The
 * query, filters and page are the collection's `state`; `onstate` reports every change so the
 * product can keep it in the address, and passing it back as `state` restores the same view after
 * back, forward or a reload. The source decides what the person may see.
 */
export class Collection extends Component {
	static local = local;

	#element;
	#labels;
	#options;
	#loader;
	#state;
	#input;
	#filters = [];
	#region;
	#pager;
	#pending = null;
	#status;
	#paged = false;

	/**
	 * @param {object} options
	 * @param {string} options.label names the table and the search field
	 * @param {Array<{key: string, label: string, value?: (row: object) => Node|string, numeric?: boolean, primary?: boolean}>} options.columns
	 * @param {(request: {query: string, filters: object, page: number, limit: number, signal: AbortSignal}) => Promise<{rows: object[], total?: number, more?: boolean}>} options.source
	 * @param {(row: object) => string} [options.link] the address of a row's detail
	 * @param {{query?: string, filters?: object, page?: number}} [options.state] initial state, usually from the address
	 * @param {(state: {query: string, filters: object, page: number}) => void} [options.onstate]
	 * @param {{title: string, body?: string, action?: Node}} [options.empty] the empty collection
	 * @param {() => void} [options.onrender] runs after each redraw of the rows (the React adapter fills cells then)
	 */
	constructor(options) {
		super();
		const { label, source, search = true, filters = [], state = {}, labels = {} } = options;
		this.#options = options;
		this.#labels = new Labels(defaults, labels);
		this.#loader = new Loader(source);
		this.#state = { query: state.query ?? '', filters: { ...(state.filters ?? {}) }, page: Math.max(1, Number(state.page) || 1) };
		const id = Ids.next('bui-collection');
		this.#input = search
			? el('input', { id: `${id}-search`, type: 'search', class: 'bui-input', value: this.#state.query, autocomplete: 'off', placeholder: this.#labels.text('placeholder'), oninput: () => this.#typed() })
			: null;
		const tools = [
			this.#input ? el('div', { class: 'bui-collection-search' }, [el('label', { for: this.#input.id, class: 'bui-field-label' }, [this.#labels.text('search', { label })]), el('span', { class: 'bui-picker-search' }, [icon('search'), this.#input])]) : null,
			...filters.map(filter => this.#filter(filter, id))
		];
		this.#region = el('div', { class: 'bui-collection-body', tabindex: '-1', 'aria-busy': 'false' });
		this.#status = el('p', { class: 'bui-hidden', role: 'status' });
		this.#pager = el('nav', { class: 'bui-pager', 'aria-label': this.#labels.text('pages', { label }) });
		this.#element = el('section', { class: 'bui-collection', 'aria-label': typeof label === 'string' ? label : null }, [
			tools.some(Boolean) ? el('div', { class: 'bui-collection-tools' }, tools) : null,
			this.#status,
			this.#region,
			this.#pager
		]);
		this.load();
	}

	get element() {
		return this.#element;
	}

	/** The query, filters and page in view. */
	get state() {
		return { query: this.#state.query, filters: { ...this.#state.filters }, page: this.#state.page };
	}

	/** Changes the state (for example from the address on back or forward) and loads it. */
	set state(state) {
		this.#state = { query: state.query ?? '', filters: { ...(state.filters ?? {}) }, page: Math.max(1, Number(state.page) || 1) };
		if (this.#input) this.#input.value = this.#state.query;
		for (const filter of this.#filters) filter.select.value = this.#state.filters[filter.name] ?? '';
		this.load();
	}

	/** Loads the current state again. */
	async load() {
		const limit = this.#options.limit ?? 20;
		this.#region.setAttribute('aria-busy', 'true');
		this.#status.textContent = this.#labels.text('loading');
		if (!this.#region.querySelector('table')) fill(this.#region, [skeleton(4)]);
		const result = await this.#loader.load({ ...this.state, limit });
		if (result.stale || this.destroyed) return;
		this.#region.setAttribute('aria-busy', 'false');
		if (result.error) return this.#failed(result.error);
		const { rows = [], total = null, more = null } = result.answer ?? {};
		const pages = total !== null ? Math.max(1, Math.ceil(total / limit)) : null;
		if (!rows.length && this.#state.page > 1 && (pages === null || this.#state.page > pages)) return this.#go(pages ?? this.#state.page - 1);
		fill(this.#region, rows.length ? [this.#table(rows).element] : [this.#nothing()]);
		this.#options.onrender?.();
		const summary = this.#paging({ rows, total, more: more ?? (pages !== null ? this.#state.page < pages : false), pages, limit });
		this.#status.textContent = rows.length ? summary : this.#region.textContent;
		// After a page change focus moves to the new rows, so the pager button that was pressed can disable itself.
		if (this.#paged) this.#region.focus();
		this.#paged = false;
	}

	destroy() {
		this.#loader.cancel();
		super.destroy();
	}

	#table(rows) {
		const { label, columns, link = null, onopen = null, key } = this.#options;
		return new Table({ label, columns, rows, link, onopen, key });
	}

	#filter(filter, id) {
		const select = new Select({
			id: `${id}-${filter.name}`,
			options: [{ value: '', label: filter.all ?? this.#labels.text('all') }, ...filter.options],
			value: this.#state.filters[filter.name] ?? '',
			onchange: value => this.#change({ filters: { ...this.#state.filters, [filter.name]: value } })
		});
		this.#filters.push({ name: filter.name, select });
		return el('div', { class: 'bui-collection-filter' }, [el('label', { for: `${id}-${filter.name}`, class: 'bui-field-label' }, [content(filter.label)]), select.element]);
	}

	#typed() {
		this.#pending?.();
		this.#pending = this.later(() => this.#change({ query: this.#input.value.trim() }), this.#options.delay ?? 250);
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
		(this.#input ?? this.#region).focus();
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
		const retry = el('button', { type: 'button', class: 'bui-button bui-button-secondary', onclick: () => this.load() }, [icon('refresh'), el('span', { text: this.#labels.text('retry') })]);
		const message = this.#options.explain?.(error) ?? this.#labels.text('failure');
		fill(this.#region, [callout({ tone: 'danger', title: message, actions: [retry] })]);
		fill(this.#pager, []);
		this.#status.textContent = message;
		this.#paged = false;
		this.#options.onrender?.();
	}

	#paging({ rows, total, more, pages, limit }) {
		const page = this.#state.page;
		const first = (page - 1) * limit + 1;
		const summary = total !== null ? this.#labels.text('range', { first, last: first + rows.length - 1, total }) : this.#labels.text('page', { page });
		const button = (text, target, enabled) =>
			el('button', { type: 'button', class: 'bui-button bui-button-secondary bui-button-small', disabled: !enabled, onclick: () => this.#go(target) }, [text]);
		const single = page === 1 && !more;
		fill(this.#pager, single && total !== null ? [el('p', { class: 'bui-pager-summary', text: summary })] : [
			button(this.#labels.text('previous'), page - 1, page > 1),
			el('p', { class: 'bui-pager-summary', text: pages ? `${summary} · ${this.#labels.text('of', { page, pages })}` : summary }),
			button(this.#labels.text('next'), page + 1, more)
		]);
		return summary;
	}
}
