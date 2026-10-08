import { el, fill, content } from '../core/element.js';

/**
 * One row of `Facts`, patched in place: its label (`dt`), and its data (`dd`): the value (monospaced
 * when `mono`), a stale row's muted note and the row's own action. An action node that is already in
 * place is never moved, so a focused Copy keeps its focus through a live change.
 */
export class FactsRow {
	#element;
	#label = el('dt', { class: 'bui-facts-label' });
	#value = el('span', { class: 'bui-facts-value' });
	#note = el('span', { class: 'bui-facts-note' });
	#action = el('span', { class: 'bui-facts-action' });
	#data = el('dd', { class: 'bui-facts-data' }, [this.#value]);
	#shown = { label: null, value: null };

	constructor() {
		this.#element = el('div', { class: 'bui-facts-row' }, [this.#label, this.#data]);
	}

	get element() {
		return this.#element;
	}

	/**
	 * @param {{label: string|Node, value?: string|number|Node|null, mono?: boolean, action?: Node|{element: Node}|null, stale?: boolean|string|null}} row
	 * @param {import('../core/labels.js').Labels} labels the copy (`stale`, said when `stale` is true)
	 */
	update({ label, value = null, mono = false, action = null, stale = null }, labels) {
		if (this.#shown.label !== label) fill(this.#label, [content(label)]);
		const shown = value === null || value === undefined ? '' : value;
		if (this.#shown.value !== shown || typeof shown !== 'string') fill(this.#value, [content(typeof shown === 'number' ? String(shown) : shown)]);
		this.#shown = { label, value: shown };
		this.#value.toggleAttribute('data-mono', Boolean(mono));
		const note = stale ? (typeof stale === 'string' ? stale : labels.text('stale')) : null;
		this.#element.toggleAttribute('data-stale', Boolean(note));
		if (note) {
			if (this.#note.textContent !== note) this.#note.textContent = note;
			if (this.#note.parentNode !== this.#data) this.#value.after(this.#note);
		} else this.#note.remove();
		this.#act(action?.element ?? action);
	}

	#act(node) {
		if (!node) return this.#action.remove();
		if (this.#action.firstChild !== node || this.#action.childNodes.length !== 1) fill(this.#action, [node]);
		if (this.#action.parentNode !== this.#data) this.#data.append(this.#action);
	}
}
