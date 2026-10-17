import { el } from '../core/element.js';
import { ListRow } from '../list/row.js';

/**
 * A collection's rows as a list (0.15.0, `presentation: 'list'`, DQ-12): one `ListRow` per row, the
 * primary column its name, the columns marked `end` its facts at the end and the others its muted line,
 * so a list stays two short lines a row on a phone instead of a card of labels and values. With `link`
 * the row opens its detail; `onopen` takes over plain clicks as the table's links do.
 */
export class CollectionRows {
	#element;
	#rows;

	constructor({ label, columns, rows, link = null, onopen = null, key = row => row.id }) {
		const primary = columns.find(column => column.primary) ?? columns[0];
		const value = (row, column) => (column.value ? column.value(row) : row[column.key]);
		this.#rows = rows.map(
			row =>
				new ListRow({
					title: value(row, primary),
					href: link ? link(row) : null,
					run: link && onopen ? event => CollectionRows.#open(event, row, onopen) : null,
					meta: columns.filter(column => column !== primary && !column.end).map(column => value(row, column)),
					facts: columns.filter(column => column !== primary && column.end).map(column => value(row, column))
				})
		);
		this.#rows.forEach((row, index) => (row.element.dataset.key = key(rows[index]) ?? ''));
		this.#element = el('ul', { class: 'bui-rows bui-collection-rows', 'aria-label': typeof label === 'string' ? label : null }, this.#rows.map(row => row.element));
	}

	get element() {
		return this.#element;
	}

	destroy() {
		for (const row of this.#rows) row.destroy();
	}

	/** A plain primary click goes to `onopen`; new tabs and copied addresses keep the link. */
	static #open(event, row, onopen) {
		if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
		event.preventDefault();
		onopen(row, event);
	}
}
