import { Labels } from '../core/labels.js';
import { ProductNav } from '../nav.js';

const defaults = { nav: 'Sections of this page' };

/**
 * A resource's areas as tabs under its `PageHeader` (LR-05): links in the address with
 * `aria-current="page"` on the current one, drawn like `ProductNav` and scrolling sideways with the
 * current tab in view on narrow screens. One component for the tabs every product drew on its own.
 */
export class Tabs extends ProductNav {
	/**
	 * @param {object} options
	 * @param {Array<{label: string|Node, href: string, current?: boolean}>} options.items
	 * @param {string} [options.label] the tabs' accessible name
	 * @param {(item: object, event: MouseEvent) => void} [options.onnavigate] takes over plain clicks on the tabs
	 * @param {{nav?: string}} [options.labels]
	 */
	constructor({ items = [], label = null, onnavigate = null, labels = {} }) {
		super({ items, label: label ?? new Labels(defaults, labels).text('nav'), onnavigate });
		this.element.classList.add('bui-tabs');
	}
}
