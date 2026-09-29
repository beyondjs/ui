import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { badge } from '../feedback.js';
import { NavigationMenu, entry } from './menu.js';

/**
 * The product switcher of the family bar (decision D04): the product name, drawn as the family
 * lockup's name, is the button of a menu of the family's products.
 *
 * Inside a project the menu lists the project's entries in each product as Beyond Projects reports
 * them, each with its availability: an unavailable entry states its reason and is a link only when
 * it has an address and the reason is advisory. Outside a project it lists the products of the
 * organization. Without a descriptor (loading or unavailable) it holds one link to Projects.
 */
export class ProductSwitcher extends Component {
	#menu;
	#options;

	/**
	 * @param {object} options
	 * @param {string} options.product the current product id
	 * @param {Record<string, string>} options.names display names by product id
	 * @param {object|null} options.descriptor the `beyond-family/1` descriptor when ready, else null
	 * @param {import('./places.js').Places} options.places
	 * @param {import('../core/labels.js').Labels} options.labels
	 */
	constructor(options) {
		super();
		this.#options = options;
		const { product, names, descriptor, labels } = options;
		const name = names[product] ?? product;
		const items = descriptor ? (descriptor.products ?? []).map(item => this.#item(item)) : [this.#back()];
		this.#menu = new NavigationMenu({
			label: el('span', { class: 'bui-lockup-name', text: name }),
			name: labels.text('product', { name }),
			part: 'product',
			class: 'bui-family-product',
			sections: [{ heading: labels.text(descriptor?.project ? 'entries' : 'products'), items }]
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
		const inside = Boolean(descriptor.project);
		const meta = !inside ? labels.text('area', { product: item.product }) : item.product === 'projects' ? labels.text('overview') : labels.text('entry', { product: name });
		const off = item.available === false;
		return entry({
			label: name,
			meta: meta || null,
			href: places.open(item) ? item.url : null,
			current: item.product === product ? 'page' : null,
			note: off ? badge(this.#reason(item.reason), item.reason === 'NOT_ADMITTED' ? 'warning' : 'neutral') : null
		});
	}

	/** The one entry while the descriptor is loading or unavailable: Projects, from the product's own brand address. */
	#back() {
		const { product, names, places, labels } = this.#options;
		return entry({ label: names.projects, meta: labels.text('back'), href: places.home, current: product === 'projects' ? 'page' : null });
	}

	#reason(code) {
		const { labels } = this.#options;
		if (typeof code !== 'string' || !/^[A-Z_]+$/.test(code)) return labels.text('unavailable');
		const text = labels.text(code);
		return text === code ? labels.text('unavailable') : text;
	}
}
