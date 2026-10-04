import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { glyph } from './core/icons.js';
import { Ids } from './core/ids.js';
import { Labels } from './core/labels.js';
import { Suggestion } from './core/suggestion.js';

const defaults = { optional: '(optional)', invalid: 'Check this value.', suggested: 'Suggested' };
// The constraint-validation failures, in the order a message is chosen.
const failures = ['valueMissing', 'typeMismatch', 'patternMismatch', 'tooShort', 'tooLong', 'rangeUnderflow', 'rangeOverflow', 'stepMismatch', 'badInput', 'customError'];

/**
 * A labelled form field: label, hint, control and error, wired for assistive technology.
 *
 * The hint and the error describe the control (`aria-describedby`); an error also marks it
 * `aria-invalid`. `check()` validates with the browser's constraints and the optional `validate`
 * function and shows the consumer's message for the failure (`messages.valueMissing`, …), falling
 * back to the browser's own text. Once an error shows, the field rechecks as the person types, so
 * the message disappears as soon as the value is fixed.
 *
 * With `suggest` (0.7.0, D56), the field shows a value derived from context, marked "Suggested", and
 * follows each new `suggest` until the person edits it; an emptied field takes the suggestion back
 * when the person leaves it. `Field.labels` holds the copy in English and Spanish.
 */
export class Field extends Component {
	/** The copy in English and Spanish. */
	static labels = Object.freeze({
		en: Object.freeze({ ...defaults }),
		es: Object.freeze({ optional: '(opcional)', invalid: 'Revisa este valor.', suggested: 'Sugerido' })
	});

	#element;
	#suggestion = null;
	#mark = null;
	#control;
	#error;
	#hint;
	#labels;
	#messages;
	#validate;
	#shown = false;

	/**
	 * @param {object} options
	 * @param {string|Node} options.label
	 * @param {Element|{control: Element, element: Element}} [options.control] an existing control or component
	 * @param {string} [options.type] input type when no control is given; `textarea` for multiple lines
	 * @param {Record<string,string>} [options.messages] message per validity failure
	 * @param {(value: string) => string|null} [options.validate] custom rule returning a message or null
	 * @param {string|null} [options.suggest] a value derived from context, followed until the person edits it
	 */
	constructor({
		label,
		control = null,
		type = 'text',
		name = null,
		value = null,
		hint = null,
		error = null,
		required = false,
		optional = false,
		autocomplete = null,
		messages = {},
		validate = null,
		suggest = null,
		labels = {}
	}) {
		super();
		this.#labels = new Labels(defaults, labels);
		this.#messages = messages;
		this.#validate = validate;
		const holder = control && !control.nodeType ? control.element : control;
		this.#control = control ? (control.nodeType ? control : control.control) : this.#make({ type, name, value, required, autocomplete });
		const id = this.#control.id || Ids.next('bui-field');
		this.#control.id = id;
		this.#hint = hint ? el('p', { id: `${id}-hint`, class: 'bui-field-hint' }, [content(hint)]) : null;
		this.#error = el('p', { id: `${id}-error`, class: 'bui-field-error', hidden: true });
		this.#element = el('div', { class: 'bui-field' }, [
			el('label', { for: id, class: 'bui-field-label' }, [
				content(label),
				optional ? el('span', { class: 'bui-field-optional', text: ` ${this.#labels.text('optional')}` }) : null
			]),
			this.#hint,
			holder ?? this.#control,
			this.#error
		]);
		this.#control.addEventListener('input', () => this.#shown && this.check());
		this.#control.addEventListener('change', () => this.#shown && this.check());
		this.error = error;
		if (suggest !== null && suggest !== undefined) this.#follow(suggest, value);
	}

	/** Whether the person's own value stands over the suggestion. */
	get edited() {
		return this.#suggestion?.edited ?? false;
	}

	/** A new suggestion: shown while the person has not edited the field. */
	set suggest(value) {
		if (!this.#suggestion) return this.#follow(value, null);
		const shown = this.#suggestion.offer(value);
		if (shown !== null) this.#control.value = shown;
		this.#marked();
	}

	/** Follows the suggestion again, replacing the person's value. */
	follow() {
		if (!this.#suggestion) return;
		this.#control.value = this.#suggestion.follow();
		this.#marked();
	}

	#follow(suggest, value) {
		this.#suggestion = new Suggestion(suggest);
		this.#mark = el('span', { class: 'bui-field-suggested', text: this.#labels.text('suggested') });
		this.#element.querySelector('.bui-field-label').append(' ', this.#mark);
		if (value === null || value === undefined || value === '') this.#control.value = suggest ?? '';
		else this.#suggestion.typed(value);
		this.#control.addEventListener('input', () => {
			this.#suggestion.typed(this.#control.value);
			this.#marked();
		});
		this.#control.addEventListener('blur', () => {
			const back = this.#suggestion.left(this.#control.value);
			if (back !== null) this.#control.value = back;
			this.#marked();
		});
		this.#marked();
	}

	#marked() {
		this.#mark.hidden = !this.#suggestion.shown;
	}

	get element() {
		return this.#element;
	}

	get control() {
		return this.#control;
	}

	get value() {
		return this.#control.value;
	}

	get invalid() {
		return this.#shown;
	}

	/** Shows a message under the control, or clears it with `null`. */
	set error(message) {
		this.#shown = Boolean(message);
		this.#element.classList.toggle('bui-field-invalid', this.#shown);
		this.#error.hidden = !this.#shown;
		this.#error.replaceChildren(...(this.#shown ? [glyph('alert'), el('span', { text: message })] : []));
		if (this.#shown) this.#control.setAttribute('aria-invalid', 'true');
		else this.#control.removeAttribute('aria-invalid');
		const described = [this.#hint?.id, this.#shown ? this.#error.id : null].filter(Boolean).join(' ');
		if (described) this.#control.setAttribute('aria-describedby', described);
		else this.#control.removeAttribute('aria-describedby');
	}

	/** Validates the value; shows and returns whether it is valid. */
	check() {
		const custom = this.#validate?.(this.#control.value) ?? null;
		const validity = this.#control.validity;
		const failure = validity && !validity.valid ? failures.find(key => validity[key]) : null;
		const message = custom ?? (failure ? (this.#messages[failure] ?? (this.#control.validationMessage || this.#labels.text('invalid'))) : null);
		this.error = message;
		return !message;
	}

	/** Moves focus to the control. */
	focus() {
		this.#control.focus();
	}

	#make({ type, name, value, required, autocomplete }) {
		const props = { class: 'bui-input', name, required, autocomplete };
		if (type === 'textarea') return el('textarea', { ...props, class: 'bui-input bui-textarea', value });
		return el('input', { ...props, type, value });
	}
}
