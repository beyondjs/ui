import { el, fill } from '../core/element.js';

/**
 * A composer's box (0.26.0, D165): one rounded surface whose parts keep one order, the state line as its
 * first band, then the attachments, Expand, the field, why a message was not sent, dictation's line and
 * the toolbar, and last the context tray on its lower edge (0.14.0), whose chips the composer sets.
 * What the composer's context adds to the box itself (the suggestions, the drop target) stays after them.
 */
export class ComposerBox {
	#element = el('div', { class: 'bui-composer-box' });
	#tray = el('div', { class: 'bui-composer-tray', hidden: true });

	get element() {
		return this.#element;
	}

	/** Places the box's parts in their order, before what the context added, the tray last. */
	hold(parts) {
		this.#element.prepend(...parts.filter(Boolean), this.#tray);
	}

	/** The tray's chips (nodes or components); none takes the tray away. */
	set tray(nodes) {
		const list = ComposerBox.nodes(nodes);
		fill(this.#tray, list);
		this.#tray.hidden = !list.length;
	}

	/** Nodes or components as nodes, without the empty ones. */
	static nodes(nodes) {
		return [].concat(nodes ?? []).filter(Boolean).map(node => node.element ?? node);
	}
}
