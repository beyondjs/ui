import { Select } from '../select.js';

/**
 * A picker's finite restrictions beside its search (`filters`: `{ name, label, options, value? }`): one
 * `Select` each, named by its label, whose change searches again.
 */
export class PickerFilters {
	#items;

	/**
	 * @param {Array<{name: string, label: string, options: object[], value?: string|null}>} filters
	 * @param {() => void} onchange searches again
	 */
	constructor(filters, onchange) {
		this.#items = filters.map(filter => {
			const select = new Select({ options: filter.options, value: filter.value ?? null, onchange: () => onchange() });
			select.control.setAttribute('aria-label', filter.label);
			return { name: filter.name, select };
		});
	}

	/** The selects, in the bar after the search. */
	get elements() {
		return this.#items.map(item => item.select.element);
	}

	/** The chosen value of each filter, by name. */
	get values() {
		return Object.fromEntries(this.#items.map(item => [item.name, item.select.value]));
	}

	/** Whether any filter narrows the search. */
	get narrowed() {
		return this.#items.some(item => Boolean(item.select.value));
	}

	destroy() {
		for (const item of this.#items) item.select.destroy();
	}
}
