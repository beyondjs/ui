import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Hint } from '../core/hint.js';
import { Focus } from '../core/focus.js';

/**
 * The sidebar's drawer on narrow screens: a modal dialog in the WAI-ARIA sense.
 *
 * It is a native `<dialog>` opened with `showModal()`, so it sits above the family bar whatever the
 * page's stacking, and the browser makes the rest of the page inert; the drawer also marks the
 * siblings on its path to the body `inert` itself and locks the page's scrolling while open. It
 * covers the viewport: a scrim, then the panel at the start edge, which leaves a strip of scrim to
 * press. Focus goes to the current item, and Tab and Shift+Tab cycle through its controls, links
 * included. Escape, a press on the scrim or Close
 * shuts it and returns focus to the button that opened it; choosing a destination shuts it without
 * returning focus, so the product can move focus to its new heading. The panel slides in with
 * `--motion-standard` and appears at once under reduced motion; closing is immediate. Opening adds no
 * history entry.
 */
export class Drawer extends Component {
	#element;
	#body;
	#trigger = null;
	#marked = [];
	#overflow = null;
	#hint;
	#onclose;

	/**
	 * @param {object} options
	 * @param {string} options.title the visible heading, the product's name
	 * @param {string} options.name the accessible name ("Delegate sections")
	 * @param {string} options.close the Close button's name
	 * @param {(chosen: boolean) => void} [options.onclose]
	 */
	constructor({ id, title, name, close, onclose = null }) {
		super();
		this.#onclose = onclose;
		this.#body = el('div', { class: 'bui-drawer-body' });
		const closer = el('button', { type: 'button', class: 'bui-icon-button bui-drawer-close', 'aria-label': close, 'data-bui-hint': true, onclick: () => this.close() }, [glyph('close')]);
		this.#element = el('dialog', { id, class: 'bui-drawer', 'aria-modal': 'true', 'aria-label': name }, [
			el('div', { class: 'bui-drawer-scrim', 'aria-hidden': 'true', onclick: () => this.close() }),
			el('div', { class: 'bui-drawer-panel' }, [el('div', { class: 'bui-drawer-head' }, [el('p', { class: 'bui-drawer-title', text: title }), closer]), this.#body])
		]);
		this.#element.addEventListener('keydown', event => this.#keys(event));
		this.#element.addEventListener('cancel', event => {
			event.preventDefault();
			this.close();
		});
		this.#hint = new Hint(this.#element);
	}

	get element() {
		return this.#element;
	}

	get shown() {
		return this.#element.open;
	}

	/** Replaces the drawer's content. */
	fill(node) {
		this.#body.replaceChildren(node);
	}

	/** Opens over the page and moves focus to the current item; `trigger` gets focus back on dismissal. */
	open(trigger) {
		if (this.shown || this.destroyed || !this.#element.isConnected) return;
		this.#trigger = trigger;
		const document = this.#element.ownerDocument;
		this.#element.showModal();
		this.#mark();
		this.#overflow = document.documentElement.style.overflow;
		document.documentElement.style.overflow = 'hidden';
		// The current item, unless a search shows its results in the groups' place (0.10.0)
		const current = [...this.#body.querySelectorAll('[aria-current="page"]')].find(node => !node.closest('[hidden]'));
		const target = current?.matches('a[href]') ? current : (new Focus(this.#body).targets[0] ?? this.#element.querySelector('.bui-drawer-close'));
		target.focus({ preventScroll: true });
	}

	/**
	 * Closes the drawer. `refocus` (the default) returns focus to the button that opened it; a chosen
	 * destination and a resize past the cut close it without that.
	 */
	close({ refocus = true } = {}) {
		if (!this.shown) return;
		const document = this.#element.ownerDocument;
		this.#element.close();
		for (const node of this.#marked) node.removeAttribute('inert');
		this.#marked = [];
		document.documentElement.style.overflow = this.#overflow ?? '';
		this.#overflow = null;
		if (refocus && this.#trigger?.isConnected) this.#trigger.focus({ preventScroll: true });
		this.#onclose?.(!refocus);
	}

	destroy() {
		this.close({ refocus: false });
		this.#hint.destroy();
		super.destroy();
	}

	/** Marks every sibling on the path from the drawer to the body inert, leaving those already inert alone. */
	#mark() {
		let node = this.#element;
		while (node && node !== node.ownerDocument.body && node.parentElement) {
			for (const sibling of node.parentElement.children) {
				if (sibling === node || sibling.hasAttribute('inert') || sibling.tagName === 'SCRIPT') continue;
				sibling.setAttribute('inert', '');
				this.#marked.push(sibling);
			}
			node = node.parentElement;
		}
	}

	#keys(event) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			this.close();
		} else if (event.key === 'Tab') this.#cycle(event);
	}

	/**
	 * Moves focus to the next or previous control itself, wrapping at the ends: WebKit's Tab skips
	 * links by default, which would leave a drawer of links for the page behind it.
	 */
	#cycle(event) {
		const targets = new Focus(this.#element).targets;
		event.preventDefault();
		if (!targets.length) return;
		const index = targets.indexOf(this.#element.ownerDocument.activeElement);
		const next = event.shiftKey ? (index <= 0 ? targets.length - 1 : index - 1) : (index + 1) % targets.length;
		targets[next].focus({ preventScroll: true });
	}
}
