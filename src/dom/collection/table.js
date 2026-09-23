import { el, content } from '../core/element.js';

/**
 * The compact table of a collection's rows. On narrow screens each row becomes a stacked block whose
 * cells carry their column label, so no table scrolls the page sideways. With `link`, the primary
 * cell is a real link and the whole row opens it; `onopen` may take over the navigation (for
 * applications that route without a page load) while new tabs and copied addresses keep working.
 */
export class Table {
	#element;

	constructor({ label, columns, rows, link = null, onopen = null, key = row => row.id }) {
		const primary = columns.find(column => column.primary) ?? columns[0];
		this.#element = el('table', { class: `bui-table${link ? ' bui-table-links' : ''}` }, [
			el('caption', { class: 'bui-hidden' }, [content(label)]),
			el('thead', {}, [el('tr', {}, columns.map(column => el('th', { scope: 'col', class: column.numeric ? 'bui-numeric' : null }, [content(column.label)])))]),
			el('tbody', {}, rows.map(row => el('tr', { 'data-key': key(row) ?? null }, columns.map(column => this.#cell(row, column, column === primary ? link : null, onopen)))))
		]);
	}

	get element() {
		return this.#element;
	}

	#cell(row, column, link, onopen) {
		const value = column.value ? column.value(row) : row[column.key];
		const inner = link
			? el('a', {
					href: link(row),
					class: 'bui-row-link',
					onclick: event => {
						if (!onopen || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
						event.preventDefault();
						onopen(row, event);
					}
				}, [content(value)])
			: content(value);
		const tag = link ? 'th' : 'td';
		return el(tag, { class: column.numeric ? 'bui-numeric' : null, 'data-label': column.label, scope: link ? 'row' : null }, [inner]);
	}
}
