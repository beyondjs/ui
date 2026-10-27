import { el } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { ListRow } from '../list/row.js';
import { RowKeys } from '../list/keys.js';
import { Matches } from '../list/matches.js';
import { Differ } from '../list/differ.js';

/**
 * A collection's rows as a list (0.15.0, `presentation: 'list'`, DQ-12): one `ListRow` per row, the
 * primary column its name, the columns marked `end` its facts at the end and the others its muted line,
 * so a list stays two short lines a row on a phone instead of a card of labels and values. With `link`
 * the row opens its detail; `onopen` takes over plain clicks as the table's links do.
 *
 * Since 0.21.1 (the family's list rules, D162): `row(row)` gives the row's own `ListRow` options over the
 * columns' (its state's `lead`, its `meta` line, its `menu`); `group(row)` gives `{ key, label }` and
 * groups consecutive rows under a label, each group a list named by it (`Recency` for a list ordered by
 * activity); the search's words are marked in a name given as text; and the arrow keys move between rows.
 * Since 0.44.0 `row(row, { differ })` is given a `Differ` of the rows drawn, for the rule L3.
 */
export class CollectionRows {
	#element;
	#rows;
	#keys;

	constructor({ label, columns, rows, link = null, onopen = null, key = row => row.id, row: own = null, group = null, query = '' }) {
		const primary = columns.find(column => column.primary) ?? columns[0];
		const value = (row, column) => (column.value ? column.value(row) : row[column.key]);
		const named = text => (typeof text === 'string' && query ? Matches.mark(text, query) : text);
		const context = { differ: new Differ(rows) };
		this.#rows = rows.map(row => {
			const options = {
				title: value(row, primary),
				href: link ? link(row) : null,
				run: link && onopen ? event => CollectionRows.#open(event, row, onopen) : null,
				meta: columns.filter(column => column !== primary && !column.end).map(column => value(row, column)),
				facts: columns.filter(column => column !== primary && column.end).map(column => value(row, column)),
				...(own?.(row, context) ?? {})
			};
			return new ListRow({ ...options, title: Array.isArray(named(options.title)) ? el('span', {}, named(options.title)) : options.title });
		});
		this.#rows.forEach((row, index) => (row.element.dataset.key = key(rows[index]) ?? ''));
		const name = typeof label === 'string' ? label : null;
		this.#element = group ? CollectionRows.#grouped(rows, this.#rows, group, name) : el('ul', { class: 'bui-rows bui-collection-rows', 'aria-label': name }, this.#rows.map(row => row.element));
		this.#keys = new RowKeys(this.#element);
	}

	get element() {
		return this.#element;
	}

	/** Puts the focus on the first row's name; false when there is none. */
	first() {
		return this.#keys.first();
	}

	destroy() {
		this.#keys.destroy();
		for (const row of this.#rows) row.destroy();
	}

	/** Consecutive rows of one group under its label, each group a list the label names */
	static #grouped(rows, items, group, name) {
		const groups = [];
		rows.forEach((row, index) => {
			const { key, label } = group(row);
			if (groups.at(-1)?.key !== key) groups.push({ key, label, items: [] });
			groups.at(-1).items.push(items[index].element);
		});
		return el('div', { class: 'bui-rows-groups bui-collection-rows', role: name ? 'group' : null, 'aria-label': name }, groups.map(({ label, items: members }) => {
			const id = Ids.next('bui-rows-label');
			return el('div', { class: 'bui-rows-group' }, [el('p', { class: 'bui-rows-label', id, 'data-bui-label': '', text: label }), el('ul', { class: 'bui-rows', 'aria-labelledby': id }, members)]);
		}));
	}

	/** A plain primary click goes to `onopen`; new tabs and copied addresses keep the link. */
	static #open(event, row, onopen) {
		if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
		event.preventDefault();
		onopen(row, event);
	}
}
