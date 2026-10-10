import { Interaction } from '../../core/interaction.js';
import { Button } from '../../button.js';

/**
 * **Dictate**: a quiet button with the `microphone` glyph beside its visible word (the microphone is not
 * on the closed list of icon-only glyphs, D11), hidden where dictation is not available. While a
 * dictation is under way it waits: it stays reachable, ignores presses (`aria-disabled`) and is
 * described by the line's words, which say what is happening and offer the ways on.
 */
export class DictationButton {
	#button;
	#waiting = false;

	/**
	 * @param {object} options
	 * @param {string} options.label the visible word ("Dictate")
	 * @param {boolean} options.available whether dictation is offered
	 * @param {() => void} options.onpress starts a dictation
	 */
	constructor({ label, available, onpress }) {
		this.#button = new Button({ label, glyph: 'microphone', variant: 'quiet', onclick: () => !this.#waiting && onpress() });
		this.#button.element.classList.add('bui-dictation-button');
		this.#button.element.hidden = !available;
	}

	get element() {
		return this.#button.element;
	}

	/** Whether it is what the person is using: focused, or last pressed while focus is adrift. */
	get used() {
		return Interaction.used(this.#button.element);
	}

	/** Waits, described by the element of that id (the line's words), or is ready again with null. */
	set waiting(id) {
		const element = this.#button.element;
		this.#waiting = Boolean(id);
		if (id) {
			element.setAttribute('aria-disabled', 'true');
			element.setAttribute('aria-describedby', id);
		} else {
			element.removeAttribute('aria-disabled');
			element.removeAttribute('aria-describedby');
		}
	}

	destroy() {
		this.#button.destroy();
	}
}
