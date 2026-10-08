import { SidebarView } from './view.js';
import { SidebarSearch } from './search.js';

/**
 * The content of a product's sidebar, drawn the same in the permanent sidebar and in the drawer: two
 * copies (`panel` and `drawer`), each one `<nav>` patched in place from the same groups, context, top
 * action and search, so either form shows what the other does. The search is one `SidebarSearch`
 * that both copies draw: a query typed in one is the other's too.
 *
 * Groups are `[{ heading?, items: [{ label, href, current?, meta? }] }]` (sections) and, since 0.10.0,
 * `{ kind: 'entries', key?, heading?, items: [{ key, label, href, current?, mark? }], more? }`: a
 * product's own items, such as its person's conversations. An update patches each copy by keys, so a
 * live change never redraws the navigation or moves focus.
 */
export class SidebarSections {
	#panel;
	#drawer;
	#search = null;
	#groups = [];

	/**
	 * @param {object} options
	 * @param {string} options.name the navigation's accessible name ("Delegate sections")
	 * @param {import('../core/labels.js').Labels} options.labels the sidebar's copy
	 */
	constructor({ name, labels }) {
		this.#panel = new SidebarView({ name, labels });
		this.#drawer = new SidebarView({ name, labels });
	}

	/** The permanent sidebar's `<nav>`. */
	get panel() {
		return this.#panel.element;
	}

	/** The drawer's `<nav>`. */
	get drawer() {
		return this.#drawer.element;
	}

	/** The shared search, or null. */
	get search() {
		return this.#search;
	}

	set groups(value) {
		this.#groups = Array.isArray(value) ? value : [];
		this.#panel.groups = this.#groups;
		this.#drawer.groups = this.#groups;
	}

	set context(value) {
		this.#panel.context = value ?? null;
		this.#drawer.context = value ?? null;
	}

	set action(value) {
		this.#panel.action = value ?? null;
		this.#drawer.action = value ?? null;
	}

	/** `{ label, source, bound?, delay?, all?, placeholder? }`, or null; a new config keeps the query. */
	set search(config) {
		if (!config) {
			this.#search?.destroy();
			this.#search = null;
		} else if (this.#search && this.#search.config.label === config.label && this.#search.config.placeholder === (config.placeholder ?? null)) this.#search.config = config;
		else {
			this.#search?.destroy();
			this.#search = new SidebarSearch(config);
		}
		this.#panel.search = this.#search;
		this.#drawer.search = this.#search;
	}

	/** The label of the current item, or null. */
	get current() {
		return this.#panel.current;
	}

	destroy() {
		this.#search?.destroy();
		this.#panel.destroy();
		this.#drawer.destroy();
	}
}
