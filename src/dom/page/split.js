import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';

/**
 * List and detail (LR-03, FAM-40): an item opened from a list sits beside the list on a wide region,
 * and takes the region's whole width, as its own page, on a narrow one.
 *
 * The region decides by its own width (a container query, `ListDetail.cut`, 72rem), never the
 * window's. On a narrow region an open detail starts with its way back to the list (`back`, a link to
 * the list's own address, which the product keeps in its address as for any page); on a wide one
 * that link is not drawn, because the list is in view. Without a detail the list takes the region.
 * The product owns the address: opening an item is a navigation (`&repository=rep_…`), and `detail`
 * is set from it, so a reload and the history show the same.
 */
export class ListDetail extends Component {
	/** The region's width from which the detail sits beside the list. */
	static cut = '72rem';

	#element;
	#list;
	#detail;
	#body;
	#back;
	#onnavigate = null;

	/**
	 * @param {object} options
	 * @param {Node|{element: Node}} options.list the list (a `Collection`)
	 * @param {Node|{element: Node}|null} [options.detail] the open item, or null
	 * @param {string} [options.label] the detail's accessible name ("Repository")
	 * @param {{label: string, href: string, onnavigate?: (event: MouseEvent) => void}|null} [options.back] the way back to the list on a narrow region
	 */
	constructor({ list, detail = null, label = null, back = null }) {
		super();
		this.#list = el('div', { class: 'bui-listdetail-list' }, [ListDetail.#node(list)]);
		this.#back = el('p', { class: 'bui-listdetail-back' });
		this.#body = el('div', { class: 'bui-listdetail-body' });
		this.#detail = el('section', { class: 'bui-listdetail-detail', 'aria-label': label, tabindex: '-1' }, [this.#back, this.#body]);
		this.#element = el('div', { class: 'bui-listdetail' }, [el('div', { class: 'bui-listdetail-frame' }, [this.#list, this.#detail])]);
		this.back = back;
		this.detail = detail;
	}

	get element() {
		return this.#element;
	}

	/** Whether an item is open. */
	get open() {
		return this.#element.hasAttribute('data-open');
	}

	/** The open item, or null to show the list alone. */
	set detail(detail) {
		fill(this.#body, detail ? [ListDetail.#node(detail)] : []);
		this.#element.toggleAttribute('data-open', Boolean(detail));
		this.#detail.hidden = !detail;
	}

	/** The way back to the list on a narrow region: `{ label, href, onnavigate? }`. */
	set back(back) {
		this.#onnavigate = back?.onnavigate ?? null;
		const link = back?.href ? el('a', { href: back.href, class: 'bui-listdetail-link', onclick: event => this.#navigate(event) }, [glyph('back'), content(back.label)]) : null;
		fill(this.#back, link ? [link] : []);
	}

	/** Moves focus to the detail, for a product that opened an item by keyboard. */
	focus() {
		this.#detail.focus({ preventScroll: true });
	}

	#navigate(event) {
		if (!this.#onnavigate || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		this.#onnavigate(event);
	}

	static #node(part) {
		return part?.element ?? part;
	}
}
