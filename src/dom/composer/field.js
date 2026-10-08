import { el } from '../core/element.js';

/**
 * A composer's text field: a textarea of one line when empty that grows with its text up to `max`
 * lines and then scrolls (`min` and `max` in lines, 1 and 12 by default). Its accessible name is
 * `label`; it shows no label of its own. Growth is immediate, never animated.
 *
 * The placeholder stays the textarea's own (assistive technology reads it) but is drawn by a line laid
 * over the empty field, so a long one ends with an ellipsis on one line: no engine cuts a textarea's
 * placeholder that way, and Firefox would count its wrapped lines in the field's height.
 */
export class ComposerField {
	#element;
	#control;
	#shown = el('span', { class: 'bui-composer-placeholder', 'aria-hidden': 'true' });

	/**
	 * @param {object} options
	 * @param {string} options.label the accessible name ("Message to Claude Code")
	 * @param {string|null} [options.placeholder]
	 * @param {string} [options.value]
	 * @param {number} [options.min] lines when empty
	 * @param {number} [options.max] lines before it scrolls
	 * @param {string|null} [options.name] the form name, when a form submits it
	 */
	constructor({ label, placeholder = null, value = '', min = 1, max = 12, name = null }) {
		if (typeof label !== 'string' || !label.trim()) throw new TypeError('A composer is named by its label');
		const lines = (count, fallback) => (Number.isFinite(count) && count >= 1 ? Math.round(count) : fallback);
		const low = lines(min, 1);
		this.#control = el('textarea', { class: 'bui-composer-field', rows: String(low), 'aria-label': label, placeholder, name, autocomplete: 'off' });
		this.#control.style.setProperty('--bui-composer-min', String(low));
		this.#control.style.setProperty('--bui-composer-max', String(Math.max(low, lines(max, 12))));
		this.#control.value = String(value ?? '');
		this.#control.addEventListener('input', () => this.fit());
		this.#shown.textContent = placeholder ?? '';
		this.#element = el('div', { class: 'bui-composer-input' }, [this.#control, this.#shown]);
	}

	/** The field with its placeholder line. */
	get element() {
		return this.#element;
	}

	get control() {
		return this.#control;
	}

	get value() {
		return this.#control.value;
	}

	/** Replaces the text (the caret goes to its end) and fits the height. */
	set value(text) {
		const value = String(text ?? '');
		if (this.#control.value === value) return;
		this.#control.value = value;
		this.fit();
	}

	set placeholder(text) {
		if (text) this.#control.setAttribute('placeholder', text);
		else this.#control.removeAttribute('placeholder');
		this.#shown.textContent = text ?? '';
	}

	/**
	 * Fits the height to the text, between the first and the last line the stylesheet allows. An empty
	 * field keeps its first lines: Firefox counts a wrapped placeholder in the height of an empty field.
	 */
	fit() {
		const control = this.#control;
		control.style.height = '';
		if (!control.isConnected || !control.value) return;
		control.style.height = 'auto';
		if (control.scrollHeight > 0) control.style.height = `${control.scrollHeight}px`;
	}
}
