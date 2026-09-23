import { Component } from './core/component.js';
import { el, fill, content } from './core/element.js';
import { icon } from './core/icons.js';
import { Labels } from './core/labels.js';

const defaults = { busy: '{label}…' };

/**
 * A button, or a link styled as one when `href` is given.
 *
 * Variants: `primary`, `secondary`, `quiet` and `danger`. While busy the button keeps focus and its
 * place but ignores presses (`aria-disabled`), shows a spinner and says it is working, so a double
 * press can never send an action twice; `run()` wraps an asynchronous action in that state.
 */
export class Button extends Component {
	#element;
	#label;
	#glyph;
	#labels;
	#busy = false;
	#disabled;

	/**
	 * @param {object} options
	 * @param {string|Node} options.label visible label
	 * @param {'primary'|'secondary'|'quiet'|'danger'} [options.variant]
	 * @param {string} [options.glyph] icon name from the package catalog
	 * @param {string} [options.href] renders a link styled as a button
	 * @param {(event: Event) => void} [options.onclick]
	 * @param {string} [options.name] accessible name when it differs from the label
	 */
	constructor({
		label,
		variant = 'secondary',
		glyph = null,
		href = null,
		onclick = null,
		disabled = false,
		busy = false,
		type = 'button',
		small = false,
		name = null,
		describedby = null,
		labels = {}
	}) {
		super();
		this.#label = label;
		this.#glyph = glyph;
		this.#disabled = disabled;
		this.#labels = new Labels(defaults, labels);
		const props = {
			class: `bui-button bui-button-${variant}${small ? ' bui-button-small' : ''}`,
			'aria-label': name,
			'aria-describedby': describedby
		};
		this.#element =
			href && !disabled
				? el('a', { ...props, href })
				: el('button', { ...props, type, disabled, onclick: event => this.#press(event, onclick) });
		if (href && !disabled && onclick) this.#element.addEventListener('click', onclick);
		this.busy = busy;
	}

	get element() {
		return this.#element;
	}

	get busy() {
		return this.#busy;
	}

	set busy(value) {
		this.#busy = Boolean(value);
		if (this.#busy) this.#element.setAttribute('aria-disabled', 'true');
		else this.#element.removeAttribute('aria-disabled');
		this.#element.toggleAttribute('data-busy', this.#busy);
		this.#render();
	}

	get disabled() {
		return this.#disabled;
	}

	set disabled(value) {
		this.#disabled = Boolean(value);
		if (this.#element.tagName === 'BUTTON') this.#element.disabled = this.#disabled;
	}

	set label(value) {
		this.#label = value;
		this.#render();
	}

	/** Runs an asynchronous action while busy; presses during it are ignored. Rethrows its failure. */
	async run(work) {
		if (this.#busy) return undefined;
		this.busy = true;
		try {
			return await work();
		} finally {
			if (!this.destroyed) this.busy = false;
		}
	}

	#press(event, handler) {
		if (this.#busy) {
			event.preventDefault();
			event.stopImmediatePropagation();
			return;
		}
		handler?.(event);
	}

	#render() {
		const text = this.#busy && typeof this.#label === 'string' ? this.#labels.text('busy', { label: this.#label }) : this.#label;
		fill(this.#element, [
			this.#busy ? el('span', { class: 'bui-spinner', 'aria-hidden': 'true' }) : this.#glyph ? icon(this.#glyph) : null,
			el('span', {}, [content(text)])
		]);
	}
}
