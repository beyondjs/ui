import { el, content } from '../core/element.js';
import { badge } from '../feedback.js';
import { icon } from '../core/icons.js';

/**
 * The chosen items of a picker, kept by id independently of the results shown, so a choice
 * survives new queries, filters and pages.
 *
 * An item may carry `state` (`stale`, `ineligible`, `unavailable`) and `reason` when the consumer
 * learns that a chosen item can no longer be used; it stays listed with its reason until the person
 * removes it, instead of disappearing silently. `render` draws the chips and hidden form inputs.
 */
export class Selection {
	#items = new Map();
	#multiple;

	constructor(items = [], multiple = true) {
		this.#multiple = multiple;
		for (const item of items) this.#items.set(String(item.id), { ...item, id: String(item.id) });
	}

	get items() {
		return [...this.#items.values()];
	}

	get ids() {
		return [...this.#items.keys()];
	}

	get size() {
		return this.#items.size;
	}

	/** Items that need the person's attention. */
	get problems() {
		return this.items.filter(item => item.state);
	}

	has(id) {
		return this.#items.has(String(id));
	}

	/** Adds or removes an item; a single picker replaces its one choice. Returns whether it is chosen. */
	toggle(item) {
		const id = String(item.id);
		if (this.#items.has(id)) {
			this.#items.delete(id);
			return false;
		}
		if (!this.#multiple) this.#items.clear();
		this.#items.set(id, { id, label: item.label, description: item.description ?? null });
		return true;
	}

	/** Adds every item not chosen yet (a multiple picker only). Returns how many were added. */
	add(items) {
		if (!this.#multiple) return 0;
		const fresh = items.filter(item => !this.#items.has(String(item.id)));
		for (const item of fresh) this.#items.set(String(item.id), { id: String(item.id), label: item.label, description: item.description ?? null });
		return fresh.length;
	}

	remove(id) {
		this.#items.delete(String(id));
	}

	/** Records that a chosen item became stale or ineligible, or clears that with `state: null`. */
	mark(id, { state = null, reason = null } = {}) {
		const item = this.#items.get(String(id));
		if (item) this.#items.set(item.id, { ...item, state, reason });
	}

	/** Chips for the chosen items, each with a remove button. */
	chips(labels, onremove) {
		return this.items.map(item =>
			el('li', { class: `bui-chip${item.state ? ' bui-chip-problem' : ''}`, 'data-id': item.id }, [
				el('span', { class: 'bui-chip-label' }, [content(item.label)]),
				item.state ? badge(labels.text(item.state), 'warning') : null,
				item.state && item.reason ? el('span', { class: 'bui-chip-reason', text: item.reason }) : null,
				el('button', {
					type: 'button',
					class: 'bui-chip-remove',
					'aria-label': labels.text('remove', { label: typeof item.label === 'string' ? item.label : item.id }),
					onclick: () => onremove(item.id)
				}, [icon('close')])
			])
		);
	}

	/** Hidden inputs that submit the chosen ids with a form. */
	inputs(name) {
		return name ? this.ids.map(id => el('input', { type: 'hidden', name, value: id })) : [];
	}
}
