import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { Labels } from '../core/labels.js';
import { CollectionSearch } from './search.js';
import { CollectionFilters } from './filters.js';
import { words } from './tools-labels.js';

/** Shared tools for collections, supplied-row tables and product-owned object lists. */
export class CollectionTools extends Component {
	static labels = words;
	#element;
	#search = null;
	#filters = null;
	#state = { query: '', filters: {} };
	#change;
	#pending = null;
	#delay;

	constructor({ label, search = true, filters = [], state = {}, onchange = null, labels = {}, compact = true, delay = 200 }) {
		super();
		this.#change = onchange;
		this.#delay = delay;
		const words = new Labels(CollectionTools.labels.en, labels);
		if (search) this.#search = new CollectionSearch({ label, labels: words, compact, onchange: (query, immediate) => this.#query(query, immediate), onclose: () => this.#flush() });
		if (filters.length) this.#filters = new CollectionFilters({ filters, labels: words, onchange: filters => {
			this.#state.filters = filters;
			this.#filters.state = filters;
			this.#publish();
		} });
		this.#element = el('div', { class: 'bui-list-tools', role: 'group', 'aria-label': words.text('tools', { label: typeof label === 'string' ? label : '' }), hidden: !search && !filters.length }, [this.#search?.element, this.#filters?.element].filter(Boolean));
		this.state = state;
	}

	get element() { return this.#element; }
	get state() { return { query: this.#state.query, filters: { ...this.#state.filters } }; }

	/** Restores address state without reporting a new user change. */
	set state(state) {
		this.#cancel();
		this.#state = { query: String(state?.query ?? ''), filters: { ...(state?.filters ?? {}) } };
		if (this.#search) this.#search.value = this.#state.query;
		if (this.#filters) this.#filters.state = this.#state.filters;
	}

	focus() {
		if (this.#search) this.#search.focus();
		else this.#filters?.focus();
	}

	#query(query, immediate) {
		this.#state.query = query;
		this.#cancel();
		if (immediate) return this.#publish();
		this.#pending = this.later(() => this.#publish(), this.#delay);
	}

	#cancel() {
		this.#pending?.();
		this.#pending = null;
	}

	#flush() { if (this.#pending) this.#publish(); }

	#publish() {
		this.#cancel();
		this.#change?.(this.state);
	}

	destroy() {
		this.#cancel();
		this.#search?.destroy();
		this.#filters?.destroy();
		super.destroy();
	}
}
