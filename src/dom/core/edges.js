import { el } from './element.js';
import { glyph } from './icons.js';
import { RowClearance } from './clearance.js';

/**
 * The cue that a row scrolling sideways holds more than it shows (0.15.0, X-15 and PKG-19): at each end
 * where tabs are hidden, a fade with a chevron. Pressing it scrolls the row by most of its width (smoothly
 * unless motion is reduced); it takes no focus and is hidden from assistive technology, since every tab
 * is reached with Tab and scrolled into view. The holder says which ends hold more in `data-more`
 * (`start`, `end` or both), updated on scroll, on a change of size and once fonts load.
 *
 * Since 0.36.0 (D179) it also keeps one part of the row whole in view (`reveal`, ProductNav's current
 * tab): clear of both ends, the row's padding and the cues as they are drawn, so no cue ever covers it. It
 * scrolls the row at once and again whenever the row or one of its children changes size (a web font that
 * loads, a narrower window), until the person moves the row themselves.
 */
export class ScrollEdges {
	#holder;
	#row;
	#start;
	#end;
	#releases = [];
	#observer = null;
	#part = null;
	#rest = null;
	#moved = false;

	/**
	 * @param {HTMLElement} holder where the edges are drawn, positioned
	 * @param {HTMLElement} row the element that scrolls sideways
	 */
	constructor(holder, row) {
		this.#holder = holder;
		this.#row = row;
		this.#start = this.#edge('start', 'left', -1);
		this.#end = this.#edge('end', 'right', 1);
		holder.append(this.#start, this.#end);
		const scrolled = () => {
			// The row away from where it was left resting: the person moved it (a swipe, a wheel, Tab to a tab out of view)
			if (this.#rest !== null && Math.abs(this.#row.scrollLeft - this.#rest) > 1) this.#moved = true;
			this.update();
		};
		row.addEventListener('scroll', scrolled, { passive: true });
		this.#releases.push(() => row.removeEventListener('scroll', scrolled));
		const view = holder.ownerDocument.defaultView;
		if (typeof view?.ResizeObserver === 'function') {
			this.#observer = new view.ResizeObserver(() => this.#follow());
			this.#observer.observe(row);
			this.#releases.push(() => this.#observer.disconnect());
		}
		holder.ownerDocument.fonts?.ready.then(() => this.#follow(), () => {});
		this.update();
	}

	/** Which ends hold more: `start`, `end`, both or none. */
	get more() {
		return (this.#holder.dataset.more ?? '').split(' ').filter(Boolean);
	}

	/** Measures the row again. */
	update() {
		const { scrollLeft, scrollWidth, clientWidth } = this.#row;
		const start = Math.abs(scrollLeft) > 1;
		const end = Math.abs(scrollLeft) + clientWidth < scrollWidth - 1;
		const more = [start && 'start', end && 'end'].filter(Boolean).join(' ');
		if (more) this.#holder.dataset.more = more;
		else delete this.#holder.dataset.more;
		this.#start.hidden = !start;
		this.#end.hidden = !end;
	}

	/**
	 * Keeps `part` (one of the row's children, or inside one) whole and clear of both ends: scrolls the row
	 * by whole pixels, never the page, now if the row is in the document and again whenever the row or one
	 * of its children changes size, until the person moves the row (0.36.0). `null` keeps nothing.
	 *
	 * @param {Element|null} part
	 */
	reveal(part) {
		this.#part = part ?? null;
		this.#moved = false;
		if (this.#observer) {
			this.#observer.disconnect();
			for (const node of [this.#row, ...this.#row.children]) this.#observer.observe(node);
		}
		this.#keep();
		this.update();
	}

	destroy() {
		for (const release of this.#releases) release();
		this.#releases = [];
		// A late reveal (tabs given after destroy) observes nothing again
		this.#observer = null;
		this.#part = null;
		this.#start.remove();
		this.#end.remove();
	}

	/** After a change of size or the fonts: the part kept in view again, unless the person moved the row. */
	#follow() {
		if (!this.#moved) this.#keep();
		this.update();
	}

	/**
	 * Rests the row where `RowClearance` says the kept part shows whole. Offsets are measured from the left of
	 * the row's scrolled content, so a right-to-left row (whose `scrollLeft` runs from 0 down) is read alike.
	 */
	#keep() {
		const row = this.#row;
		const part = this.#part;
		if (!part?.isConnected || !row.isConnected) return;
		const style = row.ownerDocument.defaultView.getComputedStyle(row);
		const rtl = style.direction === 'rtl';
		const extent = Math.max(0, row.scrollWidth - row.clientWidth);
		const origin = row.getBoundingClientRect().left + row.clientLeft;
		const now = rtl ? row.scrollLeft + extent : row.scrollLeft;
		const reach = this.#reach(origin, row.clientWidth);
		const clearance = new RowClearance({ width: row.clientWidth, extent, left: { padding: parseFloat(style.paddingLeft), cue: reach.left }, right: { padding: parseFloat(style.paddingRight), cue: reach.right } });
		const box = part.getBoundingClientRect();
		const rest = clearance.rest({ now, start: box.left - origin + now, end: box.right - origin + now, lead: rtl ? 'right' : 'left' });
		if (rest !== now) row.scrollLeft = rest - (rtl ? extent : 0);
		this.#rest = row.scrollLeft;
	}

	/**
	 * How far each cue reaches into the row from the row's left and right edges, measured as it is drawn: a
	 * hidden cue is shown for the measure and hidden again, in the same task, so no frame paints it.
	 */
	#reach(origin, width) {
		const reach = { left: 0, right: 0 };
		for (const cue of [this.#start, this.#end]) {
			const hidden = cue.hidden;
			cue.hidden = false;
			const box = cue.getBoundingClientRect();
			cue.hidden = hidden;
			if (!box.width) continue;
			// A cue drawn on the row's left half covers it from its left edge; one on its right half, from its right edge
			if (box.left + box.right < 2 * origin + width) reach.left = Math.max(reach.left, Math.min(width, box.right - origin));
			else reach.right = Math.max(reach.right, Math.min(width, origin + width - box.left));
		}
		return reach;
	}

	#edge(side, name, direction) {
		const button = el('button', { type: 'button', class: `bui-scroll-edge bui-scroll-edge-${side}`, tabindex: '-1', 'aria-hidden': 'true', hidden: true, onclick: () => this.#move(direction) }, [glyph(name)]);
		return button;
	}

	#move(direction) {
		// Pressing a cue moves the row for the person: their position stays until the tabs change
		this.#moved = true;
		const view = this.#row.ownerDocument.defaultView;
		const still = view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		const left = direction * Math.max(40, Math.round(this.#row.clientWidth * 0.8));
		if (typeof this.#row.scrollBy === 'function') this.#row.scrollBy({ left, behavior: still ? 'auto' : 'smooth' });
		else this.#row.scrollLeft += left;
		this.update();
	}
}
