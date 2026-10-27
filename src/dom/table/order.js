import { el } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Select } from '../select.js';

/**
 * A narrow `DataTable`'s sort (0.44.0): under 36rem of the table's own width its header is hidden from sight, so
 * the order its header buttons give is chosen here, in a line above the rows: "Sort by" with each sortable
 * column in either direction, and the product's own order. A native select, as the table's filters are, so the
 * keyboard and a phone's own picker choose it. It reports the same `{ sort, direction }` the header does, through
 * the table's one `onchange`, so the product keeps it in its address as it keeps the header's; the stylesheet
 * shows the line only on the narrow form, and the table hides it while it draws no rows.
 */
export class DataOrder {
	#element;
	#select;
	#columns;

	/**
	 * @param {object} options
	 * @param {Array<object>} options.columns the table's columns; the sortable ones are offered
	 * @param {import('../core/labels.js').Labels} options.labels the table's words
	 * @param {(part: {sort: string|null, direction: 'ascending'|'descending'}) => void} options.onchange the person chose an order
	 */
	constructor({ columns, labels, onchange }) {
		this.#columns = columns.filter(column => column.sort);
		const id = Ids.next('bui-data-order');
		const name = column => (typeof column.label === 'string' ? column.label : (column.label?.textContent ?? column.key));
		const options = [{ value: '', label: labels.text('unsorted') }, ...this.#columns.flatMap(column => ['ascending', 'descending'].map(direction => ({ value: DataOrder.#value(column.key, direction), label: labels.text(direction, { column: name(column) }) })))];
		this.#select = new Select({ id, options, statement: false, onchange: value => onchange(DataOrder.#read(value)) });
		this.#element = el('div', { class: 'bui-data-order', hidden: true }, [el('label', { for: id, class: 'bui-field-label', text: labels.text('order') }), this.#select.element]);
	}

	/** Whether the table has a column to sort by: without one it draws no line. */
	get offered() {
		return this.#columns.length > 0;
	}

	get element() {
		return this.#element;
	}

	/** The select, for focus and for tests. */
	get control() {
		return this.#select.control;
	}

	/** Shows the order in view, from the header's sort, the address or the person's own choice. */
	set state({ sort = null, direction = 'ascending' } = {}) {
		const known = this.#columns.some(column => column.key === sort);
		this.#select.value = known ? DataOrder.#value(sort, direction) : '';
	}

	/** Whether the line is drawn: only while the table draws its rows. */
	set shown(shown) {
		this.#element.hidden = !shown || !this.offered;
	}

	destroy() {
		this.#select.destroy();
	}

	static #value(key, direction) {
		return `${direction}:${key}`;
	}

	static #read(value) {
		if (!value) return { sort: null, direction: 'ascending' };
		const at = value.indexOf(':');
		return { sort: value.slice(at + 1), direction: value.slice(0, at) === 'descending' ? 'descending' : 'ascending' };
	}
}
