import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { Labels } from './core/labels.js';
import { Clipboard } from './core/clipboard.js';
import { Button } from './button.js';

const words = {
	en: { message: 'Copy message', command: 'Copy command', link: 'Copy link', copied: 'Copied', refused: 'Your browser didn’t let Beyond copy it. The text is selected: copy it with your keyboard.' },
	es: { message: 'Copiar mensaje', command: 'Copiar comando', link: 'Copiar enlace', copied: 'Copiado', refused: 'Tu navegador no dejó que Beyond lo copie. El texto está seleccionado: cópialo con el teclado.' }
};

/**
 * A prewritten text a person copies to send or run elsewhere (FR-5, design S2 2.5, shared piece 9):
 * a message for whoever can act ("Could you approve the Beyond app for acme on GitHub? …"), a link
 * for them, or a command with its values already filled.
 *
 * The text is read-only and shown whole (a message wraps; a command keeps its lines and scrolls in its
 * own box), with one action, "Copy message", "Copy link" or "Copy command" (`kind`), that says
 * "Copied" once it worked. The copy is bounded (`CopyMessage.bound`, D40): when the browser refuses or
 * does not answer, it says so in place and selects the text, so the keyboard can copy it.
 */
export class CopyMessage extends Component {
	/** The copy in English and Spanish. */
	static labels = Object.freeze({ en: Object.freeze(words.en), es: Object.freeze(words.es) });
	/** Milliseconds the clipboard may take before the copy counts as refused. */
	static bound = 5000;

	#element;
	#text;
	#value;
	#result;
	#button;
	#labels;

	/**
	 * @param {object} options
	 * @param {string} options.text what is copied, exactly as shown
	 * @param {'message'|'command'|'link'} [options.kind]
	 * @param {string|Node|null} [options.label] a line above the text ("Message for an owner of acme")
	 */
	constructor({ text, kind = 'message', label = null, labels = {} }) {
		super();
		this.#labels = new Labels(words.en, labels);
		this.#value = String(text ?? '');
		this.#text = kind === 'command' ? el('pre', { class: 'bui-copy-text bui-copy-command' }, [el('code', { text: this.#value })]) : el('p', { class: 'bui-copy-text', text: this.#value });
		this.#result = el('p', { class: 'bui-copy-result', role: 'status' });
		this.#button = new Button({ label: this.#labels.text(['command', 'link'].includes(kind) ? kind : 'message'), small: true, onclick: () => this.#button.run(() => this.copy()) });
		this.#element = el('div', { class: `bui-copy bui-copy-${kind}` }, [label ? el('p', { class: 'bui-copy-label' }, [content(label)]) : null, this.#text, el('div', { class: 'bui-copy-actions' }, [this.#button.element, this.#result])]);
	}

	get element() {
		return this.#element;
	}

	get text() {
		return this.#value;
	}

	/** Replaces the text, for example once a link is known. */
	set text(value) {
		this.#value = String(value ?? '');
		(this.#text.querySelector('code') ?? this.#text).textContent = this.#value;
		this.#result.textContent = '';
	}

	/** Copies the text. Resolves true when the clipboard took it; false after saying so and selecting the text. */
	async copy() {
		const copied = await Clipboard.write(this.#element.ownerDocument, this.#value, CopyMessage.bound);
		if (this.destroyed) return copied;
		this.#result.textContent = this.#labels.text(copied ? 'copied' : 'refused');
		this.#result.classList.toggle('bui-copy-refused', !copied);
		if (!copied) Clipboard.select(this.#text);
		return copied;
	}

	destroy() {
		this.#button.destroy();
		super.destroy();
	}
}
