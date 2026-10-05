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
	/** The copy in English and Spanish (0.7.2). */
	static labels = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze({ nav: 'Producto' }) });

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

	/**
	 * Scrolls the row, never the page, so the current tab is visible; again once the page's fonts have
	 * loaded, since a web font changes the tabs' widths.
	 */
	#reveal() {
		this.#scroll();
		this.#element.ownerDocument.fonts?.ready.then(() => !this.destroyed && this.#scroll());
	}

	/**
	 * Moves the row by whole pixels, rounded away from the tab, inside the row's padding: WebKit keeps
	 * only whole pixels of `scrollLeft`, so a fractional move would leave the tab a fraction outside.
	 */
	#scroll() {
		const current = this.#list.querySelector('[aria-current]');
		if (!current || !this.#element.isConnected) return;
		const style = this.#element.ownerDocument.defaultView.getComputedStyle(this.#list);
		const box = this.#list.getBoundingClientRect();
		const [start, end] = [box.left + parseFloat(style.paddingLeft || '0'), box.right - parseFloat(style.paddingRight || '0')];
		const tab = current.getBoundingClientRect();
		if (tab.left < start) this.#list.scrollLeft -= Math.ceil(start - tab.left);
		else if (tab.right > end) this.#list.scrollLeft += Math.ceil(Math.min(tab.right - end, tab.left - start));
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
