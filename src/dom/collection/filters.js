import { Component } from '../core/component.js';
import { el, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Disclosure } from '../disclosure.js';
import { Select } from '../select.js';

/** A disclosure of finite filters and persistent, individually removable restrictions. */
export class CollectionFilters extends Component {
	#element;
	#disclosure;
	#entries;
	#labels;
	#change;
	#state = {};
	#summary;
	#reset;
	#caption = el('span');

	constructor({ filters, labels, onchange }) {
		super();
		this.#labels = labels;
		this.#change = onchange;
		const id = Ids.next('bui-list-filter');
		this.#entries = filters.map((filter, index) => this.#entry(filter, `${id}-${index}`));
		this.#reset = el('button', { type: 'button', class: 'bui-button bui-button-quiet', text: labels.text('reset'), hidden: true, onclick: () => { this.#change({}); this.#entries[0]?.select.control.focus(); } });
		this.#disclosure = new Disclosure({ label: [glyph('filter'), this.#caption], variant: 'quiet', class: 'bui-list-filters', children: [...this.#entries.map(entry => entry.field), this.#reset] });
		this.#disclosure.panel.setAttribute('role', 'group');
		this.#disclosure.panel.setAttribute('aria-label', labels.text('filters'));
		this.#summary = el('div', { class: 'bui-list-restrictions' });
		this.#element = el('div', { class: 'bui-list-filter-tools' }, [this.#disclosure.element, this.#summary]);
		this.state = {};
	}

	get element() { return this.#element; }

	#entry(filter, id) {
		const options = [{ value: '', label: filter.all ?? this.#labels.text('all') }, ...filter.options];
		const select = new Select({ id, options, statement: false, onchange: value => this.#change({ ...this.#state, [filter.name]: value }) });
		const field = el('div', { class: 'bui-collection-filter' }, [el('label', { for: id, class: 'bui-field-label' }, [content(filter.label)]), select.element]);
		const chip = el('button', { type: 'button', class: 'bui-button bui-button-quiet bui-list-restriction', hidden: true, onclick: () => this.#remove(filter.name) });
		return { filter, select, field, chip, value: '' };
	}

	set state(state) {
		this.#state = { ...state };
		let count = 0;
		for (const entry of this.#entries) {
			const { filter, select, chip } = entry;
			const value = String(state[filter.name] ?? '');
			const options = filter.options.flatMap(option => option.options ?? [option]);
			const chosen = options.find(option => String(option.value) === value);
			if (entry.value !== value) {
				select.control.querySelector('[data-bui-unknown]')?.remove();
				if (value && !chosen) select.control.append(el('option', { value, disabled: true, 'data-bui-unknown': '', text: this.#labels.text('unknown') }));
				select.value = value;
				entry.value = value;
			}
			chip.hidden = !value;
			if (!value) continue;
			count++;
			const text = chosen?.label ?? this.#labels.text('unknown');
			const name = typeof filter.label === 'string' ? filter.label : filter.label.textContent;
			const title = typeof text === 'string' ? text : text.textContent;
			chip.setAttribute('aria-label', this.#labels.text('remove', { label: name, value: title }));
			chip.replaceChildren(el('span', { text: `${name}: ${title}` }), glyph('close'));
		}
		// Keep chip nodes and focus stable when a live read or controlled state echoes the same filters.
		if (!this.#summary.childElementCount) this.#summary.append(...this.#entries.map(entry => entry.chip));
		this.#summary.hidden = !count;
		this.#reset.hidden = !count;
		this.#caption.textContent = this.#labels.text(count ? 'filtered' : 'filters', { count });
	}

	focus() { this.#disclosure.button.focus(); }

	#remove(name) {
		this.#change({ ...this.#state, [name]: '' });
		this.focus();
	}

	destroy() {
		for (const entry of this.#entries) entry.select.destroy();
		this.#disclosure.destroy();
		super.destroy();
	}
}
