/**
 * The keys of a `Diff`, on its root: on a file's header button ArrowDown and ArrowUp move to the next
 * and previous file's header and Home and End to the first and last (the accordion pattern); anywhere
 * inside, `]` and `[` move to the next and previous hunk header of the open files, and Alt+ArrowDown and
 * Alt+ArrowUp to the next and previous file's header. Keys typed in a field are left to it.
 */
export class DiffKeys {
	#root;

	/** @param {HTMLElement} root the diff's element */
	constructor(root) {
		this.#root = root;
	}

	/** Handles one `keydown`; moves focus and prevents the default when the key is the diff's. */
	handle(event) {
		const target = event.target;
		if (event.ctrlKey || event.metaKey || event.defaultPrevented) return;
		if (target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
		const headers = [...this.#root.querySelectorAll('.bui-diff-toggle')];
		let next = null;
		if (event.altKey) {
			if (event.key === 'ArrowDown') next = DiffKeys.#after(headers, target);
			else if (event.key === 'ArrowUp') next = DiffKeys.#before(headers, target);
			else return;
		} else if (event.key === ']' || event.key === '[') {
			const hunks = [...this.#root.querySelectorAll('.bui-diff-file[data-open] .bui-diff-hunk')];
			next = event.key === ']' ? DiffKeys.#after(hunks, target) : DiffKeys.#before(hunks, target);
		} else if (target.classList?.contains('bui-diff-toggle') && !event.shiftKey) {
			const at = headers.indexOf(target);
			const keys = { ArrowDown: headers[at + 1], ArrowUp: headers[at - 1], Home: headers[0], End: headers.at(-1) };
			if (!(event.key in keys)) return;
			next = keys[event.key] ?? null;
		} else return;
		event.preventDefault();
		next?.focus();
	}

	/** The first item after `node` in document order (a node inside `node` counts as after it). */
	static #after(items, node) {
		return items.find(item => item !== node && node.compareDocumentPosition(item) & 4) ?? null;
	}

	/** The last item before `node` in document order. */
	static #before(items, node) {
		return items.findLast(item => item !== node && node.compareDocumentPosition(item) & 2 && !(item.compareDocumentPosition(node) & 16)) ?? null;
	}
}
