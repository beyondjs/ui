import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { Labels } from './core/labels.js';
import { ScrollEdges } from './core/edges.js';

const defaults = { nav: 'Product' };

/**
 * A product's own navigation as a light row of tabs under the family bar, for a product without a
 * sidebar (the family bar never carries product navigation).
 *
 * The row scrolls sideways when it is narrower than its tabs and keeps the current tab in view; a
 * tab's focus ring is drawn inside it so the scrolling row never clips it. The current tab carries
 * `aria-current="page"`. It is not sticky unless `sticky` asks for it, in which case it stays under
 * the family bar. Since 0.15.0 (X-15, PKG-19) an end that holds more tabs than it shows says so with a
 * fade and a chevron that scrolls the row (`ScrollEdges`). Since 0.36.0 (D179) the current tab shows
 * whole, never under that fade and chevron or the row's padding, from the first frame and again once
 * fonts load or the row changes size, until the person moves the row.
 */
export class ProductNav extends Component {
	/** The copy in English and Spanish (0.7.2). */
	static labels = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze({ nav: 'Producto' }) });

	#element;
	#list;
	#onnavigate;
	#edges;

	/**
	 * @param {object} options
	 * @param {Array<{label: string|Node, href: string, current?: boolean}>} options.items
	 * @param {string} [options.label] the navigation's accessible name (default `labels.nav`)
	 * @param {boolean} [options.sticky] stays under the family bar while scrolling
	 * @param {(item: object, event: MouseEvent) => void} [options.onnavigate] takes over plain clicks on the tabs
	 */
	constructor({ items = [], label = null, sticky = false, onnavigate = null, labels = {} }) {
		super();
		this.#onnavigate = onnavigate;
		this.#list = el('ul', { class: 'bui-productnav-list' });
		this.#element = el('nav', { class: `bui-productnav${sticky ? ' bui-productnav-sticky' : ''}`, 'aria-label': label ?? new Labels(defaults, labels).text('nav') }, [this.#list]);
		this.#edges = new ScrollEdges(this.#element, this.#list);
		this.items = items;
	}

	/** Which ends of the row hold tabs it does not show: `start`, `end`, both or none (0.15.0). */
	get more() {
		return this.#edges.more;
	}

	destroy() {
		this.#edges.destroy();
		super.destroy();
	}

	get element() {
		return this.#element;
	}

	/** Replaces the tabs and brings the current one into view. */
	set items(items) {
		this.#list.replaceChildren(...items.filter(Boolean).map(item => el('li', {}, [this.#link(item)])));
		this.#reveal();
	}

	mount(parent, before = null) {
		super.mount(parent, before);
		this.#reveal();
		return this;
	}

	/**
	 * Keeps the current tab whole in view, clear of both ends of the row: its padding and the cues that say
	 * an end holds more, as they are drawn (0.36.0, D179). The row scrolls by whole pixels and never the
	 * page, now and again whenever the row or its tabs change size, since a web font that loads changes
	 * the tabs' widths (`ScrollEdges.reveal`).
	 */
	#reveal() {
		this.#edges?.reveal(this.#list.querySelector('[aria-current]'));
	}

	#link(item) {
		const { label, href, current = false } = item;
		return el(
			'a',
			{
				href,
				'aria-current': current ? 'page' : null,
				onclick: event => {
					if (!this.#onnavigate || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
					event.preventDefault();
					this.#onnavigate(item, event);
				}
			},
			[content(label)]
		);
	}
}
