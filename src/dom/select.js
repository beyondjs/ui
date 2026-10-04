import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { glyph } from './core/icons.js';
import { Cut, NameTip } from './core/cut.js';

/**
 * A native select for a short, finite list of choices, styled over the tokens.
 *
 * It keeps every native behavior (keyboard, touch pickers, form submission) and is meant for lists a
 * person can read at a glance; searchable or large entity collections use `Picker`. Wrap it in a
 * `Field` for its label: `new Field({ label, control: new Select({...}) })`.
 *
 * Options: `{ value, label, disabled? }`, or `{ group, options }` for an option group.
 *
 * A native select clips a chosen text wider than its box. Since 0.5.0 the whole text then shows in a
 * tooltip on hover and keyboard focus (D44), which a name that fits never shows; the platform's own
 * list shows every option whole, and the select's value is the whole text for assistive technology.
 * Fixed labels should fit: when they may not, use `ChoiceMenu`, which wraps.
 */
export class Select extends Component {
	#element;
	#control;
	#tip;

	constructor({ name = null, options, value = null, required = false, disabled = false, onchange = null, id = null }) {
		super();
		this.#control = el('select', { id, name, required, disabled, class: 'bui-select-control', onchange: () => onchange?.(this.value) }, options.map(option => this.#option(option)));
		if (value !== null) this.#control.value = value;
		this.#element = el('span', { class: 'bui-select' }, [this.#control, glyph('chevron')]);
		this.#tip = Select.tip(this.#control);
	}

	/**
	 * The tooltip of a select that shows its chosen text whole while it is cut, hidden from assistive
	 * technology (the select's value already says it). The React `Select` uses it too.
	 */
	static tip(control) {
		return new NameTip(control, { text: () => Cut.chosen(control), cut: () => Cut.select(control) });
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

	destroy() {
		this.#tip.destroy();
		super.destroy();
	}

	#option(option) {
		if (option.options) return el('optgroup', { label: option.group }, option.options.map(item => this.#option(item)));
		return el('option', { value: option.value, disabled: option.disabled }, [content(option.label)]);
	}
}
