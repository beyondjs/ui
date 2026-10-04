import { el, fill } from '../core/element.js';

/**
 * What a picker has chosen, above its search field: the count ("3 selected · 1 needs attention"),
 * announced politely, the chips with their remove buttons, and the hidden inputs that submit the
 * chosen ids with a form. Removing a chip moves focus to the next chip, or to the search field when
 * none is left.
 */
export class PickerChosen {
	#element;
	#count;
	#chips;
	#inputs;
	#selection;
	#labels;
	#name;
	#input;
	#tip;
	#onremove;

	/**
	 * @param {object} options
	 * @param {string} options.id the count's id, which the search field's description names
	 * @param {import('./selection.js').Selection} options.selection
	 * @param {import('../core/labels.js').Labels} options.labels
	 * @param {string|null} options.name the form name of the hidden inputs
	 * @param {HTMLInputElement} options.input the search field
	 * @param {import('../core/hint.js').Hint} options.tip the hint of the chips' remove buttons
	 * @param {(id: string) => void} options.onremove removes a choice
	 */
	constructor({ id, selection, labels, name, input, tip, onremove }) {
		this.#selection = selection;
		this.#labels = labels;
		this.#name = name;
		this.#input = input;
		this.#tip = tip;
		this.#onremove = onremove;
		this.#count = el('p', { id, class: 'bui-picker-count', 'aria-live': 'polite' });
		this.#chips = el('ul', { class: 'bui-chips', 'aria-label': labels.text('chosen') });
		this.#inputs = el('div', { hidden: true });
		this.#element = el('div', { class: 'bui-picker-chosen' }, [this.#count, this.#chips]);
	}

	get element() {
		return this.#element;
	}

	/** The hidden inputs, placed at the end of the picker. */
	get inputs() {
		return this.#inputs;
	}

	/** The hint of the chips, once the picker made it. */
	set tip(tip) {
		this.#tip = tip;
	}

	draw() {
		const problems = this.#selection.problems.length;
		const size = this.#selection.size;
		const labels = this.#labels;
		this.#count.textContent = [size ? labels.text('count', { count: size }) : labels.text('none'), problems ? labels.text('attention', { count: problems }) : null].filter(Boolean).join(' · ');
		this.#tip?.release(this.#chips);
		fill(this.#chips, this.#selection.chips(labels, id => this.#drop(id)));
		this.#chips.hidden = !size;
		fill(this.#inputs, this.#selection.inputs(this.#name));
	}

	#drop(id) {
		const chips = [...this.#chips.querySelectorAll('.bui-chip-remove')];
		const index = chips.findIndex(button => button.closest('[data-id]').dataset.id === String(id));
		this.#onremove(id);
		const next = [...this.#chips.querySelectorAll('.bui-chip-remove')];
		(next[Math.min(index, next.length - 1)] ?? this.#input).focus();
	}
}
