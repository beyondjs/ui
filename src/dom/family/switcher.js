import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { NavigationMenu, entry } from './menu.js';

/**
 * The product switcher of the family bar (decision D04): the product name, drawn as the family
 * lockup's name, is the button of a menu of the family's products.
 *
 * It lists only the products where the work happens: Projects is reached as "Project overview" in the
 * project menu and from the wordmark, and Accounts from the profile menu, so their entries are never
 * drawn here, except the bar's own product, which is always listed as the current one. Inside a
 * project the menu lists the project's entries in each product as Beyond Projects reports them, each
 * with its availability: an unavailable entry states its reason ("Not offered here", "Not open to you
 * yet") as the row's quiet state at its end, as the project menu states a project's (0.13.0), and is a
 * link only when it has an address and the reason is advisory. Outside a project it
 * lists the products of the organization. Without a descriptor it holds the current product alone.
 *
 * It also carries the location's sections (`carried`), hidden until a touch screen too narrow for a
 * location button of a target's size folds the location into this menu (see family.css).
 */
export class ProductSwitcher extends Component {
	static #elsewhere = ['projects', 'accounts'];

	#menu;
	#options;

	/**
	 * @param {object} options
	 * @param {string} options.product the current product id
	 * @param {Record<string, string>} options.names display names by product id
	 * @param {object|null} options.descriptor the `beyond-family/1` descriptor when ready, else null
	 * @param {import('./places.js').Places} options.places
	 * @param {import('../core/labels.js').Labels} options.labels
	 * @param {Array<{heading: string, items: Node[]}>} [options.carried] the location's sections
	 */
	constructor(options) {
		super();
		this.#options = options;
		const { product, names, descriptor, labels, carried = [] } = options;
		const name = names[product] ?? product;
		const listed = (descriptor?.products ?? []).filter(item => item?.product && (item.product === product || !ProductSwitcher.#elsewhere.includes(item.product)));
		const items = listed.some(item => item.product === product) ? listed.map(item => this.#item(item)) : [this.#here(), ...listed.map(item => this.#item(item))];
		this.#menu = new NavigationMenu({
			label: el('span', { class: 'bui-lockup-name', text: name }),
			name: labels.text('product', { name }),
			part: 'product',
			class: 'bui-family-product',
			sections: [{ heading: labels.text(descriptor?.project ? 'entries' : 'products'), items }, ...carried.map(section => ({ ...section, class: `${section.class ?? ''} bui-family-carried`.trim() }))]
		});
	}

	get element() {
		return this.#menu.element;
	}

	get menu() {
		return this.#menu;
	}

	destroy() {
		this.#menu.destroy();
		super.destroy();
	}

	#item(item) {
		const { product, names, descriptor, places, labels } = this.#options;
		const name = names[item.product] ?? item.product;
		const meta = descriptor.project ? labels.text('entry', { product: name }) : labels.text('area', { product: item.product });
		const off = item.available === false;
		return entry({
			label: name,
			meta: meta || null,
			href: places.open(item) ? item.url : null,
			current: item.product === product ? 'page' : null,
			state: off ? this.#reason(item.reason) : null,
			class: off && item.reason === 'NOT_ADMITTED' ? 'bui-navmenu-advisory' : ''
		});
	}

	/** The current product at its own home, when the descriptor does not list it (or there is no descriptor yet). */
	#here() {
		const { product, names, places } = this.#options;
		return entry({ label: names[product] ?? product, href: places.own, current: 'page', class: 'bui-family-here' });
	}

	#reason(code) {
		const { labels } = this.#options;
		if (typeof code !== 'string' || !/^[A-Z_]+$/.test(code)) return labels.text('unavailable');
		const text = labels.text(code);
		return text === code ? labels.text('unavailable') : text;
	}
}
