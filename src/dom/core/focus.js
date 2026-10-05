const selector = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])',
	// A disclosure's summary takes focus natively, so technical details can be opened by keyboard (0.7.4)
	'details > summary'
].join(',');

/**
 * Focus inside one container: the first sensible target and wrapping Tab at its edges.
 */
export class Focus {
	#container;

	constructor(container) {
		this.#container = container;
	}

	/**
	 * Focusable elements that are rendered: not hidden, inert, a collection's hidden column
	 * (`[data-bui-hidden]`) or inside a closed `<details>` other than its summary (0.7.4).
	 */
	get targets() {
		return [...this.#container.querySelectorAll(selector)].filter(node => !node.closest('[hidden]') && !node.closest('[inert]') && !node.closest('[data-bui-hidden]') && !Focus.#folded(node));
	}

	static #folded(node) {
		const details = node.closest('details:not([open])');
		return Boolean(details) && node.closest('summary')?.parentElement !== details;
	}

	/** Focuses `[data-autofocus]`, the first field, the first other target or `fallback`. */
	first(fallback = null) {
		const chosen =
			this.#container.querySelector('[data-autofocus]') ??
			this.targets.find(node => /^(INPUT|SELECT|TEXTAREA)$/.test(node.tagName)) ??
			this.targets.find(node => node !== fallback) ??
			fallback;
		chosen?.focus();
		return chosen;
	}

	/** Keeps Tab and Shift+Tab inside the container. */
	wrap(event) {
		const targets = this.targets;
		if (!targets.length) {
			event.preventDefault();
			return;
		}
		const active = this.#container.ownerDocument.activeElement;
		const [first, last] = [targets[0], targets.at(-1)];
		if (event.shiftKey && (active === first || !this.#container.contains(active))) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && (active === last || !this.#container.contains(active))) {
			event.preventDefault();
			first.focus();
		}
	}
}
