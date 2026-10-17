import { el } from './element.js';
import { glyph } from './icons.js';

/**
 * The cue that a row scrolling sideways holds more than it shows (0.15.0, X-15 and PKG-19): at each end
 * where tabs are hidden, a fade with a chevron. Pressing it scrolls the row by most of its width (smoothly
 * unless motion is reduced); it takes no focus and is hidden from assistive technology, since every tab
 * is reached with Tab and scrolled into view. The holder says which ends hold more in `data-more`
 * (`start`, `end` or both), updated on scroll, on a change of size and once fonts load.
 */
export class ScrollEdges {
	#holder;
	#row;
	#start;
	#end;
	#releases = [];

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
		const update = () => this.update();
		row.addEventListener('scroll', update, { passive: true });
		this.#releases.push(() => row.removeEventListener('scroll', update));
		const view = holder.ownerDocument.defaultView;
		if (typeof view?.ResizeObserver === 'function') {
			const observer = new view.ResizeObserver(update);
			observer.observe(row);
			this.#releases.push(() => observer.disconnect());
		}
		holder.ownerDocument.fonts?.ready.then(update, () => {});
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

	destroy() {
		for (const release of this.#releases) release();
		this.#releases = [];
		this.#start.remove();
		this.#end.remove();
	}

	#edge(side, name, direction) {
		const button = el('button', { type: 'button', class: `bui-scroll-edge bui-scroll-edge-${side}`, tabindex: '-1', 'aria-hidden': 'true', hidden: true, onclick: () => this.#move(direction) }, [glyph(name)]);
		return button;
	}

	#move(direction) {
		const view = this.#row.ownerDocument.defaultView;
		const still = view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		const left = direction * Math.max(40, Math.round(this.#row.clientWidth * 0.8));
		if (typeof this.#row.scrollBy === 'function') this.#row.scrollBy({ left, behavior: still ? 'auto' : 'smooth' });
		else this.#row.scrollLeft += left;
		this.update();
	}
}
