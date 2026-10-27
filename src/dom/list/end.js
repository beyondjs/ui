import { el, content } from '../core/element.js';

const english = Object.freeze({ end: 'Nothing more', keys: '↑ ↓ to move · Enter to open' });
const spanish = Object.freeze({ end: 'No hay más', keys: '↑ ↓ para moverte · Enter para abrir' });

/**
 * A complete list's end line (0.39.0, the list rule L5), for a list a product draws itself in `ul.bui-rows`:
 * it says the list is whole, so a short list never reads as one still loading. `Collection`'s list draws the
 * same line on its last page. `keys` adds the keys that go through the list; give it only when its rows open
 * and the focus can move (two rows or more). Draw it after the list, never while more can still be read.
 */
export class EndLine {
	/** The copy in English and Spanish, the same words as `Collection.labels`' `end` and `keys`. */
	static labels = Object.freeze({ en: english, es: spanish });
	#element;

	/**
	 * @param {object} [options]
	 * @param {string|Node|null} [options.text] what the line says, else "Nothing more"
	 * @param {boolean} [options.keys] whether it says the keys that go through the list
	 * @param {{end?: string, keys?: string}} [options.labels] the copy, as `EndLine.labels.es`
	 */
	constructor({ text = null, keys = false, labels = {} } = {}) {
		const words = { ...english, ...labels };
		this.#element = el('p', { class: 'bui-rows-end' }, [el('span', {}, [content(text ?? words.end)]), keys ? el('span', { class: 'bui-keys bui-rows-keys', text: words.keys }) : null]);
	}

	get element() {
		return this.#element;
	}
}
