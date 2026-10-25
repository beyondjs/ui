import { el, fill } from '../core/element.js';

/**
 * A page's dock (0.14.0, D94): what a thread docks at the bottom edge, such as its composer. It is the
 * last block of the `thread` template's main column, pushed to the column's end (`margin-top: auto`)
 * and sticky at the bottom of the window with one gutter and the safe area under it, so its distance to
 * the window's bottom is the same at the top, the middle and the end of the scroll and on a short or an
 * empty page. Its children sit at the thread's lane (`--layout-lane`, D96).
 *
 * A hairline above it is drawn only while content passes beneath it: an end mark after the dock is
 * watched with an `IntersectionObserver` (no scroll handler), and while that mark is out of view the
 * dock is lifted from its place in the flow (`data-stuck`). Without an observer it never draws one.
 *
 * Since 0.34.0 (D187; WCAG 2.4.11) its height is measured (`ResizeObserver`) into the document's
 * `--bui-page-dock`, so what the keyboard reaches or the page scrolls to lands above the dock and its fade,
 * never under them (`scroll-padding-bottom`, thread.css), however tall the composer grows.
 */
export class PageDock {
	#element;
	#end;
	#observer = null;
	#size = null;

	/** @param {{element?: HTMLElement|null, end?: HTMLElement|null}} [options] the dock and its end mark, when a renderer (React) draws them */
	constructor({ element = null, end = null } = {}) {
		this.#element = element ?? el('div', { class: 'bui-page-dock' });
		this.#end = end ?? el('div', { class: 'bui-page-dock-end', 'aria-hidden': 'true' });
		this.#watch();
	}

	/** The dock. */
	get element() {
		return this.#element;
	}

	/** The end mark, placed right after the dock. */
	get end() {
		return this.#end;
	}

	/** Whether content passes beneath the dock now. */
	get stuck() {
		return this.#element.hasAttribute('data-stuck');
	}

	/** Replaces what is docked (nodes or components); null or an empty list leaves an empty dock. */
	set content(children) {
		fill(this.#element, [].concat(children ?? []).filter(Boolean).map(child => child.element ?? child));
	}

	destroy() {
		this.#observer?.disconnect();
		this.#observer = null;
		this.#size?.disconnect();
		this.#size = null;
		this.#element.ownerDocument.documentElement.style.removeProperty('--bui-page-dock');
	}

	#watch() {
		const view = this.#element.ownerDocument.defaultView;
		if (!view?.IntersectionObserver) return;
		this.#observer = new view.IntersectionObserver(entries => {
			const entry = entries.at(-1);
			if (entry) this.#element.toggleAttribute('data-stuck', !entry.isIntersecting);
		});
		this.#observer.observe(this.#end);
		if (!view.ResizeObserver) return;
		this.#size = new view.ResizeObserver(() => this.#measure());
		this.#size.observe(this.#element);
	}

	#measure() {
		const height = Math.ceil(this.#element.getBoundingClientRect().height);
		this.#element.ownerDocument.documentElement.style.setProperty('--bui-page-dock', `${height}px`);
	}
}
