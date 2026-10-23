/**
 * The arrow keys of a list of the family's rows (0.20.5, the list rule L7): Up and Down move between the
 * rows' names, Home and End reach the first and the last, and Enter opens the one in focus as its link
 * does. Tab still leaves the list; keys with a modifier keep their own meaning. A list a product draws
 * itself attaches it to the element that holds its rows; `Collection`'s list presentation does it.
 */
export class RowKeys {
	static KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

	#list;
	#key = event => this.#move(event);

	/** @param {HTMLElement} list The element that holds the rows */
	constructor(list) {
		this.#list = list;
		list.addEventListener('keydown', this.#key);
	}

	/** Puts the focus on the first row's name; false when there is none. */
	first() {
		const name = this.#names()[0];
		name?.focus();
		return Boolean(name);
	}

	#names() {
		return [...this.#list.querySelectorAll('.bui-row-title')].filter(name => name.localName !== 'span');
	}

	#move(event) {
		if (!RowKeys.KEYS.includes(event.key) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		const names = this.#names();
		const index = names.indexOf(event.target);
		if (index < 0) return;
		event.preventDefault();
		const next = { ArrowDown: Math.min(index + 1, names.length - 1), ArrowUp: Math.max(index - 1, 0), Home: 0, End: names.length - 1 }[event.key];
		names[next].focus();
	}

	destroy() {
		this.#list.removeEventListener('keydown', this.#key);
	}
}
