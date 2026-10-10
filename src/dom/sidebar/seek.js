import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { SidebarFinder } from './finder.js';

/**
 * The search of a sidebar's objects drawn as its icon on their heading line (0.14.0, D97): the `search`
 * glyph alone (D11's closed list), named by the search's label with the family tooltip, which also says
 * its shortcut when the sidebar has one ("Search conversations · ⌘K"). Pressed, it expands into the field
 * in place, over the heading line; Escape (and leaving the field while it is empty) returns to the icon,
 * Escape with focus back on it. While a query is typed the field stays and the results take the objects'
 * groups' place, with the bounded states of `SidebarSearch` unchanged.
 */
export class SidebarSeek {
	#search;
	#finder;
	#button;
	#head;
	#open = false;
	#release;

	/**
	 * @param {object} options
	 * @param {import('./search.js').SidebarSearch} options.search the shared search
	 * @param {import('../core/labels.js').Labels} options.labels the sidebar's copy
	 * @param {Element} options.groups the objects' groups, hidden while a query is typed
	 * @param {HTMLElement} options.head the heading line (`data-searching` while the field is shown)
	 * @param {{text: string, keys: string}|null} [options.shortcut] the shortcut as shown ("⌘K") and as `aria-keyshortcuts`
	 */
	constructor({ search, labels, groups, head, shortcut = null }) {
		this.#search = search;
		this.#head = head;
		this.#finder = new SidebarFinder({ search, labels, groups, escape: () => this.close(true) });
		this.#button = el('button', { type: 'button', class: 'bui-icon-button bui-sidebar-seek', 'aria-label': search.config.label, 'data-bui-hint': true, 'data-bui-shortcut': shortcut?.text ?? null, 'aria-keyshortcuts': shortcut?.keys ?? null, onclick: () => this.open() }, [glyph('search')]);
		this.#finder.field.addEventListener('focusout', event => {
			if (!this.#search.query && !this.#finder.field.contains(event.relatedTarget)) this.close(false);
		});
		this.#release = search.subscribe(() => this.#paint());
		this.#paint();
	}

	get search() {
		return this.#search;
	}

	/** The icon button. */
	get button() {
		return this.#button;
	}

	/** The field (with its live region), drawn over the heading line while expanded. */
	get field() {
		return this.#finder.field;
	}

	/** The results, in the groups' place while a query is typed. */
	get results() {
		return this.#finder.results;
	}

	/** Whether the field is shown: opened, or holding a query. */
	get expanded() {
		return this.#open || Boolean(this.#search.query);
	}

	/** Shows the field in place of the icon and moves focus to it. */
	open() {
		this.#open = true;
		this.#paint();
		this.#finder.focus();
	}

	/** Returns to the icon; `refocus` moves focus to it. A query in the field is cleared. */
	close(refocus = false) {
		this.#open = false;
		if (this.#search.query) {
			this.#finder.input.value = '';
			this.#search.clear();
		}
		this.#paint();
		if (refocus) this.#button.focus({ preventScroll: true });
	}

	destroy() {
		this.#release();
		this.#finder.destroy();
		this.#button.remove();
	}

	#paint() {
		const expanded = this.expanded;
		this.#button.hidden = expanded;
		this.#finder.field.hidden = !expanded;
		this.#head.toggleAttribute('data-searching', expanded);
	}
}
