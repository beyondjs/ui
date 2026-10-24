import { Listeners } from './component.js';

/**
 * A control that waits quiet while there is nothing for it to act on yet (0.32.0, D183), such as Add
 * while nothing is chosen. It keeps its name and place, draws the family's quiet look with
 * `aria-disabled` and stays reachable; a busy control (`data-busy`) keeps what its work draws. Given
 * `place`, a press while it waits only puts the person there, saying nothing, and the product's own
 * handler never runs; without it the press stays the product's. `settle()` draws it again once what it
 * waits for changes; given a `form`, it hears every change of its fields until `destroy()`. A form's own
 * submit buttons wait through `Required`.
 */
export class Quiet {
	#control;
	#waiting;
	#place;
	#listeners = new Listeners();

	/**
	 * @param {HTMLElement} control
	 * @param {object} options
	 * @param {() => boolean} options.waiting whether there is still nothing for it to act on
	 * @param {(() => HTMLElement|null|undefined)|null} [options.place] where a press puts the person while it waits
	 * @param {HTMLFormElement|null} [options.form] a form heard on every change of its fields
	 */
	constructor(control, { waiting, place = null, form = null }) {
		if (typeof waiting !== 'function') throw new TypeError('A quiet control says what it waits for with waiting()');
		this.#control = control;
		this.#waiting = waiting;
		this.#place = place;
		// Heard on the way down, before any handler of the control's own, which a press while it waits never reaches
		if (place) this.#listeners.add(control.ownerDocument, 'click', event => this.#press(event), { capture: true });
		if (form) {
			this.#listeners.add(form, 'input', () => this.settle());
			this.#listeners.add(form, 'change', () => this.settle());
		}
		this.settle();
	}

	/** Whether there is still nothing for the control to act on. */
	get waiting() {
		return Boolean(this.#waiting());
	}

	/** Draws the control quiet while it waits and able once it does not; a busy control keeps its state. */
	settle() {
		if (this.#control.hasAttribute('data-busy')) return;
		if (this.waiting) this.#control.setAttribute('aria-disabled', 'true');
		else this.#control.removeAttribute('aria-disabled');
	}

	/** Releases its listeners and leaves the control able. */
	destroy() {
		this.#listeners.release();
		if (!this.#control.hasAttribute('data-busy')) this.#control.removeAttribute('aria-disabled');
	}

	#press(event) {
		if (!this.#control.contains(event.target) || !this.waiting) return;
		event.preventDefault();
		event.stopImmediatePropagation();
		this.#place?.()?.focus();
	}
}
