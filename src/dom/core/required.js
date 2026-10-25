import { Listeners } from './component.js';

const controls = 'input, select, textarea';
const reachable = 'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])';
const submits = 'button[type="submit"], button:not([type]), input[type="submit"]';
// Node.DOCUMENT_POSITION_FOLLOWING, without reaching for a global the page may not define
const following = 4;

/**
 * What a form still waits for (0.32.0, D183): a step not yet taken, never a failure.
 *
 * A part waits while it is a required control with nothing in it (blanks, but a password's spaces are
 * characters; an unchecked required box, a radio group or a choice with nothing chosen) that the browser validates, or while the product marks it
 * `data-missing`: a code not typed to its end, a choice made in a `Picker`, which holds no required
 * control of its own. Text the browser could not read as the control's kind (letters in a number) is
 * something written, so it is wrong, not missing. Given `fields`, it reads their `missing` in place of
 * the form's own controls, and the marked parts still. The controls are the form's as the browser lists
 * them: those outside it that name it with `form` included, those inside it that name another left out.
 *
 * Over a form it keeps the submit buttons quiet while a part waits (`aria-disabled`, still reachable),
 * those outside the form that name it with `form` included; `hold(event)` stops a submission there,
 * putting the caret in the first part that waits and saying nothing. It quiets and frees only what it
 * quieted itself: a button a product keeps quiet stays so, and a busy one (`data-busy`) keeps what its
 * work draws, as a package `Button` that waits for the product's own condition (`data-bui-waiting`,
 * 0.35.0) keeps its wait; once either ends, on a button inside the form or outside it that names it, the
 * form is read again. It hears the input and change of the form and of a control that names it, and
 * `Required.change` from a part whose value was written without a typed one; it reads the form again in
 * the next frame after its structure changes (a control added, swapped, required or disabled; a part
 * marked), until `destroy()`. `FocusedForm`, `prompt` and React's `Form` are built on it, and a
 * product's own form uses it as it is.
 */
export class Required {
	/** The event a marked part answers, with `preventDefault()`, when it puts the caret where it is given itself. */
	static ask = 'bui-focus';

	/** The event, bubbling, by which a part says what it holds changed without a typed value (`Required.tell`). */
	static change = 'bui-change';

	/** Whether a required control has nothing in it yet; a control the browser does not validate never waits. */
	static empty(control) {
		if (!control?.required || control.willValidate === false || control.validity?.badInput) return false;
		if (control.type === 'checkbox' || control.type === 'radio') return Boolean(control.validity?.valueMissing);
		// Every character of a password counts, a space too
		if (control.type === 'password') return !control.value;
		// A choice is the browser's to read: an option with an empty value that is not the placeholder is a choice
		if (control.tagName === 'SELECT' && control.validity) return Boolean(control.validity.valueMissing);
		return !String(control.value ?? '').trim();
	}

	/** Whether a control keeps a state of its own that no form frees: its work (`data-busy`) or a package `Button`'s own wait (`data-bui-waiting`, 0.35.0). */
	static held(control) {
		return control.hasAttribute('data-busy') || control.hasAttribute('data-bui-waiting');
	}

	/** Whether `a` comes before `b` in the page. */
	static before(a, b) {
		return Boolean(a.compareDocumentPosition(b) & following);
	}

	/** Says from `node`, bubbling, that what it holds changed without a typed value, so a form reads it again. */
	static tell(node) {
		const view = node?.ownerDocument?.defaultView;
		if (view?.CustomEvent) node.dispatchEvent(new view.CustomEvent(Required.change, { bubbles: true }));
	}

	#form;
	#fields;
	#quieted = new Set();
	#listeners = new Listeners();
	#observer = null;
	#frame = null;

	/**
	 * @param {HTMLFormElement} form
	 * @param {{fields?: Array<{readonly missing?: boolean, readonly element?: Element, focus(): void}>}} [options] fields that say themselves whether they wait
	 */
	constructor(form, { fields = [] } = {}) {
		this.#form = form;
		this.#fields = fields;
		// Heard from the form's root, so a control outside it that names it with `form` is heard too
		const root = form.getRootNode?.() ?? form.ownerDocument;
		for (const type of ['input', 'change', Required.change]) this.#listeners.add(root, type, event => this.#heard(event));
		// What waits may change with no event: a field swapped for a choice, a part marked, a control required or
		// disabled by a redraw the form did not make (a React child's). It is read again once in the next frame.
		const view = form.ownerDocument?.defaultView;
		if (view?.MutationObserver) {
			this.#observer = new view.MutationObserver(() => this.#later(view));
			// A button's own wait or work ending is read again too, so the form quiets it if a part still waits (0.35.0)
			this.#observer.observe(form, { subtree: true, childList: true, attributes: true, attributeFilter: ['required', 'data-missing', 'disabled', 'data-busy', 'data-bui-waiting'] });
		}
		this.settle();
	}

