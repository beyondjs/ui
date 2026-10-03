import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';

/**
 * The search field of the bar's project menu, shown when the menu holds more rows than fit without
 * scrolling on the smallest screen (`ProjectList.threshold`).
 *
 * It filters the rows already loaded as the person types, ignoring case and accents, and hides a
 * group ("Only in {product}") whose rows all fail to match. With no match it says so in one line
 * and links to the product's projects page with the query (`?q=`), which searches the whole
 * catalog. It owns only listeners on its own field, released with the menu's element.
 */
export class ProjectSearch {
	#field;
	#element;
	#none;
	#rows;
	#labels;
	#catalog;
	#organization;

	/**
	 * @param {object} options
	 * @param {Array<{node: HTMLElement, text: string}>} options.rows the menu's project rows (list items)
	 * @param {string|null} options.catalog the product's projects page, for the no-match link
	 * @param {string} options.organization the organization's name
	 * @param {import('../core/labels.js').Labels} options.labels
	 */
	constructor({ rows, catalog, organization, labels }) {
		this.#rows = rows.map(row => ({ ...row, key: ProjectSearch.fold(row.text) }));
		this.#labels = labels;
		this.#catalog = catalog;
		this.#organization = organization;
		this.#field = el('input', { type: 'search', class: 'bui-navmenu-field', 'aria-label': labels.text('search'), placeholder: labels.text('search'), autocomplete: 'off', spellcheck: 'false' });
		this.#field.addEventListener('input', () => this.filter(this.#field.value));
		this.#none = el('li', { class: 'bui-navmenu-none', hidden: true });
		this.#element = el('div', { class: 'bui-navmenu-search' }, [glyph('search'), this.#field]);
	}

	/** The field with its glyph, placed after the menu's heading. */
	get element() {
		return this.#element;
	}

	get field() {
		return this.#field;
	}

	/** The "No projects match" line, placed in the list after the rows. */
	get none() {
		return this.#none;
	}

	/** Shows the rows whose name contains `query`; returns how many are shown. */
	filter(query) {
		const key = ProjectSearch.fold(query.trim());
		let shown = 0;
		for (const row of this.#rows) {
			row.node.hidden = Boolean(key) && !row.key.includes(key);
			if (!row.node.hidden) shown += 1;
		}
		for (const section of new Set(this.#rows.map(row => row.node.closest('.bui-family-only')).filter(Boolean))) {
			section.hidden = this.#rows.every(row => row.node.closest('.bui-family-only') !== section || row.node.hidden);
		}
		this.#nothing(shown ? null : query.trim());
		return shown;
	}

	#nothing(query) {
		this.#none.hidden = query === null;
		if (query === null) return this.#none.replaceChildren();
		const text = el('span', { class: 'bui-navmenu-label', text: this.#labels.text('nomatch', { query }) });
		const link = this.#catalog ? el('a', { class: 'bui-navmenu-item bui-navmenu-action', href: ProjectSearch.#query(this.#catalog, query) }, [this.#labels.text('find', { organization: this.#organization })]) : null;
		this.#none.replaceChildren(text, link ?? '');
	}

	/** Lower case without accents, for matching as people type. */
	static fold(text) {
		return String(text ?? '')
			.normalize('NFD')
			.replace(/\p{M}/gu, '')
			.toLocaleLowerCase();
	}

	static #query(address, query) {
		try {
			const url = new URL(address, globalThis.document?.baseURI);
			url.searchParams.set('q', query);
			return url.href;
		} catch {
			return address;
		}
	}
}
