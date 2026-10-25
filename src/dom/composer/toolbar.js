import { el, fill } from '../core/element.js';
import { Hint } from '../core/hint.js';
import { ComposerFold } from './fold.js';
import { ComposerFit } from './fit.js';

/**
 * A composer's toolbar (0.11.2): its start (the **+**, the turn's settings, the product's tools) and its
 * end (the actions), kept on one row by `ComposerFit` and, as the last resort, by Options
 * (`ComposerFold`). Since 0.11.1 a composer folded its settings and Attach behind Options under 30rem;
 * since 0.11.2 it folds only when the toolbar cannot keep one row even with its chips shortened to
 * their value, measured, never by a fixed width. The settings' chips show their whole words in the
 * family tooltip while the fit shortens them. Since 0.26.0 (D165) every control is one target tall and
 * the **+** is one target wide, so it stays in place and only the settings fold. Since 0.35.0 that tooltip
 * covers the whole box, so the tray's chips, which show their value alone too, say their whole face.
 */
export class ComposerToolbar {
	#element;
	#settings = el('div', { class: 'bui-composer-settings' });
	#tools = el('div', { class: 'bui-composer-tools' });
	#fold;
	#fit;
	#hint;

	/**
	 * @param {object} options
	 * @param {HTMLElement} options.root the composer
	 * @param {HTMLElement} options.box the composer's box, whose chips (the settings' and the tray's) say their whole face in the tooltip
	 * @param {HTMLElement[]} options.controls the **+** and its file input, when the composer takes files
	 * @param {HTMLElement} options.actions the toolbar's end
	 * @param {import('../core/labels.js').Labels} options.labels the composer's copy
	 * @param {boolean} options.compact whether the toolbar adapts to keep one row (`compact`, default true)
	 */
	constructor({ root, box, controls, actions, labels, compact }) {
		const start = el('div', { class: 'bui-composer-start' }, [...controls, this.#settings, this.#tools]);
		this.#element = el('div', { class: 'bui-composer-bar' }, [start, actions]);
		this.#fold = new ComposerFold({ root, bar: this.#element, labels, enabled: compact !== false, parts: [this.#settings], onchange: open => open || this.#fit.measure() });
		this.#fit = new ComposerFit({ root, bar: this.#element, fold: this.#fold, enabled: compact !== false });
		// A chip shows its value alone (0.26.0): its whole words ("Model: Opus 5.5 · High") are its tooltip, in
		// the settings and the tray alike (0.35.0); the box moves into the taller editor, which then holds it
		this.#hint = new Hint(box, { when: () => true });
		this.#fold.available = false;
	}

	get element() {
		return this.#element;
	}

	/** Options (`ComposerFold`). */
	get fold() {
		return this.#fold;
	}

	/** The level that keeps one row: `full`, `short` (chips say their value) or `fold` (behind Options). */
	get level() {
		return this.#fit.level;
	}

	/** Decides the level now, as a change of width or content does by itself. */
	measure() {
		this.#fit.measure();
	}

	/** The turn's choices at the start, before the tools. */
	set settings(nodes) {
		fill(this.#settings, nodes);
		this.#fold.available = nodes.length > 0;
	}

	set tools(nodes) {
		fill(this.#tools, nodes);
	}

	/** What sending uses, said by Options while the settings are folded (0.11.2). */
	set summary(text) {
		this.#fold.summary = text;
	}

	destroy() {
		this.#hint.destroy();
		this.#fit.destroy();
		this.#fold.destroy();
	}
}
