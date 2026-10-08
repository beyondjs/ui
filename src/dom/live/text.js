import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { Labels } from '../core/labels.js';
import { Frame } from './frame.js';

const words = {
	en: { live: 'Writing…', abandoned: 'Unfinished · not kept' },
	es: { live: 'Escribiendo…', abandoned: 'Sin terminar · no se guardó' }
};

// Blocks a live mark may sit at the end of: anything else (code, tables, images) keeps it after the text.
const blocks = new Set(['P', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DL', 'DD', 'SECTION']);

/**
 * Text that arrives in pieces, such as an agent's answer while it is written: shown as it grows,
 * marked live, then replaced by the final text, or left as a draft that was never completed.
 *
 * `append(piece)` adds to the end and `set(text)` replaces the whole text (a snapshot); either draws at
 * most once per animation frame, through the product's `render(text)` (a Node or a string, such as a
 * Markdown renderer that builds text nodes) or as plain text with its line breaks. A hidden tab draws
 * nothing until it is shown again, then draws the latest text once. The text is bounded (`bound`
 * characters; past it the pieces are not kept and `truncated` is true).
 *
 * While live it is `aria-busy` and ends with a live mark: a word for assistive technology ("Writing…")
 * and a mark that pulses, still under reduced motion. Nothing is announced per piece: the page's one
 * live region says that work started or ended. `settle(text)` draws the final text at once and
 * removes the mark; `abandon(note)` stops it with the text so far and a note ("Unfinished · not
 * kept"). After either, further pieces are ignored.
 */
export class LiveText extends Component {
	/** The copy in English and Spanish. */
	static labels = Object.freeze({ en: Object.freeze(words.en), es: Object.freeze(words.es) });
	/** The characters a live text keeps by default. */
	static bound = 64_000;

	#element;
	#body;
	#mark;
	#note = null;
	#labels;
	#render;
	#bound;
	#text = '';
	#state = 'live';
	#truncated = false;
	#frame;

	/**
	 * @param {object} [options]
	 * @param {string} [options.text] the text so far
	 * @param {((text: string) => Node|string|null)|null} [options.render] draws the text; plain text without it
	 * @param {number} [options.bound] the characters kept while live
	 * @param {{live?: string, abandoned?: string}} [options.labels]
	 */
	constructor({ text = '', render = null, bound = LiveText.bound, labels = {} } = {}) {
		super();
		this.#labels = new Labels(words.en, labels);
		this.#render = typeof render === 'function' ? render : null;
		this.#bound = Number.isFinite(bound) && bound > 0 ? bound : LiveText.bound;
		this.#body = el('div', { class: 'bui-live-body' });
		this.#mark = el('span', { class: 'bui-live-mark' }, [el('span', { class: 'bui-hidden', text: ` ${this.#labels.text('live')}` })]);
		this.#element = el('div', { class: 'bui-live', 'data-state': 'live', 'aria-busy': 'true' }, [this.#body]);
		this.#frame = new Frame(() => this.#draw());
		this.#keep(String(text ?? ''));
		this.#draw();
	}

	get element() {
		return this.#element;
	}

	/** The text as it stands: the pieces so far, or the final text. */
	get text() {
		return this.#text;
	}

	/** `live`, `settled` or `abandoned`. */
	get state() {
		return this.#state;
	}

	/** Whether pieces past the bound were dropped. */
	get truncated() {
		return this.#truncated;
	}

	/** Adds a piece at the end; drawn with the next frame. Ignored once settled or abandoned. */
	append(piece) {
		if (this.#state !== 'live' || piece === null || piece === undefined || piece === '') return;
		this.#keep(this.#text + String(piece));
		this.#frame.request();
	}

	/** Replaces the whole text (a snapshot of the draft); drawn with the next frame. */
	set(text) {
		if (this.#state !== 'live') return;
		this.#keep(String(text ?? ''));
		this.#frame.request();
	}

	/** The final text, drawn at once without the live mark; the text so far when none is given. */
	settle(text = this.#text) {
		if (this.#state === 'settled' || this.destroyed) return;
		this.#text = String(text ?? '');
		this.#end('settled', null);
	}

	/** Stops with the text so far, marked with `note` ("Unfinished · not kept" by default). */
	abandon(note = null) {
		if (this.#state !== 'live' || this.destroyed) return;
		this.#end('abandoned', note ?? this.#labels.text('abandoned'));
	}

	destroy() {
		this.#frame.cancel();
		super.destroy();
	}

	#keep(text) {
		this.#truncated = this.#truncated || text.length > this.#bound;
		this.#text = text.length > this.#bound ? text.slice(0, this.#bound) : text;
	}

	#end(state, note) {
		this.#frame.cancel();
		this.#state = state;
		this.#element.dataset.state = state;
		this.#element.removeAttribute('aria-busy');
		this.#draw();
		this.#note?.remove();
		this.#note = note ? el('p', { class: 'bui-live-note', text: note }) : null;
		if (this.#note) this.#element.append(this.#note);
	}

	/** Draws the text through the product's renderer (plain text if it fails) and places the live mark. */
	#draw() {
		if (this.destroyed) return;
		this.#mark.remove();
		const node = this.#node();
		if (this.#body.firstChild !== node || this.#body.lastChild !== node) this.#body.replaceChildren(node);
		// Plain text keeps its line breaks and stops at the reading measure
		this.#body.toggleAttribute('data-plain', node.nodeType === 3);
		if (this.#state === 'live') this.#place();
	}

	/** The node that shows the text now: the renderer's, or the one plain text node, written in place. */
	#node() {
		let drawn = this.#text;
		if (this.#render) {
			try {
				drawn = this.#render(this.#text);
			} catch (error) {
				globalThis.reportError?.(error);
			}
		}
		if (drawn?.nodeType) return drawn;
		const text = String(drawn ?? '');
		const plain = this.#body.firstChild?.nodeType === 3 ? this.#body.firstChild : document.createTextNode('');
		if (plain.data !== text) plain.data = text;
		return plain;
	}

	/**
	 * The mark goes at the end of the last paragraph or list item, or after the text when it ends
	 * otherwise; a product's own slot (`data-bui-slot`, the React adapter's) is never entered.
	 */
	#place() {
		let target = this.#body;
		while (target.lastChild?.nodeType === 1 && blocks.has(target.lastChild.tagName) && !target.lastChild.hasAttribute('data-bui-slot')) target = target.lastChild;
		target.append(this.#mark);
	}
}
