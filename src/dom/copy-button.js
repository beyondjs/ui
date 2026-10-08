import { Component } from './core/component.js';
import { el } from './core/element.js';
import { glyph } from './core/icons.js';
import { Labels } from './core/labels.js';
import { Clipboard } from './core/clipboard.js';
import { Button } from './button.js';

const words = {
	en: { copy: 'Copy', copied: 'Copied', refused: 'Not copied', said: 'Copied', why: 'Your browser didn’t let Beyond copy it.', selected: 'Your browser didn’t let Beyond copy it. The text is selected: copy it with your keyboard.' },
	es: { copy: 'Copiar', copied: 'Copiado', refused: 'No copiado', said: 'Copiado', why: 'Tu navegador no dejó que Beyond lo copie.', selected: 'Tu navegador no dejó que Beyond lo copie. El texto está seleccionado: cópialo con el teclado.' }
};

/**
 * One action that copies a text and confirms it in place (0.11.2): the button itself says "Copied" with
 * the `check` glyph for `CopyButton.hold` milliseconds, and a polite region says it once, so no toast
 * covers the page and nothing has to be closed. A copy the browser refuses or does not answer within
 * `CopyButton.bound` (D40) says "Not copied" on the button and why in the same region; when the text is
 * shown somewhere (`select`), that text is selected so the keyboard copies it.
 *
 * The text is read when the button is pressed (`text` may be a function), so a link or a path that
 * changes needs no update. While the clipboard answers, the button is busy and ignores presses.
 */
export class CopyButton extends Component {
	/** The copy in English and Spanish. */
	static labels = Object.freeze({ en: Object.freeze(words.en), es: Object.freeze(words.es) });
	/** Milliseconds the clipboard may take before the copy counts as refused. */
	static bound = 5000;
	/** Milliseconds the button says the result before it says its action again. */
	static hold = 2000;

	#element;
	#button;
	#region = el('span', { class: 'bui-hidden', role: 'status' });
	#labels;
	#text;
	#label;
	#name;
	#select;
	#cancel = null;
	#result = null;

	/**
	 * @param {object} options
	 * @param {string|(() => string)} options.text what is copied, read at each press
	 * @param {string|null} [options.label] the button's words ("Copy", "Copy link", "Copy path")
	 * @param {string|null} [options.name] its accessible name when the words are not enough ("Copy the path src/app.js")
	 * @param {(() => Node|null)|null} [options.select] the node that shows the text, selected when the copy is refused
	 * @param {'primary'|'secondary'|'quiet'} [options.variant] the button's variant (quiet by default)
	 * @param {boolean} [options.small] the small button (true by default)
	 * @param {(copied: boolean) => void} [options.onresult] the copy's outcome
	 */
	constructor({ text, label = null, name = null, select = null, variant = 'quiet', small = true, onresult = null, labels = {} }) {
		super();
		this.#labels = new Labels(words.en, labels);
		this.#text = text;
		this.#label = label ?? this.#labels.text('copy');
		this.#name = name;
		this.#select = select;
		this.#button = new Button({ label: this.#label, name, variant, small, glyph: null, onclick: () => this.#button.run(() => this.copy().then(copied => onresult?.(copied))) });
		this.#element = el('span', { class: 'bui-copy-button' }, [this.#button.element, this.#region]);
	}

	get element() {
		return this.#element;
	}

	/** The button, for focus and measurement. */
	get button() {
		return this.#button.element;
	}

	/** `'copied'` or `'refused'` while the button says it, else null. */
	get result() {
		return this.#result;
	}

	/** The text to copy, or a function that returns it at each press. */
	set text(value) {
		this.#text = value;
	}

	/** Copies the text. Resolves true when the clipboard took it, false after saying why. */
	async copy() {
		const value = typeof this.#text === 'function' ? this.#text() : this.#text;
		const copied = await Clipboard.write(this.#element.ownerDocument, String(value ?? ''), CopyButton.bound);
		if (this.destroyed) return copied;
		const shown = copied ? null : (this.#select?.() ?? null);
		if (shown) Clipboard.select(shown);
		this.#show(copied ? 'copied' : 'refused');
		this.#region.textContent = '';
		// A region says what changes in it: emptied, then written, so the same words twice are said twice
		this.later(() => (this.#region.textContent = this.#labels.text(copied ? 'said' : shown ? 'selected' : 'why')), 30);
		return copied;
	}

	destroy() {
		this.#cancel?.();
		this.#button.destroy();
		super.destroy();
	}

	#show(result) {
		this.#cancel?.();
		this.#result = result;
		this.#element.dataset.result = result;
		const words = this.#labels.text(result === 'copied' ? 'copied' : 'refused');
		this.#button.label = el('span', { class: 'bui-copy-button-said' }, [result === 'copied' ? glyph('check') : null, words]);
		if (this.#name) this.#button.element.setAttribute('aria-label', words);
		this.#cancel = this.later(() => this.#reset(), CopyButton.hold);
	}

	#reset() {
		this.#cancel = null;
		this.#result = null;
		delete this.#element.dataset.result;
		this.#button.label = this.#label;
		if (this.#name) this.#button.element.setAttribute('aria-label', this.#name);
	}
}
