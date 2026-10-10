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
 *
 * Since 0.14.0 (D97) `{ kind: 'object', key?, heading, action?, search?, groups, more? }` is the product's
 * own objects with their action and search on their heading line; each object's search is one
 * `SidebarSearch` both copies draw, kept while its label and placeholder stay.
 */
export class SidebarSections {
	#panel;
	#drawer;
	#search = null;
	#searches = new Map();
	#groups = [];

	/**
	 * @param {object} options
	 * @param {string} options.name the navigation's accessible name ("Delegate sections")
	 * @param {import('../core/labels.js').Labels} options.labels the sidebar's copy
	 * @param {import('./folds.js').SidebarFolds|null} [options.folds] the kept folds (0.14.0)
	 * @param {{text: string, keys: string}|null} [options.shortcut] the search's shortcut (0.14.0)
	 */
	constructor({ name, labels, folds = null, shortcut = null }) {
		this.#panel = new SidebarView({ name, labels, folds, shortcut });
		this.#drawer = new SidebarView({ name, labels, folds, shortcut });
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
		const kept = new Map();
		const groups = this.#groups.map(group => {
			if (group?.kind !== 'object') return group;
			const key = String(group.key ?? group.heading ?? '');
			const search = SidebarSections.#keep(this.#searches.get(key) ?? null, group.search);
			if (search) kept.set(key, search);
			return { ...group, search };
		});
		for (const [key, search] of this.#searches) if (kept.get(key) !== search) search.destroy();
		this.#searches = kept;
		this.#panel.groups = groups;
		this.#drawer.groups = groups;
	}

	/** The objects' searches, in order (0.14.0). */
	get searches() {
		return [...this.#searches.values()];
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
		this.#search = SidebarSections.#keep(this.#search, config);
		this.#panel.search = this.#search;
		this.#drawer.search = this.#search;
	}

	/** The search for a config: the one given while its words stay (its source replaced), else a new one. */
	static #keep(search, config) {
		if (!config) {
			search?.destroy();
			return null;
		}
		if (search && search.config.label === config.label && search.config.placeholder === (config.placeholder ?? null)) {
			search.config = config;
			return search;
		}
		search?.destroy();
		return new SidebarSearch(config);
	}

	/** Opens the search in one copy (`panel` or `drawer`) with focus in its field; answers whether there was one (0.14.0). */
	seek(copy) {
		return (copy === 'drawer' ? this.#drawer : this.#panel).seek();
	}

	/** The label of the current item, or null. */
	get current() {
		return this.#panel.current;
	}

	destroy() {
		this.#search?.destroy();
		for (const search of this.#searches.values()) search.destroy();
		this.#panel.destroy();
		this.#drawer.destroy();
	}
}
