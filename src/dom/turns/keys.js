/**
 * The keyboard of a `TurnIndex` (0.29.0, D182). Inside the index one mark is in the tab order (a roving
 * tabindex): the one that holds focus, else the turn in view, else the one focused last, else the first;
 * ArrowUp and ArrowDown move to the previous and next turn and Home and End to the first and last,
 * without wrapping, and Enter is each mark's own. From the page, Option+ArrowUp and Option+ArrowDown
 * (Alt elsewhere) move to the previous and next turn (`move(step)`), never while the person writes in a
 * field, works in a dialog or a menu, or when another part already took the key.
 */
export class TurnKeys {
	#list;
	#marks;
	#move;
	#document;
	#stop = null;
	#global = event => this.#page(event);

	/**
	 * @param {HTMLElement} list the element that holds the marks
	 * @param {{marks: () => Array<import('./mark.js').TurnMark>, move: (step: number) => void, page?: boolean}} options
	 *   the marks in their order, a move to the previous (-1) or next (1) turn, and whether the page's keys move too
	 */
	constructor(list, { marks, move, page = true }) {
		this.#list = list;
		this.#marks = marks;
		this.#move = move;
		this.#document = list.ownerDocument;
		list.addEventListener('keydown', event => this.#press(event));
		list.addEventListener('focusin', event => this.#enter(event));
		if (page) this.#document.addEventListener('keydown', this.#global);
	}

	/** The modifier's name on this platform, as the keys are written: ⌥ on Apple's, Alt elsewhere. */
	static modifier(view) {
		const navigator = view?.navigator;
		const platform = navigator?.userAgentData?.platform ?? navigator?.platform ?? '';
		return /mac|iphone|ipad|ipod/i.test(platform) ? '⌥' : 'Alt+';
	}

	/** Makes `mark` the one in the tab order. */
	set stop(mark) {
		this.#stop = mark?.key ?? null;
		this.settle();
	}

	/** Gives the tab order to one mark again, after the marks or the turn in view changed. */
	settle() {
		const marks = this.#marks();
		const active = this.#document.activeElement;
		const stop = marks.find(mark => mark.control === active) ?? marks.find(mark => mark.current) ?? marks.find(mark => mark.key === this.#stop) ?? marks[0] ?? null;
		this.#stop = stop?.key ?? null;
		for (const mark of marks) {
			const index = mark === stop ? '0' : '-1';
			if (mark.control.getAttribute('tabindex') !== index) mark.control.setAttribute('tabindex', index);
		}
	}

	destroy() {
		this.#document.removeEventListener('keydown', this.#global);
	}

	#press(event) {
		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		const marks = this.#marks();
		const index = marks.findIndex(mark => mark.control === event.target);
		const goal = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: marks.length - 1 }[event.key];
		if (index < 0 || goal === undefined) return;
		event.preventDefault();
		const mark = marks[Math.min(Math.max(goal, 0), marks.length - 1)];
		if (mark === marks[index]) return;
		this.#stop = mark.key;
		this.settle();
		mark.focus();
	}

	#enter(event) {
		const mark = this.#marks().find(item => item.control === event.target);
		if (!mark || mark.key === this.#stop) return;
		this.#stop = mark.key;
		this.settle();
	}

	/** Option/Alt with ArrowUp or ArrowDown anywhere on the page, outside what takes those keys itself. */
	#page(event) {
		if (event.defaultPrevented || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		const step = { ArrowUp: -1, ArrowDown: 1 }[event.key];
		if (!step || !this.#list.isConnected || this.#list.closest('[hidden]')) return;
		const target = event.target;
		if (target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"]), dialog, [role="dialog"], [role="menu"], [role="listbox"]') || target?.isContentEditable) return;
		event.preventDefault();
		this.#move(step);
	}
}
