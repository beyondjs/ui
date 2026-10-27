import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { Labels } from '../core/labels.js';
import { Cut, NameTip } from '../core/cut.js';
import { CopyButton } from '../copy-button.js';


/**
 * A value a person copies (0.15.0): an identifier, a path, a hash or an address, in the monospace face,
 * cut where its box ends (at its end, or in its middle so its last characters stay, `cut: 'middle'`) and
 * shown whole in a tooltip on hover and focus while cut, then one quiet Copy that says "Copied" in place
 * (`CopyButton`). With `href` the value is also a link that opens it. Identifiers belong here, not in
 * the page's sentences (D104).
 */
export class CopyValue extends Component {
	/** The copy in English and Spanish: `CopyButton`'s words and `name` ("Copy {label}"). */
	static labels = Object.freeze({ en: Object.freeze({ ...CopyButton.labels.en, name: 'Copy {label}' }), es: Object.freeze({ ...CopyButton.labels.es, name: 'Copiar {label}' }) });
	/** Characters kept whole at the end of a value cut in its middle. */
	static tail = 8;

	#element;
	#text;
	#tip;
	#button;
	#value = '';
	#cut;

	/**
	 * @param {object} options
	 * @param {string} options.value what is shown and copied
	 * @param {string|null} [options.label] what it is ("the request identifier"), in Copy's accessible name
	 * @param {string|null} [options.href] the value opens there
	 * @param {'end'|'middle'} [options.cut] where a long value is cut
	 */
	constructor({ value, label = null, href = null, cut = 'end', labels = {} }) {
		super();
		const words = new Labels(CopyValue.labels, labels);
		this.#cut = cut === 'middle' ? 'middle' : 'end';
		this.#text = el(href ? 'a' : 'span', { class: 'bui-copy-value-text', href, tabindex: href ? null : '0' });
		this.#button = new CopyButton({ text: () => this.#value, name: label ? words.text('name', { label }) : null, select: () => this.#text, labels });
		this.#element = el('span', { class: 'bui-copy-value' }, [this.#text, this.#button.element]);
		this.#tip = new NameTip(this.#text, { text: () => this.#value, cut: () => Cut.text(this.#text.firstElementChild ?? this.#text) });
		this.value = value;
	}

	get element() {
		return this.#element;
	}

	get value() {
		return this.#value;
	}

	set value(value) {
		this.#value = String(value ?? '');
		const keep = this.#cut === 'middle' && this.#value.length > CopyValue.tail * 2 ? CopyValue.tail : 0;
		const start = el('span', { class: 'bui-copy-value-start', text: keep ? this.#value.slice(0, -keep) : this.#value });
		this.#text.replaceChildren(start, keep ? el('span', { class: 'bui-copy-value-tail', text: this.#value.slice(-keep) }) : '');
		this.#text.setAttribute('aria-label', this.#value);
	}

	destroy() {
		this.#tip.destroy();
		this.#button.destroy();
		super.destroy();
	}
}
