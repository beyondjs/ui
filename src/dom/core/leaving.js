/**
 * The picture of a surface that just closed (0.1.5 for disclosures; 0.14.0, D95, for menus and side
 * sheets): the surface itself is hidden at once, so nothing in it can be reached after its `close()`
 * returns, and an inert copy without identifiers, hidden from assistive technology, eases out where it
 * was and removes itself when its movement ends (or after a bound). With reduced motion, or outside the
 * document, there is no picture.
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
		return new Leaving(node, { host, tag, swap, veil });
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
