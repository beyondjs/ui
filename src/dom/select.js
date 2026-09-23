import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { icon } from './core/icons.js';

/**
 * A native select for a short, finite list of choices, styled over the tokens.
 *
 * It keeps every native behavior (keyboard, touch pickers, form submission) and is meant for lists a
 * person can read at a glance; searchable or large entity collections use `Picker`. Wrap it in a
 * `Field` for its label: `new Field({ label, control: new Select({...}) })`.
 *
 * Options: `{ value, label, disabled? }`, or `{ group, options }` for an option group.
 */
export class Select extends Component {
	#element;
	#control;

	constructor({ name = null, options, value = null, required = false, disabled = false, onchange = null, id = null }) {
		super();
		this.#control = el('select', { id, name, required, disabled, class: 'bui-select-control', onchange: () => onchange?.(this.value) }, options.map(option => this.#option(option)));
		if (value !== null) this.#control.value = value;
		this.#element = el('span', { class: 'bui-select' }, [this.#control, icon('chevron')]);
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

	set value(value) {
		this.#control.value = value;
	}

	#option(option) {
		if (option.options) return el('optgroup', { label: option.group }, option.options.map(item => this.#option(item)));
		return el('option', { value: option.value, disabled: option.disabled }, [content(option.label)]);
	}
}
