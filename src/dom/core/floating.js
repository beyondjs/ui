import { Bounds } from './bounds.js';

/**
 * Places a floating surface (a menu, a list of suggestions, a popover panel, a tooltip) against its
 * anchor (0.15.0, the audit's DQ-01 and OWN-21): the one positioning primitive every floating part of
 * the package uses.
 *
 * - **Top layer.** Where the browser has the popover API the surface becomes a manual popover while it
 *   is open, so no scrolling ancestor clips it and no stacking order covers it; it stays where it is in
 *   the document, so its events, its styles and `contains()` keep working. Elsewhere it is `fixed` above
 *   the page, measured against its own containing block.
 * - **Anchor.** An element, or a virtual anchor `{ getBoundingClientRect(), contextElement }` such as
 *   the caret of a field.
 * - **Flip, shift and size.** It opens on its preferred side (`below`, or `above`; `auto` is below) and
 *   flips when that side has no room for it and the other has more; it is shifted along the anchor to
 *   stay inside the room and capped to the room on its side (it then scrolls). The room is the visual
 *   viewport less the page's sticky edges (`Bounds`), so it never slides under the family bar and a
 *   phone's keyboard shrinks it.
 * - **Updates.** While open it is placed again on scroll (any scroller), resize, a change of the visual
 *   viewport and a change of its own or its anchor's size, once per frame. An anchor scrolled out of the
 *   room hides the surface (`data-bui-away`) until it comes back.
 * - **A hidden anchor.** `open()` refuses an anchor that is not drawn (inside `display: none`, as a
 *   folded composer's settings): it returns false and dispatches a cancelable `bui-refused` event from
 *   the anchor, `detail: { reason: 'hidden', retry }`. A container that can show the anchor (the
 *   composer's Options) cancels it, shows the anchor and calls `retry()`; when nobody does, a console
 *   warning says why nothing opened.
 *
 * The surface carries `data-bui-floating` and `data-bui-side` (`below` or `above`), the class
 * `aboveClass` names while above, and `--bui-anchor-width`, the anchor's width, for a list as wide as
 * its button.
 */
export class Floating {
	/** Distance kept from the room's edges, in CSS pixels. */
	static margin = 8;
	/** Distance between the anchor and the surface. */
	static gap = 4;

	#element;
	#anchor;
	#side;
	#align;
	#gap;
	#above;
	#open = false;
	#releases = [];
	#frame = 0;
	#retrying = false;
	#onretry = null;
	#quiet;

	/**
	 * @param {HTMLElement} element the surface, hidden while closed
	 * @param {object} options
	 * @param {Element|{getBoundingClientRect: () => DOMRect, contextElement?: Element}} options.anchor
	 * @param {'auto'|'below'|'above'} [options.placement] the preferred side; it flips when that side has no room
	 * @param {'start'|'end'|'center'} [options.align] which edge of the anchor it lines up with
	 * @param {number} [options.gap] distance from the anchor
	 * @param {string|null} [options.above] the class the surface carries while above its anchor
	 * @param {boolean} [options.quiet] a refusal says nothing (a tooltip, whose trigger hides with it)
	 */
	constructor(element, { anchor, placement = 'auto', align = 'start', gap = Floating.gap, above = null, quiet = false }) {
		this.#element = element;
		this.#anchor = anchor;
		this.#side = placement === 'above' ? 'above' : 'below';
		this.#align = ['start', 'end', 'center'].includes(align) ? align : 'start';
		this.#gap = gap;
		this.#above = above;
		this.#quiet = quiet;
	}

	/** Whether the browser puts the surface in the top layer. */
	static get top() {
		return typeof globalThis.HTMLElement === 'function' && typeof globalThis.HTMLElement.prototype.showPopover === 'function';
	}

	get element() {
		return this.#element;
	}

	get anchor() {
		return this.#anchor;
	}

