import { el } from '../core/element.js';
import { PickerRow } from './row.js';

/**
 * The listbox of a picker's results and its active option.
 *
 * Focus stays in the search field; the active option is announced through `aria-activedescendant`,
 * the combobox pattern. Disabled options remain reachable so their reason can be read, and are never
 * chosen. Pressing an option does not move focus out of the search field. A suggested group (recent
 * or suggested items, `{ label, items }`) comes first as an ARIA group named by its heading.
 */
export class ResultList {
	#element;
	#input;
	#options = [];
	#active = -1;
	#prefix;

	constructor({ id, label, multiple, input, onchoose }) {
		this.#input = input;
		this.#prefix = id;
		this.#element = el('ul', {
			id,
			class: 'bui-picker-list',
			role: 'listbox',
			'aria-label': label,
			'aria-multiselectable': multiple ? 'true' : null,
			onmousedown: event => event.preventDefault(),
			onclick: event => {
				const node = event.target.closest('[role="option"]');
				if (node) onchoose(this.#options.findIndex(entry => entry.node === node));
			}
		});
	}

	get element() {
		return this.#element;
	}

	/** The item of the active option, if any. */
	get active() {
		return this.#options[this.#active]?.item ?? null;
	}

	get size() {
		return this.#options.length;
	}

	/** Draws the items after the suggested group, marking the chosen ones; keeps the active item when it is still listed. */
	render(items, chosen, labels, suggested = null) {
		const previous = this.active?.id;
		const now = Date.now();
		const lead = suggested?.items?.length ? suggested.items : [];
		this.#options = [...lead, ...items].map((item, index) => ({ item, node: this.#option(item, index, chosen(item.id), labels, now) }));
		const group = lead.length ? this.#group(suggested.label ?? labels.text('suggested'), this.#options.slice(0, lead.length)) : null;
		this.#element.replaceChildren(...[group, ...this.#options.slice(lead.length).map(entry => entry.node)].filter(Boolean));
		const kept = this.#options.findIndex(entry => String(entry.item.id) === String(previous));
		this.activate(kept);
	}

	/** The index of the option of `id`, or -1. */
	find(id) {
		return this.#options.findIndex(entry => String(entry.item.id) === String(id));
	}

	/** Refreshes which options are marked chosen. */
	mark(chosen) {
		for (const { item, node } of this.#options) node.setAttribute('aria-selected', String(chosen(item.id)));
	}

	/** Makes the option at `index` active (-1 for none) and scrolls it into view. */
	activate(index) {
		this.#active = index >= 0 && index < this.#options.length ? index : -1;
		this.#options.forEach((entry, position) => entry.node.classList.toggle('bui-option-active', position === this.#active));
		const node = this.#options[this.#active]?.node;
		if (node) {
			this.#input.setAttribute('aria-activedescendant', node.id);
			node.scrollIntoView?.({ block: 'nearest' });
		} else this.#input.removeAttribute('aria-activedescendant');
	}

	/** Moves the active option by a key; returns whether the key was handled. */
	move(key) {
		const last = this.#options.length - 1;
		if (last < 0) return false;
		const next = { ArrowDown: this.#active + 1, ArrowUp: this.#active - 1, PageDown: this.#active + 10, PageUp: this.#active - 10 }[key];
		if (next === undefined) return false;
		this.activate(Math.min(Math.max(next, 0), last));
		return true;
	}

	/** The item at an index. */
	item(index) {
		return this.#options[index]?.item ?? null;
	}

	#option(item, index, chosen, labels, now) {
		return el(
			'li',
			{
				id: `${this.#prefix}-option-${index}`,
				role: 'option',
				class: 'bui-option',
				'aria-selected': String(chosen),
				'aria-disabled': item.disabled ? 'true' : null
			},
			PickerRow.parts(item, labels, now)
		);
	}

	#group(label, entries) {
		const id = `${this.#prefix}-group`;
		return el('li', { role: 'group', class: 'bui-picker-group', 'aria-labelledby': id }, [
			el('span', { id, class: 'bui-picker-heading', role: 'presentation', text: label }),
			el('ul', { role: 'none', class: 'bui-picker-grouped' }, entries.map(entry => entry.node))
		]);
	}
}
