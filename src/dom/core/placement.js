/**
 * Keeps a floating list anchored to its button inside the viewport: on the side its placement asks
 * for (below, or above when `auto` finds no room below and more room above), shifted sideways when an
 * edge of the viewport would cut it, and no taller than the room on its side (it then scrolls). The
 * list carries `bui-menu-above` when it opens above. Shared by every menu of the package.
 */
export class Placement {
	static #margin = 8;
	#placement;

	/** @param {'auto'|'below'|'above'} [placement] */
	constructor(placement = 'auto') {
		this.#placement = ['auto', 'below', 'above'].includes(placement) ? placement : 'auto';
	}

	/**
	 * Places an open list against its anchor
	 *
	 * @param {HTMLElement} list
	 * @param {HTMLElement} anchor
	 */
	place(list, anchor) {
		list.classList.remove('bui-menu-above');
		list.style.removeProperty('max-height');
		list.style.removeProperty('translate');
		const view = list.ownerDocument.defaultView;
		if (!view) return;
		const margin = Placement.#margin;
		const box = anchor.getBoundingClientRect();
		const height = list.getBoundingClientRect().height;
		const below = view.innerHeight - box.bottom - margin;
		const above = box.top - margin;
		const up = this.#placement === 'above' || (this.#placement === 'auto' && height > below && above > below);
		list.classList.toggle('bui-menu-above', up);
		const placed = list.getBoundingClientRect();
		const room = up ? placed.bottom - margin : view.innerHeight - margin - placed.top;
		if (placed.height > room) list.style.maxHeight = `${Math.max(Math.floor(room), 0)}px`;
		const shift = placed.left < margin ? margin - placed.left : placed.right > view.innerWidth - margin ? view.innerWidth - margin - placed.right : 0;
		if (shift) list.style.translate = `${Math.round(shift)}px 0`;
	}
}