	/** A new anchor, used from the next placement (a caret that moved). */
	set anchor(anchor) {
		this.#anchor = anchor;
		if (this.#open) this.place();
	}

	get open() {
		return this.#open;
	}

	/** The side it is drawn on: `below` or `above`. */
	get side() {
		return this.#element.dataset.buiSide ?? this.#side;
	}

	/**
	 * Shows the surface against its anchor; false, and nothing shown, when the anchor is not drawn.
	 * The caller unhides the surface first (`hidden = false`).
	 */
	show() {
		if (this.#open) return this.place(), true;
		if (!Bounds.drawn(this.#anchor)) return this.#refuse();
		this.#open = true;
		const element = this.#element;
		element.setAttribute('data-bui-floating', '');
		if (typeof element.showPopover === 'function' && element.isConnected) {
			element.setAttribute('popover', 'manual');
			try {
				element.showPopover();
			} catch {
				// Already shown, or not allowed here: it stays fixed above the page.
			}
		}
		this.place();
		this.#watch();
		return true;
	}

	/** Hides the surface from the top layer and stops following the anchor; the caller hides it. */
	hide() {
		if (!this.#open) return;
		this.#open = false;
		for (const release of this.#releases) release();
		this.#releases = [];
		const view = this.#element.ownerDocument.defaultView;
		if (this.#frame) view?.cancelAnimationFrame?.(this.#frame);
		this.#frame = 0;
		if (Floating.#shown(this.#element)) {
			try {
				this.#element.hidePopover();
			} catch {
				// Removed from the document meanwhile.
			}
		}
		this.#element.removeAttribute('data-bui-away');
	}

	destroy() {
		this.hide();
	}

	/** Places the surface now: side, height, width and position. */
	place() {
		const element = this.#element;
		const view = element.ownerDocument.defaultView;
		if (!view || !element.isConnected) return;
		const anchor = this.#anchor.getBoundingClientRect();
		const room = Bounds.of(view, Bounds.element(this.#anchor));
		const style = element.style;
		const scrolled = element.scrollTop;
		for (const name of ['max-height', 'max-width']) style.removeProperty(name);
		style.removeProperty('translate');
		Object.assign(style, { left: '0px', top: '0px', right: 'auto', bottom: 'auto' });
		style.setProperty('--bui-anchor-width', `${Math.round(anchor.width)}px`);
		const own = element.getBoundingClientRect();
		const margin = Floating.margin;
		const below = room.bottom - margin - anchor.bottom - this.#gap;
		const above = anchor.top - this.#gap - room.top - margin;
		let side = this.#side;
		if (side === 'below' && own.height > below && above > below) side = 'above';
		else if (side === 'above' && own.height > above && below > above) side = 'below';
		const space = Math.max(0, side === 'below' ? below : above);
		const height = Math.min(own.height, space);
		if (own.height > space) style.maxHeight = `${Math.floor(space)}px`;
		const span = Math.max(0, room.right - room.left - 2 * margin);
		const width = Math.min(own.width, span);
		if (own.width > span) style.maxWidth = `${Math.floor(span)}px`;
		const start = { start: anchor.left, end: anchor.right - width, center: anchor.left + anchor.width / 2 - width / 2 }[this.#align];
		const left = Math.min(Math.max(start, room.left + margin), room.right - margin - width);
		const top = side === 'below' ? anchor.bottom + this.#gap : anchor.top - this.#gap - height;
		const origin = this.#origin(view);
		style.left = `${Math.round(left - origin.left)}px`;
		style.top = `${Math.round(top - origin.top)}px`;
		element.dataset.buiSide = side;
		if (this.#above) element.classList.toggle(this.#above, side === 'above');
		element.toggleAttribute('data-bui-away', Bounds.away(anchor, room));
		if (scrolled) element.scrollTop = scrolled;
	}

	/**
	 * Where the surface's containing block starts: the viewport in the top layer; outside it a `fixed`
	 * box inside a container (a `Page`'s container query) or a transformed ancestor starts there.
	 */
	#origin(view) {
		const element = this.#element;
		if (Floating.#shown(element) || !element.parentNode) return { left: 0, top: 0 };
		const probe = element.ownerDocument.createElement('span');
		Object.assign(probe.style, { position: 'fixed', left: '0px', top: '0px', width: '0px', height: '0px', visibility: 'hidden' });
		element.parentNode.insertBefore(probe, element);
		const box = probe.getBoundingClientRect();
		probe.remove();
		return view ? { left: box.left, top: box.top } : { left: 0, top: 0 };
	}

	/** Places it again on scroll, resize, the visual viewport and a change of size, once per frame. */
	#watch() {
		const view = this.#element.ownerDocument.defaultView;
		if (!view) return;
		// The surface's own scrolling (a long list) never moves it
		const schedule = event => {
			if (this.#frame || !this.#open || (event?.type === 'scroll' && event.target instanceof view.Node && this.#element.contains(event.target))) return;
			const frame = view.requestAnimationFrame ?? (work => view.setTimeout(work, 16));
			this.#frame = frame(() => {
				this.#frame = 0;
				if (this.#open) this.place();
			});
		};
		const on = (target, type, options) => {
			if (!target?.addEventListener) return;
			target.addEventListener(type, schedule, options);
			this.#releases.push(() => target.removeEventListener(type, schedule, options));
		};
		on(view, 'resize');
		on(view.document, 'scroll', { capture: true, passive: true });
		on(view.visualViewport, 'resize');
		on(view.visualViewport, 'scroll');
		if (typeof view.ResizeObserver === 'function') {
			const observer = new view.ResizeObserver(schedule);
			const anchor = Bounds.element(this.#anchor);
			if (anchor) observer.observe(anchor);
			observer.observe(this.#element);
			this.#releases.push(() => observer.disconnect());
		}
	}

	/** Whether the surface is an open popover (an engine without the pseudo-class answers no). */
	static #shown(element) {
		try {
			return element.matches(':popover-open');
		} catch {
			return false;
		}
	}

	/** Says why nothing opened; a container that shows the anchor cancels this and retries. */
	#refuse() {
		if (this.#quiet) return false;
		const target = Bounds.element(this.#anchor);
		const event = new (target?.ownerDocument?.defaultView?.CustomEvent ?? CustomEvent)('bui-refused', { bubbles: true, cancelable: true, detail: { reason: 'hidden', retry: () => this.#retry() } });
		const handled = target?.isConnected ? !target.dispatchEvent(event) : false;
		if (!handled && !this.#retrying) console.warn('@beyond-js/ui: a floating surface was not opened because its anchor is not drawn (display: none or disconnected).');
		return false;
	}

	#retry() {
		this.#retrying = true;
		try {
			return this.#onretry?.() ?? false;
		} finally {
			this.#retrying = false;
		}
	}

	/** What `retry()` of a refusal runs: the owning component's own `open()`. */
	set retry(work) {
		this.#onretry = typeof work === 'function' ? work : null;
	}
}
