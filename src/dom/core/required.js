import { Listeners } from './component.js';

const controls = 'input, select, textarea';
const reachable = 'input:not([type="hidden"]), select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])';
const submits = 'button[type="submit"], button:not([type]), input[type="submit"]';
// Node.DOCUMENT_POSITION_FOLLOWING, without reaching for a global the page may not define
const following = 4;

/**
 * What a form still waits for (0.32.0, D183): a step not yet taken, never a failure.
 *
 * A part waits while it is a required control with nothing in it (blanks, an unchecked required box, a
 * radio group or a choice with nothing chosen) that the browser validates, or while the product marks it
 * `data-missing`: a code not typed to its end, a choice made in a `Picker`, which holds no required
 * control of its own. Text the browser could not read as the control's kind (letters in a number) is
 * something written, so it is wrong, not missing. Given `fields`, it reads their `missing` instead.
 *
 * Over a form it keeps the submit buttons quiet while a part waits (`aria-disabled`, still reachable),
 * those outside the form that name it with `form` included; `hold(event)` stops a submission there,
 * putting the caret in the first part that waits and saying nothing. A busy button (`data-busy`) keeps
 * what its work draws. It hears the form's input and change until `destroy()`. `FocusedForm`, `prompt`
 * and React's `Form` are built on it, and a product's own form uses it as it is.
 */
export class Required {
	/** Whether a required control has nothing in it yet; a control the browser does not validate never waits. */
	static empty(control) {
		if (!control?.required || control.willValidate === false || control.validity?.badInput) return false;
		if (control.type === 'checkbox' || control.type === 'radio') return Boolean(control.validity?.valueMissing);
		return !String(control.value ?? '').trim();
	}

	#form;
	#fields;
	#listeners = new Listeners();

	/**
	 * @param {HTMLFormElement} form
	 * @param {{fields?: Array<{readonly missing?: boolean, focus(): void}>}} [options] fields that say themselves whether they wait
	 */
	constructor(form, { fields = [] } = {}) {
		this.#form = form;
		this.#fields = fields;
		this.#listeners.add(form, 'input', () => this.settle());
		this.#listeners.add(form, 'change', () => this.settle());
		this.settle();
	}

	/** The first part that waits, in the page's order (a field, or an element), or null. */
	get first() {
		if (this.#fields.length) return this.#fields.find(field => field.missing === true) ?? null;
		const marked = [...this.#form.querySelectorAll('[data-missing]')];
		const empty = [...this.#form.querySelectorAll(controls)].filter(control => Required.empty(control));
		return [...marked, ...empty].sort((a, b) => (a === b ? 0 : a.compareDocumentPosition(b) & following ? -1 : 1))[0] ?? null;
	}

	/** Whether a part still waits. */
	get missing() {
		return this.first !== null;
	}

	/** The form's submit buttons: its own, and those outside it that name it with `form` (a dialog's footer). */
	get buttons() {
		const own = [...this.#form.querySelectorAll(submits)];
		const root = this.#form.getRootNode?.() ?? this.#form.ownerDocument;
		const named = this.#form.id && root?.querySelectorAll ? [...root.querySelectorAll('button[form], input[form]')].filter(button => button.getAttribute('form') === this.#form.id && button.matches(submits)) : [];
		return [...new Set([...own, ...named])];
	}

	/** Draws the submit buttons quiet while a part waits, and as they were once none does. */
	settle() {
		const quiet = this.missing;
		for (const button of this.buttons) {
			if (button.hasAttribute('data-busy')) continue;
			if (quiet) button.setAttribute('aria-disabled', 'true');
			else button.removeAttribute('aria-disabled');
		}
	}

	/** Puts the caret in the first part that waits: a field, a control, or a marked part's chosen option or first control. */
	focus() {
		const first = this.first;
		if (!first) return false;
		if (first.nodeType !== 1 || first.matches(controls)) first.focus();
		else (first.querySelector('input:checked') ?? first.querySelector(reachable) ?? first).focus();
		return true;
	}

	/** Stops a submission while a part waits, the caret put there and nothing said; true when it stopped it. */
	hold(event) {
		if (!this.focus()) return false;
		event.preventDefault();
		return true;
	}

	/** Releases the form's listeners and leaves its buttons as they were. */
	destroy() {
		this.#listeners.release();
		for (const button of this.buttons) if (!button.hasAttribute('data-busy')) button.removeAttribute('aria-disabled');
	}
}
