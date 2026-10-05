import { el } from '../core/element.js';
import { Field } from '../field.js';

/**
 * The escape of a `RefChooser`: "Use a commit or another ref…" opens one field in place, under the
 * chooser, with Use and Cancel. Enter uses it, Escape cancels; the value is checked by Git's naming
 * rules (`OtherRef.check`) and by the product's own `validate`, and an error stays beside the field.
 */
export class OtherRef {
	#element;
	#field;
	#labels;
	#validate;
	#onuse;
	#oncancel;

	/**
	 * @param {object} options
	 * @param {import('../core/labels.js').Labels} options.labels the chooser's copy
	 * @param {((value: string) => string|null)|null} options.validate the product's rule, a message or null
	 * @param {(value: string) => void} options.onuse
	 * @param {() => void} options.oncancel
	 */
	constructor({ labels, validate, onuse, oncancel }) {
		this.#labels = labels;
		this.#validate = validate;
		this.#onuse = onuse;
		this.#oncancel = oncancel;
		this.#field = new Field({ label: labels.text('other'), hint: labels.text('hint'), autocomplete: 'off', validate: value => this.#check(value) });
		const control = this.#field.control;
		control.setAttribute('spellcheck', 'false');
		control.addEventListener('keydown', event => this.#keys(event));
		this.#element = el('div', { class: 'bui-refs-other', hidden: true }, [
			this.#field.element,
			el('div', { class: 'bui-refs-actions' }, [
				el('button', { type: 'button', class: 'bui-button bui-button-primary bui-button-small', onclick: () => this.use() }, [labels.text('use')]),
				el('button', { type: 'button', class: 'bui-button bui-button-quiet bui-button-small', onclick: () => this.cancel() }, [labels.text('cancel')])
			])
		]);
	}

	get element() {
		return this.#element;
	}

	get shown() {
		return !this.#element.hidden;
	}

	/** The field's input. */
	get control() {
		return this.#field.control;
	}

	/** Why Git cannot use `value` as a ref, as a key of the copy (`required`, `invalid`), or null. */
	static check(value) {
		const text = String(value ?? '').trim();
		if (!text) return 'required';
		// Git's ref rules (git check-ref-format), with a leading “-” refused as it would read as an option (0.7.4)
		if (/\s|\.\.|[~^:?*[\\]|@\{|^[/.-]|[/.]$|\/\.|\.lock(\/|$)|\/\/|^@$|[\x00-\x1f\x7f]/.test(text)) return 'invalid';
		return null;
	}

	/** Shows the field with `value` and moves focus into it. */
	show(value = '') {
		this.#element.hidden = false;
		this.#field.control.value = value;
		this.#field.error = null;
		this.#field.control.focus();
	}

	hide() {
		this.#element.hidden = true;
		this.#field.error = null;
	}

	/** Uses the value when it is valid; otherwise the error stays and focus stays in the field. */
	use() {
		if (!this.#field.check()) return this.#field.control.focus();
		const value = this.#field.control.value.trim();
		this.hide();
		this.#onuse(value);
	}

	cancel() {
		this.hide();
		this.#oncancel();
	}

	#check(value) {
		const problem = OtherRef.check(value);
		if (problem) return this.#labels.text(problem);
		return this.#validate?.(value.trim()) ?? null;
	}

	#keys(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			this.use();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			this.cancel();
		}
	}
}
