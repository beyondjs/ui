import { el, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { DataQuery } from './query.js';

/**
 * The table a `DataTable` draws (0.15.0): a caption for assistive technology, headers that sort (a
 * button in the header, `aria-sort` on the column sorted), group headings with their count, and rows
 * whose primary cell opens the row (a link whose target covers the row; `onopen` takes over plain
 * clicks). Cells take the column's `render` (text or a node), else its value; `mono` columns are drawn
 * in the monospace face and `align: 'end'` columns at the end in tabular figures.
 */
export class DataTableView {
	#options;

	/**
	 * @param {object} options
	 * @param {string} options.label the caption
	 * @param {Array<object>} options.columns
	 * @param {(row: object) => string} [options.key]
	 * @param {((row: object) => string)|null} [options.link]
	 * @param {((row: object, event: Event) => void)|null} [options.onopen]
	 * @param {(column: object) => void} options.onsort
	 * @param {import('../core/labels.js').Labels} options.labels
	 */
	constructor(options) {
		this.#options = options;
	}

	/** The table for one answer of `DataQuery.run`, sorted by `state.sort` in `state.direction`. */
	draw(answer, state) {
		const { label, columns, labels } = this.#options;
		return el('table', { class: `bui-table bui-data${this.#options.link || this.#options.onopen ? ' bui-table-links' : ''}` }, [
			el('caption', { class: 'bui-hidden' }, [content(label)]),
			el('thead', {}, [el('tr', {}, columns.map(column => this.#head(column, state)))]),
			el('tbody', {}, answer.groups.flatMap(group => [group.key === null ? null : el('tr', { class: 'bui-data-group' }, [el('th', { scope: 'colgroup', colspan: String(columns.length) }, [labels.text('group', { name: group.label, count: group.count })])]), ...group.rows.map(row => this.#row(row))].filter(Boolean)))
		]);
	}

	#head(column, state) {
		const sorted = state.sort === column.key;
		const order = sorted ? state.direction : null;
		const cell = el('th', { scope: 'col', class: column.align === 'end' ? 'bui-numeric' : null, 'aria-sort': column.sort ? (order ?? 'none') : null });
		if (!column.sort) return cell.append(content(column.label)), cell;
		const mark = glyph('chevron');
		mark.classList.add('bui-data-sort');
		if (order) mark.dataset.order = order;
		cell.append(el('button', { type: 'button', class: 'bui-data-sorter', onclick: () => this.#options.onsort(column) }, [el('span', {}, [content(column.label)]), mark]));
		return cell;
	}

	#row(row) {
		const { columns, key = item => item.id } = this.#options;
		const primary = columns.find(column => column.primary) ?? columns[0];
		return el('tr', { 'data-key': key(row) ?? null }, columns.map(column => this.#cell(row, column, column === primary)));
	}

	#cell(row, column, primary) {
		const { link = null, onopen = null } = this.#options;
		const value = column.render ? column.render(row) : DataQuery.value(row, column);
		const opens = primary && (link || onopen);
		const inner = opens ? el(link ? 'a' : 'button', { class: 'bui-row-link', href: link ? link(row) : null, type: link ? null : 'button', onclick: event => DataTableView.#open(event, row, onopen, Boolean(link)) }, [content(value)]) : content(value);
		const classes = [column.align === 'end' ? 'bui-numeric' : null, column.mono ? 'bui-mono' : null].filter(Boolean).join(' ') || null;
		// A React cell's holder (`bui-cell`) is filled after the drawing: never taken for empty here, React's
		// DataTable marks it once it knows what it rendered (0.35.0)
		const empty = value === null || value === undefined || value === '' || (typeof value === 'object' && typeof value.nodeType === 'number' && !value.classList?.contains('bui-cell') && !value.textContent && !value.childElementCount && value.localName !== 'img');
		return el(primary ? 'th' : 'td', { class: classes, scope: primary ? 'row' : null, 'data-label': typeof column.label === 'string' ? column.label : column.label?.textContent || null, 'data-summary': !primary && column.summary ? '' : null, 'data-empty': !primary && empty ? '' : null }, [inner]);
	}

	static #open(event, row, onopen, link) {
		if (!onopen) return;
		if (link && (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)) return;
		event.preventDefault();
		onopen(row, event);
	}
}
