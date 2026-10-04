import { el } from '../core/element.js';

/**
 * Column priority (LR-03, FAM-40): as a collection's region narrows, its columns leave in a declared
 * order instead of the table scrolling, and the person can reveal them again.
 *
 * A column with `priority` (1, 2, 3 …) may be hidden, the highest number first; a column without one,
 * and the primary column, always stay. The natural width of each column is measured once per drawing
 * (the table at its content's width), and the fit is decided from the region's own width, again on
 * every resize. Rows stacked under 640 px show every column, each with its label. "Show 2 more
 * columns" reveals them, and the table then scrolls in its own box; "Show fewer columns" hides them
 * again. The choice is kept across pages and searches.
 */
export class ColumnFit {
	#columns;
	#labels;
	#toggle;
	#table = null;
	#widths = [];
	#hidden = new Set();
	#revealed = false;
	#observer = null;
	#host = null;

	/**
	 * @param {object} options
	 * @param {Array<{priority?: number, primary?: boolean}>} options.columns
	 * @param {import('../core/labels.js').Labels} options.labels the collection's copy (`columns`, `fewer`)
	 */
	constructor({ columns, labels }) {
		this.#columns = columns;
		this.#labels = labels;
		this.#toggle = el('button', { type: 'button', class: 'bui-link-button bui-collection-columns', hidden: true, onclick: () => this.reveal(!this.#revealed) });
	}

	/** The "Show more columns" button, placed after the table. */
	get element() {
		return this.#toggle;
	}

	/** The indexes of the columns hidden now. */
	get hidden() {
		return [...this.#hidden].sort((a, b) => a - b);
	}

	/** Whether the person revealed the hidden columns. */
	get revealed() {
		return this.#revealed;
	}

	/** Whether any column can be hidden at all. */
	get active() {
		const primary = this.#columns.findIndex(column => column.primary);
		return this.#columns.some((column, index) => Number.isFinite(column.priority) && index !== Math.max(primary, 0));
	}

	/**
	 * The columns to hide so that `widths` fit in `available`: the hideable ones (a finite `priority`,
	 * not the primary, given by `fixed`) leave, the highest priority number first, until the rest fit.
	 */
	static fit({ available, widths, priorities, fixed = 0 }) {
		const hidden = new Set();
		let total = widths.reduce((sum, width) => sum + width, 0);
		const order = priorities
			.map((priority, index) => ({ priority, index }))
			.filter(entry => Number.isFinite(entry.priority) && entry.index !== fixed)
			.sort((a, b) => b.priority - a.priority || b.index - a.index);
		for (const { index } of order) {
			if (total <= available) break;
			hidden.add(index);
			total -= widths[index];
		}
		return hidden;
	}

	/** Measures a newly drawn table inside `host` (the collection's body) and fits it; follows the host's width. */
	attach(table, host) {
		this.#table = table;
		if (this.#host !== host) {
			this.#observer?.disconnect();
			const view = host.ownerDocument.defaultView;
			this.#observer = view?.ResizeObserver ? new view.ResizeObserver(() => this.#apply()) : null;
			this.#observer?.observe(host);
			this.#host = host;
		}
		this.#measure();
		this.#apply();
	}

	/** Reveals every hidden column, or hides them again. */
	reveal(value) {
		this.#revealed = Boolean(value);
		this.#apply();
		this.#toggle.focus?.({ preventScroll: true });
	}

	release() {
		this.#observer?.disconnect();
		this.#observer = null;
	}

	#measure() {
		const table = this.#table;
		this.#widths = [];
		if (!table || !this.active) return;
		this.#mark(new Set());
		table.classList.add('bui-table-measure');
		const heads = [...table.querySelectorAll('thead th')];
		this.#widths = heads.map(head => head.getBoundingClientRect().width);
		table.classList.remove('bui-table-measure');
	}

	#apply() {
		const table = this.#table;
		if (!table || !this.active || !table.isConnected) return this.#show(0);
		const view = table.ownerDocument.defaultView;
		const stacked = view?.getComputedStyle?.(table).display === 'block';
		const measured = this.#widths.some(width => width > 0);
		const primary = Math.max(this.#columns.findIndex(column => column.primary), 0);
		const fitting = stacked || !measured ? new Set() : ColumnFit.fit({ available: this.#host.clientWidth, widths: this.#widths, priorities: this.#columns.map(column => column.priority), fixed: primary });
		this.#hidden = fitting;
		this.#mark(this.#revealed ? new Set() : fitting);
		this.#show(fitting.size);
	}

	#mark(hidden) {
		for (const row of this.#table?.rows ?? []) {
			[...row.cells].forEach((cell, index) => cell.toggleAttribute('data-bui-hidden', hidden.has(index)));
		}
	}

	#show(count) {
		this.#toggle.hidden = !count;
		this.#toggle.textContent = this.#revealed ? this.#labels.text('fewer') : this.#labels.text('columns', { count });
		this.#toggle.setAttribute('aria-expanded', String(this.#revealed));
	}
}
