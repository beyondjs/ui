import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { Labels } from './core/labels.js';

const defaults = { nav: 'Product' };

/**
 * A product's own navigation as a light row of tabs under the family bar, for a product without a
 * sidebar (the family bar never carries product navigation).
 *
 * The row scrolls sideways when it is narrower than its tabs and keeps the current tab in view; a
 * tab's focus ring is drawn inside it so the scrolling row never clips it. The current tab carries
 * `aria-current="page"`. It is not sticky unless `sticky` asks for it, in which case it stays under
 * the family bar.
 */
export class ProductNav extends Component {
	#element;
	#list;
	#onnavigate;

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
		this.items = items;
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

	/** Scrolls the row, never the page, so the current tab is visible. */
	#reveal() {
		const current = this.#list.querySelector('[aria-current]');
		if (!current || !this.#element.isConnected) return;
		const row = this.#list.getBoundingClientRect();
		const tab = current.getBoundingClientRect();
		if (tab.left < row.left) this.#list.scrollLeft -= row.left - tab.left;
		else if (tab.right > row.right) this.#list.scrollLeft += tab.right - row.right;
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
