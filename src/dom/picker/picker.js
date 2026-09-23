import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { icon } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { Select } from '../select.js';
import { Search } from './search.js';
import { Selection } from './selection.js';
import { ResultList } from './list.js';
import { defaults } from './labels.js';

/**
 * A searchable picker of one or many entities from a source that may be large, paged and slow.
 *
 * The person types to search (and may narrow with finite `filters`); results arrive a page at a time
 * with "Load more". Choices are kept by id across queries, filters and pages, counted, and listed as
 * removable chips above the search. Loading, no matches, an empty source, a failure with retry,
 * disabled results with their reason and chosen items that became stale or ineligible are all
 * stated in words. Keyboard: arrows and Page Up/Down move through results, Enter chooses, Escape
 * clears the search. Authorization stays with the product: the source returns what the person may
 * see, and the product revalidates the choice when it is committed (`mark` reports what it found).
 */
export class Picker extends Component {
	#element;
	#labels;
	#input;
	#list;
	#search;
	#selection;
	#status;
	#count;
	#chips;
	#inputs;
	#retry;
	#more;
	#name;
	#onchange;
	#filters = [];
	#delay;
	#pending = null;

	/**
	 * @param {object} options
	 * @param {string} options.label names the search field and the list
	 * @param {(request: {query: string, filters: object, cursor: unknown, limit: number, signal: AbortSignal}) => Promise<{items: object[], next?: unknown, total?: number}>} options.source
	 * @param {boolean} [options.multiple] several choices (default true)
	 * @param {Array<{id: string, label: string, state?: string, reason?: string}>} [options.selected]
	 * @param {Array<{name: string, label: string, options: Array<{value: string, label: string}>}>} [options.filters]
	 * @param {string} [options.name] submits the chosen ids with a form as hidden inputs
	 */
	constructor({ label, source, multiple = true, selected = [], filters = [], name = null, hint = null, limit = 20, delay = 250, onchange = null, labels = {} }) {
		super();
		this.#labels = new Labels(defaults, labels);
		this.#name = name;
		this.#onchange = onchange;
		this.#delay = delay;
		this.#selection = new Selection(selected, multiple);
		const id = Ids.next('bui-picker');
		this.#status = el('p', { id: `${id}-status`, class: 'bui-picker-status', role: 'status' });
		this.#count = el('p', { id: `${id}-count`, class: 'bui-picker-count', 'aria-live': 'polite' });
		this.#chips = el('ul', { class: 'bui-chips', 'aria-label': this.#labels.text('chosen') });
		this.#inputs = el('div', { hidden: true });
		this.#input = el('input', {
			id: `${id}-input`,
			type: 'search',
			class: 'bui-input bui-picker-input',
			role: 'combobox',
			autocomplete: 'off',
			'aria-autocomplete': 'list',
			'aria-expanded': 'true',
			'aria-controls': `${id}-list`,
			'aria-describedby': [hint ? `${id}-hint` : null, `${id}-count`, `${id}-status`].filter(Boolean).join(' '),
			placeholder: this.#labels.text('placeholder'),
			oninput: () => this.#typed(),
			onkeydown: event => this.#keys(event)
		});
		this.#list = new ResultList({ id: `${id}-list`, label, multiple, input: this.#input, onchoose: index => this.#choose(this.#list.item(index)) });
		this.#retry = el('button', { type: 'button', class: 'bui-button bui-button-secondary bui-button-small', hidden: true, onclick: () => this.#search.retry() }, [icon('refresh'), el('span', { text: this.#labels.text('retry') })]);
		this.#more = el('button', { type: 'button', class: 'bui-button bui-button-quiet bui-button-small', hidden: true, onclick: () => this.#search.page() }, [el('span', { text: this.#labels.text('more') })]);
		this.#search = new Search({ source, limit, onchange: () => this.#render() });
		this.#element = el('div', { class: `bui-picker${multiple ? ' bui-picker-multiple' : ''}` }, [
			el('label', { for: `${id}-input`, class: 'bui-field-label' }, [content(label)]),
			hint ? el('p', { id: `${id}-hint`, class: 'bui-field-hint' }, [content(hint)]) : null,
			el('div', { class: 'bui-picker-chosen' }, [this.#count, this.#chips]),
			el('div', { class: 'bui-picker-bar' }, [el('span', { class: 'bui-picker-search' }, [icon('search'), this.#input]), ...this.#filter(filters)]),
			this.#list.element,
			el('div', { class: 'bui-picker-foot' }, [this.#status, this.#retry, this.#more]),
			this.#inputs
		]);
		this.#draw();
		this.#search.find('', this.#values());
	}

	get element() {
		return this.#element;
	}

	/** The chosen ids. */
	get value() {
		return this.#selection.ids;
	}

	/** The chosen items, with any `state` and `reason`. */
	get selected() {
		return this.#selection.items;
	}

	/** The search field, for focusing it. */
	get control() {
		return this.#input;
	}

	/** Records the product's finding about a chosen item (`stale`, `ineligible`, `unavailable`), or clears it. */
	mark(id, finding) {
		this.#selection.mark(id, finding);
		this.#draw();
	}

	/** Removes a chosen item. */
	remove(id) {
		this.#selection.remove(id);
		this.#draw();
		this.#onchange?.(this.selected);
	}

	/** Searches again with the current query and filters, for example after the source changed. */
	refresh() {
		return this.#search.find(this.#input.value.trim(), this.#values());
	}

	focus() {
		this.#input.focus();
	}

	destroy() {
		this.#search.cancel();
		super.destroy();
	}

	#filter(filters) {
		this.#filters = filters.map(filter => ({ name: filter.name, select: new Select({ options: filter.options, value: filter.value ?? null, onchange: () => this.refresh() }) }));
		return filters.map((filter, index) => {
			const select = this.#filters[index].select;
			select.control.setAttribute('aria-label', filter.label);
			return select.element;
		});
	}

	#values() {
		return Object.fromEntries(this.#filters.map(filter => [filter.name, filter.select.value]));
	}

	#typed() {
		this.#pending?.();
		this.#pending = this.later(() => this.refresh(), this.#delay);
	}

	#keys(event) {
		if (this.#list.move(event.key)) event.preventDefault();
		else if (event.key === 'Enter') {
			event.preventDefault();
			if (this.#list.active) this.#choose(this.#list.active);
		} else if (event.key === 'Escape' && this.#input.value) {
			event.preventDefault();
			event.stopPropagation();
			this.#input.value = '';
			this.#pending?.();
			this.refresh();
		}
	}

	#choose(item) {
		if (!item || item.disabled) return;
		this.#selection.toggle(item);
		this.#list.mark(id => this.#selection.has(id));
		this.#draw();
		this.#onchange?.(this.selected);
	}

	#draw() {
		const problems = this.#selection.problems.length;
		const size = this.#selection.size;
		this.#count.textContent = [
			size ? this.#labels.text('count', { count: size }) : this.#labels.text('none'),
			problems ? this.#labels.text('attention', { count: problems }) : null
		].filter(Boolean).join(' · ');
		fill(this.#chips, this.#selection.chips(this.#labels, id => this.#drop(id)));
		this.#chips.hidden = !size;
		fill(this.#inputs, this.#selection.inputs(this.#name));
	}

	// Removing a chip moves focus to the next chip, or to the search field when none is left.
	#drop(id) {
		const chips = [...this.#chips.querySelectorAll('.bui-chip-remove')];
		const index = chips.findIndex(button => button.closest('[data-id]').dataset.id === String(id));
		this.remove(id);
		this.#list.mark(key => this.#selection.has(key));
		const next = [...this.#chips.querySelectorAll('.bui-chip-remove')];
		(next[Math.min(index, next.length - 1)] ?? this.#input).focus();
	}

	#render() {
		const search = this.#search;
		const query = search.request?.query ?? '';
		const busy = search.state === 'loading' || search.state === 'more';
		this.#list.element.setAttribute('aria-busy', String(busy));
		if (search.state !== 'more') this.#list.render(search.items, id => this.#selection.has(id), this.#labels);
		this.#retry.hidden = search.state !== 'failed';
		const focused = this.#more.ownerDocument.activeElement === this.#more;
		this.#more.hidden = !(search.state === 'ready' && search.more);
		this.#more.toggleAttribute('data-busy', search.state === 'more');
		if (focused && this.#more.hidden) this.#input.focus();
		this.#status.textContent = this.#describe(search, query);
		this.#status.classList.toggle('bui-picker-problem', search.state === 'failed');
	}

	#describe(search, query) {
		const labels = this.#labels;
		if (search.state === 'loading' || search.state === 'more') return labels.text('loading');
		if (search.state === 'failed') return labels.text('failure');
		if (search.state !== 'ready') return '';
		if (!search.items.length) return query || Object.values(this.#values()).some(Boolean) ? labels.text('empty', { query }) : labels.text('nothing');
		if (search.total !== null) return labels.text('total', { shown: search.items.length, total: search.total });
		return labels.text('shown', { shown: search.items.length });
	}
}
