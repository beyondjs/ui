/**
 * The picture of a surface that just closed (0.1.5 for disclosures; 0.14.0, D95, for menus and side
 * sheets): the surface itself is hidden at once, so nothing in it can be reached after its `close()`
 * returns, and an inert copy without identifiers, hidden from assistive technology, eases out where it
 * was and removes itself when its movement ends (or after a bound). With reduced motion, or outside the
 * document, there is no picture. A host that removes animations by a preference of its own (the Desktop's
 * `data-motion="reduced"`) gets none either (0.14.1): a picture whose computed animation is `none`, or
 * lasts no time, is removed at once instead of standing still until the bound.
 *
 * A picture keeps the surface's classes, so it looks the same, plus `bui-leaving` (or the class given
 * in place of one); the stylesheet gives it its exit. Whoever made it removes it when the surface opens
 * again or is destroyed (`remove()`), so an open surface never has a copy beside it.
 */
export class Leaving {
	/** Milliseconds after which a picture is removed even without its `animationend`. */
	static bound = 400;

	#picture;
	#timer;

	/**
	 * Shows a picture of `node` leaving, or nothing when nothing should move.
	 *
	 * @param {HTMLElement} node the surface, still drawn
	 * @param {object} [options]
	 * @param {Node|null} [options.host] where the picture goes (the node's parent by default)
	 * @param {string|null} [options.tag] the picture's element, when it differs (a `div` for a `dialog`)
	 * @param {[string, string]|null} [options.swap] a class of the node replaced by another on the picture
	 * @param {boolean} [options.floating] only a surface positioned over the page (absolute or fixed) leaves this way
	 * @param {string|null} [options.veil] the class of a scrim drawn under the picture, which leaves with it (a modal's)
	 * @returns {Leaving|null}
	 */
	static play(node, { host = node.parentNode, tag = null, swap = null, floating = true, veil = null } = {}) {
		const view = node.ownerDocument.defaultView;
		if (!node.isConnected || !host || view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;
		if (floating) {
			const position = view?.getComputedStyle?.(node).position;
			if (position !== 'absolute' && position !== 'fixed') return null;
		}
		const leaving = new Leaving(node, { host, tag, swap, veil });
		if (!Leaving.#still(view, leaving.#picture)) return leaving;
		leaving.remove();
		return null;
	}

	/**
	 * Whether a drawn picture has no movement to end: every computed animation name is `none`, or every
	 * duration is zero. A value an engine does not report (empty) is not taken as still: the bound ends it.
	 */
	static #still(view, picture) {
		const style = view?.getComputedStyle?.(picture);
		const list = value => String(value ?? '').split(',').map(each => each.trim()).filter(Boolean);
		const names = list(style?.animationName);
		if (names.length && names.every(name => name === 'none')) return true;
		const durations = list(style?.animationDuration);
		return durations.length > 0 && durations.every(duration => parseFloat(duration) === 0);
	}

	#veil = null;

	constructor(node, { host, tag, swap, veil = null }) {
		const document = node.ownerDocument;
		let picture = node.cloneNode(true);
		if (tag && tag !== node.localName) {
			const copy = document.createElement(tag);
			copy.className = node.className;
			copy.append(...picture.childNodes);
			picture = copy;
		}
		for (const each of [picture, ...picture.querySelectorAll('[id]')]) each.removeAttribute('id');
		for (const name of ['role', 'hidden', 'open', 'aria-labelledby', 'aria-describedby', 'aria-controls']) picture.removeAttribute(name);
		if (swap) picture.classList.replace(swap[0], swap[1]);
		else picture.classList.add('bui-leaving');
		picture.setAttribute('aria-hidden', 'true');
		picture.inert = true;
		if (veil) {
			this.#veil = document.createElement('div');
			this.#veil.className = veil;
			this.#veil.setAttribute('aria-hidden', 'true');
			host.append(this.#veil);
		}
		host.append(picture);
		// A surface in the top layer (0.15.0, `Floating`) leaves from there, where it was drawn.
		if (picture.hasAttribute('popover') && typeof picture.showPopover === 'function') {
			try {
				picture.showPopover();
			} catch {
				// Not allowed here: it leaves from the page.
			}
		}
		this.#picture = picture;
		picture.addEventListener('animationend', event => event.target === picture && this.remove());
		this.#timer = setTimeout(() => this.remove(), Leaving.bound);
	}

	/** The picture's element, while it is drawn. */
	get element() {
		return this.#picture;
	}

	/** Removes the picture now. */
	remove() {
		clearTimeout(this.#timer);
		this.#picture?.remove();
		this.#veil?.remove();
		this.#picture = null;
		this.#veil = null;
	}
}
