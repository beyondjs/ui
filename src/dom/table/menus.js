import { el } from '../core/element.js';
import { ActionMenu } from '../menu.js';
import { DataQuery } from './query.js';

/**
 * A `DataTable`'s row menus (0.44.0, the list rule L6): one column of its own at the rows' end, each row's
 * "More actions for {name}" `ActionMenu` holding the product's actions for that row (`menu(row)`, `ActionMenu`
 * items). It shows where the pointer rests or the focus is, and while it is open; a touch screen always shows
 * it (the list rules' reveal, `list-rules.css`). On a narrow table it stays beside the row's name. The items are
 * read again each time a menu opens, so a menu always offers the product's current actions; a row with none
 * draws an empty cell. The menus of a drawing are released when the rows are drawn again.
 */
export class DataMenus {
	#menu;
	#labels;
	#made = [];

	/**
	 * @param {object} options
	 * @param {(row: object) => Array<object|null|false>} options.menu the row's actions, as `ActionMenu` items
	 * @param {import('../core/labels.js').Labels} options.labels the table's words
	 */
	constructor({ menu, labels }) {
		this.#menu = menu;
		this.#labels = labels;
	}

	/** The column's header: no words drawn, its name for assistive technology. */
	head() {
		return el('th', { scope: 'col', class: 'bui-data-menu' }, [el('span', { class: 'bui-hidden', text: this.#labels.text('actions') })]);
	}

	/** A row's menu cell, named by the row's primary value. */
	cell(row, primary) {
		const items = this.#items(row);
		if (!items.length) return el('td', { class: 'bui-data-menu', 'data-menu': '', 'data-empty': '' });
		const name = String(DataQuery.value(row, primary));
		const menu = new ActionMenu({ label: null, name: this.#labels.text('more', { name }), items });
		this.#made.push(menu);
		const fresh = () => {
			if (!menu.expanded) menu.items = this.#items(row);
		};
		menu.element.addEventListener('click', fresh, { capture: true });
		menu.element.addEventListener('keydown', fresh, { capture: true });
		return el('td', { class: 'bui-data-menu', 'data-menu': '' }, [menu.element]);
	}

	/** Destroys the menus of the last drawing. */
	release() {
		for (const menu of this.#made.splice(0)) menu.destroy();
	}

	#items(row) {
		return (this.#menu(row) ?? []).filter(Boolean);
	}
}
