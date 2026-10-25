import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Hint } from '../core/hint.js';

/**
 * A chip that acts (0.35.0), for what goes with a message in a composer's tray, such as the line comments
 * that go with the next message ("Line comments 2", opening them where they are). It is a compact button
 * in the chips' geometry (D165): one target tall with the quiet edge, its muted `label` and its `value`,
 * and an optional `glyph` of the catalog before them. It opens no menu, so it draws no chevron.
 *
 * Its face is its accessible name, always, so what a person reads is what they say to reach it (WCAG
 * 2.5.3). `description` explains it ("They go with your next message. Opens them in the conversation's
 * changes."), read through `aria-describedby` from a visually hidden element beside the button.
 *
 * Its whole face is its family tooltip only while the composer shows less of it: its label set aside, as
 * in a toolbar that shortens its chips to keep one row (`ComposerFit`). Its value is never cut, since an
 * action is named whole (D179). The product keeps it in the tray while what it says is there and takes it
 * away once it went with a message. `element` holds the button and its description and takes no box of
 * its own; `control` is the button.
 */
export class ComposerChip extends Component {
	#element;
	#control;
	#label;
	#value;
	#glyph;
	#description;
	#parts = { label: el('span', { class: 'bui-composer-chip-label' }), value: el('span', { class: 'bui-composer-chip-value' }), description: el('span', { class: 'bui-hidden', id: Ids.next('bui-composer-chip') }) };
	#hint;

	/**
	 * @param {object} options
	 * @param {string|Node|null} [options.label] what it is, muted ("Line comments")
	 * @param {string|number|Node|null} [options.value] how much or which ("2")
	 * @param {string|null} [options.glyph] an icon of the catalog, before its words
	 * @param {string|Node|null} [options.description] what it is for, read after its name ("They go with your next message.")
	 * @param {((event: MouseEvent) => void)|null} [options.onclick] what a press does, such as opening what it counts
	 */
	constructor({ label = null, value = null, glyph: icon = null, description = null, onclick = null } = {}) {
		super();
		this.#label = label;
		this.#value = value;
		this.#glyph = icon;
		this.#description = description;
		this.#control = el('button', { type: 'button', class: 'bui-composer-chip', onclick });
		this.#element = el('span', { class: 'bui-composer-chip-holder' }, [this.#control, this.#parts.description]);
		// Its own tooltip root, so a toolbar's or a tray's never shows it a second time
		this.#hint = new Hint(this.#control, { when: () => this.#shortened() });
		this.#draw();
	}

	/** The button and its description, in a holder that takes no box of its own. */
	get element() {
		return this.#element;
	}

	/** The button, for focus. */
	get control() {
		return this.#control;
	}

	get label() {
		return this.#label;
	}

	/** Replaces what it is, muted ("Line comments"), keeping the button and its focus. */
	set label(text) {
		this.#label = text ?? null;
		this.#draw();
	}

	get value() {
		return this.#value;
	}

	/** Replaces how much or which ("3"), keeping the button and its focus. */
	set value(text) {
		this.#value = text ?? null;
		this.#draw();
	}

	get description() {
		return this.#description;
	}

	/** Replaces what it is for, read after its name, or none with null. */
	set description(text) {
		this.#description = text ?? null;
		this.#draw();
	}

	destroy() {
		this.#hint.destroy();
		super.destroy();
	}

	#draw() {
		const { label, value, description } = this.#parts;
		fill(label, [content(this.#label)]);
		fill(value, [content(this.#value)]);
		fill(description, [content(this.#description)]);
		label.hidden = !label.textContent;
		value.hidden = !value.textContent;
		fill(this.#control, [this.#glyph ? glyph(this.#glyph) : null, label, value]);
		if (description.textContent) this.#control.setAttribute('aria-describedby', description.id);
		else this.#control.removeAttribute('aria-describedby');
		// The whole face in words, "Line comments: 2", for the tooltip of a composer that shortens it
		const words = [label.hidden ? '' : label.textContent, value.hidden ? '' : value.textContent].filter(Boolean);
		this.#control.setAttribute('data-bui-tip', words.join(': '));
	}

	/** Whether the composer shows less than its whole face: its label set aside, a pixel wide, by a toolbar that shortens it. */
	#shortened() {
		const label = this.#parts.label;
		return !label.hidden && label.getBoundingClientRect().width < 2;
	}
}
