import { el, fill } from '../core/element.js';

/**
 * A composer's box (0.26.0, D165): one rounded surface whose parts keep one order, the state line as its
 * first band, then the attachments, Expand, the field, why a message was not sent, dictation's line and
 * the toolbar, and last the context tray on its lower edge (0.14.0), whose chips the composer sets.
 * What the composer's context adds to the box itself (the suggestions, the drop target) stays after them.
 */
export class ComposerBox {
	/** What answers a press itself inside the box: its controls, and the words a person may select there. */
	static own = 'button, a[href], input, textarea, select, label, summary, [contenteditable], [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"], [role="listbox"], [role="option"], [role="menu"], [role="menuitem"], .bui-composer-line, .bui-composer-problem, .bui-composer-files, .bui-composer-suggestions, .bui-composer-summary';

	#element = el('div', { class: 'bui-composer-box' });
	#tray = el('div', { class: 'bui-composer-tray', hidden: true });
	#field = null;

	get element() {
		return this.#element;
	}

	/**
	 * Places the box's parts in their order, before what the context added, the tray last. A press in the box
	 * where nothing answers it (its padding, the gaps of its toolbar, the room under the words) then puts the
	 * caret in `field`, as a press on the field would (0.34.0, D187): the box reads as one field and lights as
	 * one, and the focus never leaves on the way, so its edge does not flicker.
	 */
	hold(parts, field = null) {
		this.#element.prepend(...parts.filter(Boolean), this.#tray);
		if (field && !this.#field) this.#element.addEventListener('mousedown', event => this.#press(event));
		this.#field = field ?? this.#field;
	}

	/** The tray's chips (nodes or components); none takes the tray away. */
	set tray(nodes) {
		const list = ComposerBox.nodes(nodes);
		fill(this.#tray, list);
		this.#tray.hidden = !list.length;
	}

	#press(event) {
		const field = this.#field;
		if (event.button !== 0 || event.defaultPrevented || !field || field.disabled || event.target.closest?.(ComposerBox.own)) return;
		event.preventDefault();
		field.focus({ preventScroll: true });
	}

	/** Nodes or components as nodes, without the empty ones. */
	static nodes(nodes) {
		return [].concat(nodes ?? []).filter(Boolean).map(node => node.element ?? node);
	}
}
