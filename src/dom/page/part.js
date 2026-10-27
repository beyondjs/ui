import { el, fill } from '../core/element.js';
import { waiting } from '../feedback.js';

/**
 * One part of a section's body that waits for its own read while the rest of the body is drawn (0.44.0,
 * LOAD-01): Accounts' Devices, whose list waits beside an action of the section's body. Made by
 * `Section.part()`, which keeps the section `aria-busy` while one of its parts placed in its body waits, so
 * the region is busy as a whole-body wait makes it. The part holds `waiting(shape)` until `children` is set.
 */
export class SectionPart {
	#element = el('div', { class: 'bui-section-part' });
	#onchange;

	/**
	 * @param {object} options
	 * @param {object|number|boolean|null} [options.waiting] starts waiting in that shape
	 * @param {Node[]} [options.children] its content, when it does not wait
	 * @param {() => void} options.onchange called when it starts or stops waiting
	 */
	constructor({ waiting: shape = null, children = [], onchange }) {
		this.#onchange = onchange;
		if (shape) this.wait(shape === true ? {} : shape);
		else this.children = children;
	}

	get element() {
		return this.#element;
	}

	/** Whether the part waits for its read. */
	get waiting() {
		return this.#element.hasAttribute('data-waiting');
	}

	/** Replaces the part's content, ending its wait. */
	set children(children) {
		this.#element.removeAttribute('data-waiting');
		fill(this.#element, children);
		this.#onchange();
	}

	/** Waits in place: the part holds `waiting(shape)` until `children` is set. */
	wait(shape = {}) {
		this.#element.setAttribute('data-waiting', '');
		fill(this.#element, [waiting(shape)]);
		this.#onchange();
	}
}
