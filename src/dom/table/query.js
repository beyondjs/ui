/**
 * What a `DataTable` shows from its rows (0.15.0): the rows that match the query, in the chosen order,
 * gathered by group, cut to one page. Plain data in and out, so the table's drawing and its tests read
 * one answer.
 */
export class DataQuery {
	#columns;
	#group;
	#match;
	#size;

	/**
	 * @param {object} options
	 * @param {Array<object>} options.columns
	 * @param {{by: (row: object) => string, label?: (key: string, rows: object[]) => string}|null} [options.group]
	 * @param {((row: object, query: string) => boolean)|null} [options.match]
	 * @param {number} [options.size] rows a page
	 */
	constructor({ columns, group = null, match = null, size = 50 }) {
		this.#columns = columns;
		this.#group = group;
		this.#match = match;
		this.#size = Math.max(1, Number(size) || 50);
	}

	get size() {
		return this.#size;
	}

	/** A column's text for searching and its value for ordering. */
	static value(row, column) {
		const value = column.value ? column.value(row) : row[column.key];
		return value === null || value === undefined ? '' : value;
	}

	/** Text without case or accents. */
	static fold(text) {
		return String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
	}

	/**
	 * The page in view: `{ rows, groups, total, pages, page, first, last }`, where `groups` is
	 * `[{ key, label, rows }]` (one group without a key when the table is not grouped).
	 */
	run(rows, { query = '', sort = null, direction = 'ascending', page = 1 } = {}) {
		const wanted = DataQuery.fold(query).trim();
		const found = wanted ? rows.filter(row => (this.#match ? this.#match(row, query) : this.#columns.some(column => DataQuery.fold(DataQuery.value(row, column)).includes(wanted)))) : [...rows];
		const column = this.#columns.find(each => each.key === sort && each.sort);
		if (column) {
			const compare = typeof column.sort === 'function' ? column.sort : DataQuery.compare(column);
			const sign = direction === 'descending' ? -1 : 1;
			found.sort((a, b) => sign * compare(a, b));
		}
		const ordered = this.#group ? DataQuery.#gather(found, this.#group.by) : found;
		const total = ordered.length;
		const pages = Math.max(1, Math.ceil(total / this.#size));
		const current = Math.min(Math.max(1, Number(page) || 1), pages);
		const start = (current - 1) * this.#size;
		const shown = ordered.slice(start, start + this.#size);
		return { rows: shown, groups: this.#groups(shown, found), total, pages, page: current, first: total ? start + 1 : 0, last: start + shown.length };
	}

	/** Orders by the column's value: numbers as numbers, text by the person's language. */
	static compare(column) {
		const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
		return (a, b) => {
			const [x, y] = [DataQuery.value(a, column), DataQuery.value(b, column)];
			return typeof x === 'number' && typeof y === 'number' ? x - y : collator.compare(String(x), String(y));
		};
	}

	/** Rows of a group follow each other in the order their group first appears; stable inside. */
	static #gather(rows, by) {
		const groups = new Map();
		for (const row of rows) {
			const key = String(by(row) ?? '');
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key).push(row);
		}
		return [...groups.values()].flat();
	}

	#groups(shown, all) {
		if (!this.#group) return [{ key: null, label: null, rows: shown }];
		const result = [];
		for (const row of shown) {
			const key = String(this.#group.by(row) ?? '');
			if (result.at(-1)?.key !== key) result.push({ key, rows: [] });
			result.at(-1).rows.push(row);
		}
		for (const group of result) {
			const members = all.filter(row => String(this.#group.by(row) ?? '') === group.key);
			group.count = members.length;
			group.label = this.#group.label ? this.#group.label(group.key, members) : group.key;
		}
		return result;
	}
}
