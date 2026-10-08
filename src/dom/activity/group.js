import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { KeyedList } from '../core/keyed.js';
import { ActivityHead } from './head.js';
import { activity as copy } from './labels.js';

// The state a group shows is the one that matters most among its rows.
const precedence = ['running', 'failed', 'denied', 'waiting', 'done'];

/**
 * Consecutive activity rows folded into one ("Read 3 files"): a disclosure row whose head carries the
 * group's glyph, its title (a string, or a function of the number of rows, so the product writes its
 * own plural) and the state that matters most among its rows (running, then failed, denied, waiting,
 * done), and whose body lists the rows, each still a row of its own.
 *
 * The group holds the `ActivityRow`s given to it (`rows`, `add`) and follows their updates; setting
 * `rows` keeps the rows that stay, with their open state and focus, destroys the ones that leave and
 * places the new ones. `remove(row)` takes one out without destroying it. Destroying the group
 * destroys the rows it holds.
 */
export class ActivityGroup extends Component {
	/** The copy in English and Spanish (the rows' words). */
	static labels = copy;

	#element;
	#head;
	#list;
	#order;
	#title;
	#rows = [];
	#items = new Map();
	#open = false;

	/**
	 * @param {object} options
	 * @param {string} [options.glyph] a name of the icon catalog (default `layers`)
	 * @param {string|((count: number) => string)} options.title what the rows did, such as `count => \`Read ${count} files\``
	 * @param {string|Node|null} [options.meta] words after the title
	 * @param {import('./row.js').ActivityRow[]} [options.rows]
	 * @param {boolean} [options.open]
	 */
	constructor({ glyph = 'layers', title, meta = null, rows = [], open = false, labels = {} }) {
		super();
		const id = Ids.next('bui-activity-group');
		this.#head = new ActivityHead({ controls: id, labels: new Labels(copy.en, labels) });
		this.#head.element.addEventListener('click', () => this.toggle());
		this.#list = el('ul', { id, class: 'bui-activity-list', hidden: true });
		this.#order = new KeyedList(this.#list);
		this.#element = el('div', { class: 'bui-activity bui-activity-group' }, [this.#head.element, this.#list]);
		this.#head.glyph = glyph;
		this.#head.meta = meta;
		this.#title = title;
		this.rows = rows;
		if (open) this.open();
	}

	get element() {
		return this.#element;
	}

	get rows() {
		return [...this.#rows];
	}

	/** Replaces the rows: those that stay keep their place in focus, those that leave are destroyed. */
	set rows(rows) {
		const next = [...new Set((rows ?? []).filter(Boolean))];
		const leaving = this.#rows.filter(row => !next.includes(row));
		this.#rows = next;
		// Ordered first, so focus in a row that leaves moves to the row now at its place
		this.#order.order(next.map(row => this.#item(row)));
		for (const row of leaving) this.#forget(row).destroy();
		this.#paint();
	}

	/** The state that matters most among the rows. */
	get state() {
		return precedence.find(state => this.#rows.some(row => row.state === state)) ?? 'done';
	}

	get expanded() {
		return this.#open;
	}

	/** Adds a row at the end. */
	add(row) {
		if (!row || this.#rows.includes(row)) return this;
		this.#rows.push(row);
		this.#list.append(this.#item(row));
		this.#paint();
		return this;
	}

	/** Takes a row out of the group without destroying it, and returns it. */
	remove(row) {
		if (!this.#rows.includes(row)) return row;
		this.#rows = this.#rows.filter(item => item !== row);
		this.#forget(row).element.remove();
		this.#paint();
		return row;
	}

	/** Changes the group's `glyph`, `title` or `meta`. */
	update(values = {}) {
		if (Object.hasOwn(values, 'glyph')) this.#head.glyph = values.glyph;
		if (Object.hasOwn(values, 'meta')) this.#head.meta = values.meta;
		if (Object.hasOwn(values, 'title')) this.#title = values.title;
		this.#paint();
		return this;
	}

	open() {
		if (this.#open || this.destroyed) return;
		this.#open = true;
		this.#list.hidden = false;
		this.#head.expanded = true;
	}

	/** Closes the list; focus inside it goes back to the group's button. */
	close() {
		if (!this.#open) return;
		const inside = this.#list.contains(this.#element.ownerDocument.activeElement);
		this.#open = false;
		this.#list.hidden = true;
		this.#head.expanded = false;
		if (inside) this.#head.element.focus({ preventScroll: true });
	}

	toggle() {
		if (this.#open) this.close();
		else this.open();
	}

	destroy() {
		for (const row of this.#rows) this.#forget(row).destroy();
		this.#rows = [];
		this.#head.destroy();
		super.destroy();
	}

	/** The list item of a row, made once, following the row's updates. */
	#item(row) {
		let entry = this.#items.get(row);
		if (!entry) {
			entry = { node: el('li', { class: 'bui-activity-item' }, [row.element]), release: row.watch(() => this.#paint()) };
			this.#items.set(row, entry);
		}
		return entry.node;
	}

	#forget(row) {
		const entry = this.#items.get(row);
		entry?.release();
		entry?.node.remove();
		this.#items.delete(row);
		return row;
	}

	#paint() {
		if (this.destroyed) return;
		const count = this.#rows.length;
		this.#head.title = typeof this.#title === 'function' ? this.#title(count) : (this.#title ?? '');
		this.#head.state = this.state;
		this.#element.dataset.state = this.state;
	}
}
