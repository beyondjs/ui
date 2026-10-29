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
 * Focus inside one container: the first sensible target and Tab kept inside it.
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

	/** Keeps Tab inside, moving focus itself so WebKit's Tab, which skips buttons, checkboxes and links by default, never leaves for the page behind. */
	cycle(event) {
		const targets = Focus.#stops(this.targets);
		event.preventDefault();
		if (!targets.length) return;
		const document = this.#container.ownerDocument;
		const step = event.shiftKey ? -1 : 1;
		let index = this.#place(targets, document.activeElement, step);
		// A target that does not take focus (not rendered, or refused by the engine) is passed over (0.7.4)
		for (let tried = 0; tried < targets.length; tried++) {
			index = (index + step + targets.length) % targets.length;
			targets[index].focus({ preventScroll: true });
			if (document.activeElement !== targets[index]) continue;
			// Into view inside a scrolling body, as the browser's own Tab brings it, and no further (0.45.1)
			targets[index].scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
			return;
		}
	}

	/** A named radio group is one stop, as the browser's own Tab makes it: its checked radio, or its first (0.45.1). */
	static #stops(targets) {
		const radio = node => node.tagName === 'INPUT' && node.type === 'radio' && node.name;
		const group = node => targets.filter(other => radio(other) && other.name === node.name && other.form === node.form);
		return targets.filter(node => {
			if (!radio(node)) return true;
			const members = group(node);
			return node === (members.find(member => member.checked) ?? members[0]);
		});
	}

	/**
	 * Where Tab starts from: the active target, or for an element inside that is not one (a menu's
	 * option) the place just before the next target after it in document order (0.7.4).
	 */
	#place(targets, active, step) {
		const index = targets.indexOf(active);
		if (index >= 0) return index;
		if (!active || !this.#container.contains(active)) return step > 0 ? -1 : 0;
		const after = targets.findIndex(node => active.compareDocumentPosition(node) & 4);
		const next = after < 0 ? targets.length : after;
		return step > 0 ? next - 1 : next;
	}

}
