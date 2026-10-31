/**
 * The arrow keys of a sidebar's search results (unreleased, after 0.46.0; the list rule L7 as a search reaches its
 * results): Down from the field reaches the first result; Up and Down move between the results' links, "See all
 * results" last, and Home and End reach the first and the last; Up from the first returns to the field. Enter
 * follows the link in focus, as a link does, and Tab still leaves. Keys with a modifier keep their own meaning, and
 * the field keeps every key but Down, so its caret still moves.
 */
export class SidebarResultKeys {
	static KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

	#input;
	#results;
	#key = event => this.#move(event);

	/**
	 * @param {object} options
	 * @param {HTMLInputElement} options.input the search field
	 * @param {HTMLElement} options.results the element that holds the results
	 */
	constructor({ input, results }) {
		this.#input = input;
		this.#results = results;
		input.addEventListener('keydown', this.#key);
		results.addEventListener('keydown', this.#key);
	}

	destroy() {
		this.#input.removeEventListener('keydown', this.#key);
		this.#results.removeEventListener('keydown', this.#key);
	}

	#links() {
		return this.#results.hidden ? [] : [...this.#results.querySelectorAll('a[href]')];
	}

	#move(event) {
		if (!SidebarResultKeys.KEYS.includes(event.key) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		const links = this.#links();
		if (event.target === this.#input) {
			if (event.key !== 'ArrowDown' || !links.length) return;
			event.preventDefault();
			links[0].focus();
			return;
		}
		const index = links.indexOf(event.target);
		if (index < 0) return;
		event.preventDefault();
		if (event.key === 'ArrowUp' && index === 0) return this.#input.focus();
		const next = { ArrowDown: Math.min(index + 1, links.length - 1), ArrowUp: index - 1, Home: 0, End: links.length - 1 }[event.key];
		links[next].focus();
	}
}
