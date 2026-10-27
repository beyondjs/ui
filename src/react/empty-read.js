/**
 * React `Collection`'s empty state as the DOM `Collection` reads it on each draw (0.44.0): its title and
 * sentence from the latest props, and its one action either `{ label, href, onSelect }`, drawn as
 * `EmptyState`'s primary action with `onSelect` read when it is pressed, or React content, rendered into a
 * holder through the adapter's portals.
 */
export class EmptyRead {
	#latest;
	#cells;

	/**
	 * @param {{ current: { empty: object|null } }} latest the adapter's latest props
	 * @param {{ current: Array<{ holder: HTMLElement, content: unknown }> }} cells the portals the next render places
	 */
	constructor(latest, cells) {
		this.#latest = latest;
		this.#cells = cells;
	}

	get title() { return this.#given?.title; }
	get body() { return this.#given?.body ?? this.#given?.text; }

	get action() {
		const action = this.#given?.action ?? null;
		if (!action) return null;
		if (EmptyRead.#plain(action)) return { label: action.label, href: action.href ?? null, run: action.href ? null : event => this.#latest.current.empty?.action?.onSelect?.(event) };
		const holder = document.createElement('span');
		holder.className = 'bui-host';
		this.#cells.current.push({ holder, content: action });
		return holder;
	}

	get #given() { return this.#latest.current.empty; }

	/** An action given as words and a destination, not React content */
	static #plain(action) {
		return typeof action === 'object' && typeof action.label === 'string' && !('$$typeof' in action);
	}
}
