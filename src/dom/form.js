import { Listeners } from './core/component.js';
import { el } from './core/element.js';
import { Labels } from './core/labels.js';
import { callout } from './feedback.js';
import { Required } from './core/required.js';

const defaults = { failure: 'That did not work. Try again.' };

/**
 * Submission behavior for a focused create or edit form the consumer owns.
 *
 * It validates the given fields first (focusing the first invalid one), then runs `submit` once:
 * while it runs the form is `aria-busy`, its submit buttons are marked unavailable and further
 * submissions — a double click, a second Enter — are ignored. Without `fields`, the browser's own
 * constraint validation runs. A failure is shown in the form as an
 * alert with the consumer's explanation and leaves every value in place. The form element stays the
 * consumer's: `destroy()` releases the listener and removes only what this class added.
 *
 * Nothing still to write is a failure (0.32.0, D183): while a part waits (`Required`: a required field
 * empty, or a part the product marks `data-missing`), the submit buttons are quiet (`aria-disabled`,
 * still reachable, a dialog footer's that name the form included), and a submission puts the caret in
 * the first part that waits and says nothing. Only a value that is wrong is said, as before.
 */
export class FocusedForm {
	/** The copy in English and Spanish (0.7.2). */
	static labels = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze({ failure: 'No funcionó. Vuelve a intentarlo.' }) });

	#form;
	#fields;
	#required;
	#submit;
	#explain;
	#labels;
	#listeners = new Listeners();
	#problem;
	#busy = false;
	#saved = new Map();
	#held = new Set();
	#onbusy;

	/**
	 * @param {HTMLFormElement} form
	 * @param {object} options
	 * @param {(values: Record<string,string>, data: FormData) => Promise<unknown>} options.submit
	 * @param {Array<{check(): boolean, focus(): void}>} [options.fields] fields validated before submitting
	 * @param {(error: unknown) => string} [options.explain] message for a failure
	 * @param {(busy: boolean) => void} [options.onbusy] reports the busy state (the React adapter renders from it)
	 * @param {{busy?: string, failure?: string}} [options.labels] `busy` replaces the submit label while working
	 */
	constructor(form, { submit, fields = [], explain = null, onsuccess = null, onbusy = null, labels = {} }) {
		this.#form = form;
		this.#fields = fields;
		this.#submit = submit;
		this.#explain = explain;
		this.#onbusy = onbusy;
		this.#labels = new Labels(defaults, labels);
		this.#problem = el('div', { class: 'bui-form-problem' });
		form.noValidate = true;
		form.append(this.#problem);
		this.#listeners.add(form, 'submit', event => this.#send(event, onsuccess));
		// What the form waits for, heard on every input and change: the given fields, else its own controls
		this.#required = new Required(form, { fields });
	}

	/** Whether a part still waits (`Required`): the given fields' `missing`, else the form's own controls and marked parts. */
	get missing() {
		return this.#required.missing;
	}

	/** Draws the submit buttons quiet while a part waits; a consumer that redraws them calls it again. */
	settle() {
		if (!this.#busy) this.#required.settle();
	}

	get busy() {
		return this.#busy;
	}

	/** The form element this behavior is attached to. */
	get form() {
		return this.#form;
	}

	/** Shows a failure message, or clears it with null. */
	set problem(message) {
		this.#problem.replaceChildren(...(message ? [callout({ tone: 'danger', title: message, live: true })] : []));
	}

	destroy() {
		this.#listeners.release();
		this.#problem.remove();
		this.#mark(false);
		this.#required.destroy();
	}

	async #send(event, onsuccess) {
		event.preventDefault();
		if (this.#busy) return;
		const invalid = this.#fields.filter(field => !field.check());
		if (invalid.length) {
			invalid[0].focus();
			return;
		}
		// Without Field objects the first part that needs something gets the caret: one that waits says
		// nothing (D183), a wrong control says the browser's own constraint message
		if (!this.#fields.length) {
			const waiting = this.#required.first;
			const wrong = this.#required.wrong;
			if (wrong && !(waiting && Required.before(waiting, wrong))) {
				wrong.reportValidity();
				return;
			}
		}
		if (this.#required.hold(event)) return;
		const data = new FormData(this.#form);
		const values = Object.fromEntries([...data].map(([key, value]) => [key, typeof value === 'string' ? value : value.name]));
		this.problem = null;
		this.#mark(true);
		try {
			const result = await this.#submit(values, data);
			onsuccess?.(result);
		} catch (error) {
			this.problem = this.#explain?.(error) ?? this.#labels.text('failure');
		} finally {
			this.#mark(false);
		}
	}

	#mark(busy) {
		const changed = this.#busy !== busy;
		this.#busy = busy;
		if (changed) this.#onbusy?.(busy);
		this.#form.setAttribute('aria-busy', String(busy));
		for (const button of this.#buttons()) {
			button.toggleAttribute('data-busy', busy);
			// The work frees only what it quieted: a button already quiet, by the product or `Required`, stays so
			if (busy && !button.hasAttribute('aria-disabled')) {
				button.setAttribute('aria-disabled', 'true');
				this.#held.add(button);
			} else if (!busy && this.#held.delete(button)) button.removeAttribute('aria-disabled');
			this.#swap(button, busy);
		}
		if (!busy) this.settle();
	}

	#buttons() {
		return this.#required.buttons;
	}


	// Replaces a submit button's text with the busy label while working, and restores it afterwards.
	// A package button keeps its structure: only its text span changes.
	#swap(button, busy) {
		const label = this.#labels.text('busy');
		if (label === 'busy' || button.tagName !== 'BUTTON') return;
		const target = button.classList.contains('bui-button') ? (button.querySelector(':scope > span:last-child') ?? button) : button;
		if (busy && !this.#saved.has(button)) {
			this.#saved.set(button, target.textContent);
			target.textContent = label;
		} else if (!busy && this.#saved.has(button)) {
			target.textContent = this.#saved.get(button);
			this.#saved.delete(button);
		}
	}
}
