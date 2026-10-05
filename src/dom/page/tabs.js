import { Labels } from '../core/labels.js';
import { ProductNav } from '../nav.js';

const defaults = { nav: 'Sections of this page', named: 'Sections of {name}' };

/**
 * A resource's areas as tabs under its `PageHeader` (LR-05): links in the address with
 * `aria-current="page"` on the current one, drawn like `ProductNav` and scrolling sideways with the
 * current tab in view on narrow screens. One component for the tabs every product drew on its own.
 */
export class Tabs extends ProductNav {
	/** The copy in English and Spanish (0.7.2; `named` since 0.7.6). */
	static labels = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze({ nav: 'Secciones de esta página', named: 'Secciones de {name}' }) });

	/**
	 * @param {object} options
	 * @param {Array<{label: string|Node, href: string, current?: boolean}>} options.items
	 * @param {string} [options.label] the tabs' accessible name, as given
	 * @param {string} [options.name] what the tabs belong to, named in the accessible name ("Sections of {name}", 0.7.6)
	 * @param {(item: object, event: MouseEvent) => void} [options.onnavigate] takes over plain clicks on the tabs
	 * @param {{nav?: string, named?: string}} [options.labels]
	 */
	constructor({ items = [], label = null, name = null, onnavigate = null, labels = {} }) {
		const words = new Labels(defaults, labels);
		super({ items, label: label ?? (name ? words.text('named', { name }) : words.text('nav')), onnavigate });
		this.element.classList.add('bui-tabs');
	}
}
