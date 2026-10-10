import { el, content } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Clipboard } from '../core/clipboard.js';
import { Highlighter } from '../code/highlighter.js';

/**
 * One section of an opened activity row, from a record the product gives: `{ label, text, code?,
 * lines?, copy?, language? }` draws its label ("Input", "Output", "Diff") above the text, in a code box
 * by default (`code: false` for a sentence), or `{ label, content }` above the product's own node. A code
 * box whose `language` the `Highlighter` reads is colored (0.14.0), folded or whole; without one, or with
 * one it does not read, the text is shown as written.
 *
 * Code longer than `lines` (12) shows its first lines with "Show all {count} lines" (`aria-expanded`),
 * which shows the rest and then "Show fewer lines". "Copy" copies the whole text under a bound (D40)
 * and says "Copied", or that the browser refused, with the text selected for the keyboard.
 */
export class ActivitySection {
	/** Milliseconds the clipboard may take before a copy counts as refused. */
	static bound = 5000;

	#element;
	#text;
	#code = null;
	#fold = null;
	#result = null;
	#lines;
	#labels;
	#all = false;
	#highlighter = null;

	/**
	 * @param {{label?: string|Node|null, text?: string, content?: Node|null, code?: boolean, lines?: number, copy?: boolean, language?: string|null}} record
	 * @param {import('../core/labels.js').Labels} labels the row's copy
	 */
	constructor({ label = null, text = '', content: node = null, code = true, lines = 12, copy = true, language = null }, labels) {
		this.#labels = labels;
		this.#text = String(text ?? '');
		this.#lines = Number.isFinite(lines) && lines > 0 ? lines : 12;
		const id = Ids.next('bui-activity-label');
		const heading = label ? el('p', { id, class: 'bui-activity-label' }, [content(label)]) : null;
		let shown = null;
		if (node) shown = node.element ?? node;
		else if (code) {
			const highlighter = new Highlighter(language);
			this.#highlighter = highlighter.language ? highlighter : null;
			this.#code = el('code', { 'data-language': highlighter.language });
			shown = el('pre', { class: 'bui-activity-code' }, [this.#code]);
		} else shown = el('p', { class: 'bui-activity-note', text: this.#text });
		const actions = this.#code ? this.#actions(copy, shown) : null;
		this.#element = el('div', { class: 'bui-activity-section', role: 'group', 'aria-labelledby': heading ? id : null }, [heading, shown, actions]);
		if (this.#code) this.#show();
	}

	get element() {
		return this.#element;
	}

	/** How many lines the text has. */
	get count() {
		return this.#text.split('\n').length;
	}

	/** Shows every line, or the first ones again. */
	unfold(value = !this.#all) {
		this.#all = Boolean(value);
		this.#show();
	}

	/** Copies the whole text. Resolves true when the clipboard took it. */
	async copy() {
		const copied = await Clipboard.write(this.#element.ownerDocument, this.#text, ActivitySection.bound);
		if (!this.#result) return copied;
		this.#result.textContent = this.#labels.text(copied ? 'copied' : 'refused');
		if (!copied) {
			this.unfold(true);
			Clipboard.select(this.#code);
		}
		return copied;
	}

	#actions(copy, box) {
		const folded = this.count > this.#lines;
		this.#fold = folded ? el('button', { type: 'button', class: 'bui-link-button', 'aria-expanded': 'false', 'aria-controls': (box.id = Ids.next('bui-activity-code')), onclick: () => this.unfold() }) : null;
		this.#result = el('span', { class: 'bui-activity-result', role: 'status' });
		const copier = copy ? el('button', { type: 'button', class: 'bui-link-button', text: this.#labels.text('copy'), onclick: () => this.copy() }) : null;
		if (!this.#fold && !copier) return null;
		return el('div', { class: 'bui-activity-actions' }, [this.#fold, copier, this.#result]);
	}

	#show() {
		const lines = this.#text.split('\n');
		const cut = !this.#all && lines.length > this.#lines;
		const shown = cut ? lines.slice(0, this.#lines).join('\n') : this.#text;
		if (this.#highlighter) this.#highlighter.fill(this.#code, shown);
		else this.#code.textContent = shown;
		if (!this.#fold) return;
		this.#fold.setAttribute('aria-expanded', String(this.#all));
		this.#fold.textContent = this.#all ? this.#labels.text('less') : this.#labels.text('more', { count: lines.length });
	}
}
