/**
 * The room a floating surface may use (0.15.0): the visual viewport (so a phone's keyboard shrinks it)
 * within the layout viewport, less the page's sticky edges: the family bar and any element a product
 * marks with `data-bui-edge` that sits at the top or the bottom of that room. An edge that holds the
 * anchor is not subtracted, so the bar's own menus keep the room under it.
 */
export class Bounds {
	/** The selector of the page's edges a floating surface never covers. */
	static edges = '.bui-family, [data-bui-edge]';

	/**
	 * @param {Window} view
	 * @param {Element|null} anchor the anchor's element (or a virtual anchor's context element)
	 * @returns {{top: number, left: number, right: number, bottom: number}}
	 */
	static of(view, anchor = null) {
		const document = view.document;
		const width = document.documentElement?.clientWidth || view.innerWidth;
		const height = view.innerHeight;
		const visual = view.visualViewport;
		const room = visual
			? { left: Math.max(0, visual.offsetLeft), top: Math.max(0, visual.offsetTop), right: Math.min(width, visual.offsetLeft + visual.width), bottom: Math.min(height, visual.offsetTop + visual.height) }
			: { left: 0, top: 0, right: width, bottom: height };
		for (const edge of document.querySelectorAll(Bounds.edges)) {
			if (anchor && edge.contains(anchor)) continue;
			const box = edge.getBoundingClientRect();
			if (!box.height || box.bottom <= room.top || box.top >= room.bottom) continue;
			if (box.top <= room.top + 1) room.top = Math.max(room.top, box.bottom);
			else if (box.bottom >= room.bottom - 1) room.bottom = Math.min(room.bottom, box.top);
		}
		return room;
	}

	/**
	 * Whether an anchor is drawn: connected, and not inside something hidden (`display: none`, as a
	 * folded composer's settings, or `visibility: hidden`). A virtual anchor is judged by its context
	 * element.
	 *
	 * @param {Element|{getBoundingClientRect: () => DOMRect, contextElement?: Element}|null} anchor
	 */
	static drawn(anchor) {
		const element = Bounds.element(anchor);
		if (!element?.isConnected) return false;
		if (typeof element.checkVisibility === 'function') return element.checkVisibility({ visibilityProperty: true });
		return element.getClientRects().length > 0;
	}

	/** The element of an anchor: itself, or a virtual anchor's `contextElement`. */
	static element(anchor) {
		if (!anchor) return null;
		if (typeof anchor.nodeType === 'number') return anchor;
		return anchor.contextElement ?? null;
	}

	/** Whether the anchor's box lies wholly outside the room (scrolled away, or under an edge); a box with no size is not judged. */
	static away(box, room) {
		if (!box.width && !box.height) return false;
		return box.bottom <= room.top || box.top >= room.bottom || box.right <= room.left || box.left >= room.right;
	}
}
