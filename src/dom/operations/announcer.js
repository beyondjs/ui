import { el } from '../core/element.js';

/**
 * A polite live region that says what changed in an operation (a step done, a wait past its usual
 * time, the end), never the times that tick. Its element is visually hidden and belongs to the
 * component that owns it. Saying the same words twice is heard twice: the region is emptied first.
 */
export class Announcer {
	#element = el('p', { class: 'bui-hidden bui-announcer', 'aria-live': 'polite', 'aria-atomic': 'true' });

	get element() {
		return this.#element;
	}

	/** The words last said, for tests and for a product that mirrors them elsewhere. */
	get text() {
		return this.#element.textContent;
	}

	/** Says one or more messages; empty messages are skipped. */
	say(...messages) {
		const text = messages.filter(Boolean).join('. ');
		if (!text) return;
		this.#element.textContent = '';
		this.#element.textContent = text;
	}
}
