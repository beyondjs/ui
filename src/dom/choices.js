import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { icon } from './core/icons.js';
import { Ids } from './core/ids.js';

/**
 * A group of checkboxes or radio buttons in a fieldset with its legend, hint and error.
 *
 * Radio groups keep the browser's own arrow-key behavior. `value` is an array of the checked values
 * for checkboxes and the checked value (or null) for radios. Options may be disabled with a reason,
 * which stays visible next to the option.
 */
export class Choices extends Component {
	#element;
	#inputs = [];
	#type;
	#error;
	#hint;
	#onchange;

	/**
	 * @param {object} options
	 * @param {string|Node} options.legend
	 * @param {'checkbox'|'radio'} [options.type]
	 * @param {Array<{value: string, label: string|Node, hint?: string, disabled?: boolean, reason?: string}>} options.options
	 * @param {string|string[]} [options.value]
	 */
	constructor({ legend, type = 'checkbox', name = null, options, value = null, hint = null, error = null, required = false, onchange = null }) {
		super();
		this.#type = type;
		this.#onchange = onchange;
		const id = Ids.next('bui-choices');
		const group = name ?? id;
		const chosen = new Set([].concat(value ?? []));
		this.#hint = hint ? el('p', { id: `${id}-hint`, class: 'bui-field-hint' }, [content(hint)]) : null;
		this.#error = el('p', { id: `${id}-error`, class: 'bui-field-error', hidden: true });
		const rows = options.map((option, index) => {
			const control = `${id}-${index}`;
			const note = option.hint || option.reason ? `${control}-note` : null;
			const input = el('input', {
				id: control,
				type,
				name: group,
				value: option.value,
				checked: chosen.has(option.value),
				disabled: option.disabled,
				required: required && type === 'radio',
				'aria-describedby': note,
				onchange: () => this.#onchange?.(this.value)
			});
			this.#inputs.push(input);
			return el('div', { class: `bui-choice${option.disabled ? ' bui-choice-disabled' : ''}` }, [
				input,
				el('label', { for: control }, [content(option.label)]),
				note ? el('p', { id: note, class: 'bui-choice-note', text: option.reason ?? option.hint }) : null
			]);
		});
		this.#element = el('fieldset', { class: `bui-choices bui-choices-${type}`, 'aria-describedby': this.#hint?.id }, [
			el('legend', { class: 'bui-field-label' }, [content(legend)]),
			this.#hint,
			el('div', { class: 'bui-choices-list' }, rows),
			this.#error
		]);
		this.error = error;
	}

	get element() {
		return this.#element;
	}

	get value() {
		const checked = this.#inputs.filter(input => input.checked).map(input => input.value);
		return this.#type === 'radio' ? (checked[0] ?? null) : checked;
	}

	set value(value) {
		const chosen = new Set([].concat(value ?? []));
		for (const input of this.#inputs) input.checked = chosen.has(input.value);
	}

	set error(message) {
		this.#element.classList.toggle('bui-field-invalid', Boolean(message));
		this.#error.hidden = !message;
		this.#error.replaceChildren(...(message ? [icon('alert'), el('span', { text: message })] : []));
		const described = [this.#hint?.id, message ? this.#error.id : null].filter(Boolean).join(' ');
		if (described) this.#element.setAttribute('aria-describedby', described);
		else this.#element.removeAttribute('aria-describedby');
	}

	focus() {
		(this.#inputs.find(input => input.checked && !input.disabled) ?? this.#inputs.find(input => !input.disabled))?.focus();
	}
}
