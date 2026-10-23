import { el } from '../core/element.js';
import { Button } from '../button.js';
import { ActionMenu } from '../menu.js';

/**
 * A composer's **+** (0.26.0, D165): the first control of its toolbar, one round target with its glyph
 * alone and its name as its tooltip (D11's closed list). With nothing but files to add it opens the
 * platform's file chooser at once (**Attach files**); with the product's own entries (`add`: "Mention a
 * file", "Commands") it opens a menu of them, **Attach files** first where the composer takes files, each
 * with the key that does the same in the field ("@", "/") at its end. With neither it is not drawn. It is
 * one target wide, so it never folds behind Options.
 */
export class ComposerAdd {
	#element = el('span', { class: 'bui-composer-add', hidden: true });
	#labels;
	#pick;
	#attach;
	#entries = [];
	#mode = null;
	#button = null;
	#menu = null;

	/**
	 * @param {object} options
	 * @param {import('../core/labels.js').Labels} options.labels the composer's copy (`attach`, `add`)
	 * @param {(() => void)|null} options.pick opens the file chooser, when the composer takes files
	 * @param {string|null} [options.attach] the product's name for attaching (`attach.label`), else **Attach files**
	 */
	constructor({ labels, pick = null, attach = null }) {
		this.#labels = labels;
		this.#pick = pick;
		this.#attach = attach || labels.text('attach');
		this.#draw();
	}

	/** The holder at the toolbar's start. */
	get element() {
		return this.#element;
	}

	/** The control drawn now (the button, or the menu's button), for focus; null when there is none. */
	get control() {
		return this.#button?.element ?? this.#element.querySelector('.bui-menu-button');
	}

	/** The product's entries, `[{ label, run, keys? }]`; none leaves Attach files alone. */
	set entries(list) {
		this.#entries = (Array.isArray(list) ? list : []).filter(entry => entry?.label && typeof entry.run === 'function');
		this.#draw();
	}

	destroy() {
		this.#button?.destroy();
		this.#menu?.destroy();
		this.#element.remove();
	}

	#draw() {
		const mode = this.#entries.length ? 'menu' : this.#pick ? 'pick' : null;
		if (mode !== this.#mode) this.#build(mode);
		if (this.#menu) this.#menu.items = this.#items();
	}

	/** Draws the control for its mode, keeping focus on it when the old one had it. */
	#build(mode) {
		const focused = this.#element.contains(this.#element.ownerDocument.activeElement);
		this.#button?.destroy();
		this.#menu?.destroy();
		this.#button = null;
		this.#menu = null;
		this.#mode = mode;
		if (mode === 'pick') {
			this.#button = new Button({ label: this.#attach, glyph: 'plus', variant: 'quiet', bare: true, onclick: () => this.#pick() });
			this.#button.element.classList.add('bui-composer-plus', 'bui-composer-attach');
			this.#element.replaceChildren(this.#button.element);
		} else if (mode === 'menu') {
			this.#menu = new ActionMenu({ label: null, name: this.#labels.text('add'), glyph: 'plus', items: [], align: 'start' });
			this.#menu.element.querySelector('.bui-menu-button').classList.add('bui-composer-plus');
			this.#element.replaceChildren(this.#menu.element);
		} else this.#element.replaceChildren();
		this.#element.hidden = !mode;
		if (focused) this.control?.focus();
	}

	/** The menu's items: Attach files first where files are taken, then the product's entries with their keys. */
	#items() {
		const attach = this.#pick ? { label: this.#attach, run: () => this.#pick() } : null;
		const entries = this.#entries.map(entry => ({ label: ComposerAdd.#line(entry), run: entry.run }));
		return [attach, ...entries].filter(Boolean);
	}

	/** An entry's words with the key that does the same in the field at its end. */
	static #line({ label, keys = null }) {
		if (!keys) return label;
		return el('span', { class: 'bui-composer-entry' }, [el('span', { text: label }), el('kbd', { class: 'bui-composer-keys', 'aria-hidden': 'true', text: keys })]);
	}
}
