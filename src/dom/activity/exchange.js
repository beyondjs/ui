import { el } from '../core/element.js';
import { ActivitySection } from './section.js';

/**
 * What a step was given and what it gave back, in one box of an opened activity row (0.12.0): a record
 * `{ exchange: [{ label, text }, …] }`, such as a command ("In") and its output ("Out"). Each part is
 * an `ActivitySection` laid out as a row of the box, its label beside its text, with its own "Show all
 * {count} lines" and "Copy"; a part without text is left out. The labels are the product's words.
 */
export class ActivityExchange {
	#element;
	#parts;

	/**
	 * @param {Array<{label: string, text?: string|null, lines?: number, copy?: boolean}>} parts
	 * @param {import('../core/labels.js').Labels} labels the row's copy
	 */
	constructor(parts, labels) {
		const given = (Array.isArray(parts) ? parts : []).filter(part => part && part.text !== null && part.text !== undefined && part.text !== '');
		this.#parts = given.map(part => new ActivitySection({ label: part.label, text: part.text, lines: part.lines, copy: part.copy ?? true }, labels));
		this.#element = el('div', { class: 'bui-activity-exchange' }, this.#parts.map(part => part.element));
	}

	get element() {
		return this.#element;
	}

	/** Its sections, in order. */
	get parts() {
		return [...this.#parts];
	}
}
