import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Hint } from '../core/hint.js';

/**
 * A chip that acts (0.34.0), for what goes with a message in a composer's tray, such as the line comments
 * that go with the next message ("Line comments 2", opening them where they are). It is a compact button
 * in the chips' geometry (D165): one target tall with the quiet edge, its muted `label` and its `value`,
 * and an optional `glyph` of the catalog before them. It opens no menu, so it draws no chevron. `name` is
 * its accessible name when it differs from its face ("2 line comments go with your message: open
 * them"); without it the face is the name.
 *
 * Its whole face is its family tooltip only while the composer shows less of it: its label set aside, as
 * in a toolbar that shortens its chips to keep one row (`ComposerFit`). Its value is never cut, since an
 * action is named whole (D179). The product keeps it in the tray while what it says is there and takes it
 * away once it went with a message.
 */
export class ComposerChip extends Component {
	#element;
	#label;
	#value;
	#glyph;
	#name;
	#parts = { label: el('span', { class: 'bui-composer-chip-label' }), value: el('span', { class: 'bui-composer-chip-value' }) };
	#hint;

	/**
	 * @param {object} options
	 * @param {string|Node|null} [options.label] what it is, muted ("Line comments")
	 * @param {string|number|Node|null} [options.value] how much or which ("2")
	 * @param {string|null} [options.glyph] an icon of the catalog, before its words
	 * @param {string|null} [options.name] its accessible name when it differs from its face
	 * @param {((event: MouseEvent) => void)|null} [options.onclick] what a press does, such as opening what it counts
	 */
	constructor({ label = null, value = null, glyph: icon = null, name = null, onclick = null } = {}) {
		super();
		this.#label = label;
		this.#value = value;
		this.#glyph = icon;
		this.#name = name || null;
		this.#element = el('button', { type: 'button', class: 'bui-composer-chip', onclick });
		// Its own tooltip root, so a toolbar's or a tray's never shows it a second time
		this.#hint = new Hint(this.#element, { when: () => this.#shortened() });
		this.#draw();
	}

	get element() {
		return this.#element;
	}

	get label() {
		return this.#label;
	}

	/** Replaces what it is, muted ("Line comments"), keeping the element and its focus. */
	set label(text) {
		this.#label = text ?? null;
		this.#draw();
	}

	get value() {
		return this.#value;
	}

	/** Replaces how much or which ("3"), keeping the element and its focus. */
	set value(text) {
		this.#value = text ?? null;
		this.#draw();
	}

	get name() {
		return this.#name;
	}

	/** Its accessible name when it differs from its face, or null for the face. */
	set name(text) {
		this.#name = text || null;
		this.#draw();
	}

	destroy() {
		this.#hint.destroy();
		super.destroy();
	}

	#draw() {
		const { label, value } = this.#parts;
		fill(label, [content(this.#label)]);
		fill(value, [content(this.#value)]);
		label.hidden = !label.textContent;
		value.hidden = !value.textContent;
		fill(this.#element, [this.#glyph ? glyph(this.#glyph) : null, label, value]);
		if (this.#name) this.#element.setAttribute('aria-label', this.#name);
		else this.#element.removeAttribute('aria-label');
		// The whole face in words, "Line comments: 2", for the tooltip of a composer that shortens it
		const words = [label.hidden ? '' : label.textContent, value.hidden ? '' : value.textContent].filter(Boolean);
		this.#element.setAttribute('data-bui-tip', words.join(': '));
	}

	/** Whether the composer shows less than its whole face: its label set aside, a pixel wide, by a toolbar that shortens it. */
	#shortened() {
		const label = this.#parts.label;
		return !label.hidden && label.getBoundingClientRect().width < 2;
	}
}