	/** The first part that waits, in the page's order (a field, or an element), or null. */
	get first() {
		const parts = [...this.#form.querySelectorAll('[data-missing]')].map(node => ({ node, part: node }));
		if (this.#fields.length) parts.push(...this.#fields.filter(field => field.missing === true).map(field => ({ node: field.element ?? null, part: field })));
		else parts.push(...this.#controls().filter(control => Required.empty(control)).map(node => ({ node, part: node })));
		const placed = parts.filter(entry => entry.node).sort((a, b) => (a.node === b.node ? 0 : Required.before(a.node, b.node) ? -1 : 1));
		return (placed[0] ?? parts[0])?.part ?? null;
	}

	/** Whether a part still waits. */
	get missing() {
		return this.first !== null;
	}

	/** The first control that holds something wrong, failing its own constraints rather than waiting, or null. */
	get wrong() {
		return this.#controls().find(control => control.willValidate !== false && control.validity && !control.validity.valid && !Required.empty(control)) ?? null;
	}

	/** The first control holding text the browser could not read as its kind (letters in a number, a date typed half), or null. */
	get unread() {
		return this.#controls().find(control => control.willValidate !== false && control.validity?.badInput) ?? null;
	}

	/** The form's submit buttons: its own, and those outside it that name it with `form` (a dialog's footer). */
	get buttons() {
		const own = [...this.#form.querySelectorAll(submits)].filter(button => !button.form || button.form === this.#form);
		const root = this.#form.getRootNode?.() ?? this.#form.ownerDocument;
		const named = this.#form.id && root?.querySelectorAll ? [...root.querySelectorAll('button[form], input[form]')].filter(button => button.getAttribute('form') === this.#form.id && button.matches(submits)) : [];
		return [...new Set([...own, ...named])];
	}

	/** Draws the submit buttons quiet while a part waits, and frees those it quieted once none does. */
	settle() {
		const quiet = this.missing;
		for (const button of this.buttons) {
			// One outside the form that names it is heard too: its own wait or work ending is read again (0.35.0)
			if (this.#observer && !this.#form.contains(button)) this.#observer.observe(button, { attributes: true, attributeFilter: ['data-busy', 'data-bui-waiting'] });
			if (Required.held(button)) continue;
			if (quiet && !button.hasAttribute('aria-disabled')) {
				button.setAttribute('aria-disabled', 'true');
				this.#quieted.add(button);
			} else if (!quiet && this.#quieted.delete(button)) button.removeAttribute('aria-disabled');
		}
	}

	/**
	 * Puts the caret in the first part that waits: a field, a control, or a marked part. A marked part that
	 * knows where its caret goes answers `Required.ask` (a cancelable `bui-focus` event) and puts it there,
	 * as `SecretField` opens its fold; else the control inside it that says it takes the caret
	 * (`data-bui-caret`, a `Picker`'s search), its chosen option or its first control that can take it does.
	 */
	focus() {
		const first = this.first;
		if (!first) return false;
		if (first.nodeType !== 1 || first.matches(controls)) first.focus();
		else if (first.dispatchEvent(new first.ownerDocument.defaultView.CustomEvent(Required.ask, { cancelable: true }))) (first.querySelector('[data-bui-caret]:not(:disabled)') ?? first.querySelector('input:checked:not(:disabled)') ?? first.querySelector(reachable) ?? first).focus();
		return true;
	}

	/**
	 * Stops a submission while a part waits, the caret put there and nothing said; true when it stopped it.
	 * Text the browser could not read stops it too, whichever comes first: the product reads its value as
	 * empty and could send nothing for it, so the browser says its own message (`reportValidity()`).
	 */
	hold(event) {
		const unread = this.unread;
		const first = this.first;
		if (unread && !(first?.nodeType === 1 && Required.before(first, unread))) {
			event.preventDefault();
			if (unread.reportValidity) unread.reportValidity();
			else unread.focus();
			return true;
		}
		if (!this.focus()) return false;
		event.preventDefault();
		return true;
	}

	/**
	 * Says the browser's own message for a wrong value (0.35.0): when the first part that needs something
	 * is a control failing its own constraints (a type, a pattern, a range, a product's custom validity),
	 * it stops the submission and reports that control (`reportValidity()`), which takes the focus; true
	 * when it did. A part that waits before it is left to `hold`, which says nothing. `FocusedForm` without
	 * fields and React's `Form` with `report` use it.
	 */
	report(event) {
		const wrong = this.wrong;
		const first = this.first;
		const waiting = first?.nodeType === 1 ? first : (first?.element ?? null);
		if (!wrong || (waiting && Required.before(waiting, wrong))) return false;
		event.preventDefault();
		wrong.reportValidity();
		return true;
	}

	/** Releases the form's listeners and frees the buttons it quieted. */
	destroy() {
		this.#listeners.release();
		this.#observer?.disconnect();
		if (this.#frame !== null) this.#form.ownerDocument?.defaultView?.cancelAnimationFrame?.(this.#frame);
		this.#frame = null;
		for (const button of this.#quieted) if (!Required.held(button)) button.removeAttribute('aria-disabled');
		this.#quieted.clear();
	}

	/** Reads what waits again when a change comes from the form or from a control that names it. */
	#heard(event) {
		const target = event.target;
		if (this.#form.contains(target) || target?.form === this.#form || target?.getAttribute?.('form') === this.#form.id) this.settle();
	}

	/** Reads what waits again in the next frame, once however many changes arrive. */
	#later(view) {
		if (this.#frame !== null || !view.requestAnimationFrame) return;
		this.#frame = view.requestAnimationFrame(() => {
			this.#frame = null;
			this.settle();
		});
	}

	/** The form's controls as the browser lists them, those outside it that name it with `form` included. */
	#controls() {
		// A control that names another form is that form's, wherever it stands (a page some engines list it in)
		return [...this.#form.elements].filter(control => control.matches?.(controls) && (control.getAttribute('form') ?? this.#form.id) === this.#form.id);
	}
}
