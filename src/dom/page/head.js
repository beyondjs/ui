import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Hint } from '../core/hint.js';

/**
 * The head of a page's panel while it sits beside the main column (0.11.0): its title (an H2) and a
 * hide control, the `close` glyph alone (on D11's closed list) named "Hide {title}" with its tooltip.
 * In its sheet the panel shows the sheet's own head, with Close, instead.
 */
export class PanelHead {
	#element;
	#heading = el('h2', { class: 'bui-page-panel-title' });
	#button;
	#hint;
	#labels;
	#title = '';

	/**
	 * @param {object} options
	 * @param {string} options.title the panel's title
	 * @param {import('../core/labels.js').Labels} options.labels the panel's copy (`hide`)
	 * @param {() => void} options.onhide hides the panel
	 */
	constructor({ title, labels, onhide }) {
		this.#labels = labels;
		this.#button = el('button', { type: 'button', class: 'bui-icon-button bui-page-panel-hide', 'data-bui-hint': true, onclick: () => onhide() }, [glyph('close')]);
		this.#element = el('div', { class: 'bui-page-panel-head' }, [this.#heading, this.#button]);
		this.#hint = new Hint(this.#element);
		this.title = title;
	}

	get element() {
		return this.#element;
	}

	/** The hide control. */
	get button() {
		return this.#button;
	}

	get title() {
		return this.#title;
	}

	set title(title) {
		this.#title = String(title ?? '');
		this.#heading.textContent = this.#title;
		this.#button.setAttribute('aria-label', this.#labels.text('hide', { title: this.#title }));
	}

	destroy() {
		this.#hint.destroy();
	}
}
