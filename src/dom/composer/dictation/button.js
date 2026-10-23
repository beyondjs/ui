import { Interaction } from '../../core/interaction.js';
import { Button } from '../../button.js';

/**
 * **Dictate**: since 0.26.0 (D165) the `microphone` glyph alone in one round target, its word its name and
 * its tooltip (the microphone joined D11's closed list), hidden where dictation is not available. While a
 * dictation is under way it waits: it stays reachable, ignores presses (`aria-disabled`) and is
 * described by the line's words, which say what is happening and offer the ways on.
 */
export class DictationButton {
	#button;
	#waiting = false;

	/**
	 * @param {object} options
	 * @param {string} options.label its word ("Dictate"), its name and tooltip
	 * @param {boolean} options.available whether dictation is offered
	 * @param {() => void} options.onpress starts a dictation
	 */
	constructor({ label, available, onpress }) {
		this.#button = new Button({ label, glyph: 'microphone', variant: 'quiet', bare: true, onclick: () => !this.#waiting && onpress() });
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
