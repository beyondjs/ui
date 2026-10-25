/**
 * A row of tabs laid out by hand for happy-dom, which has no layout. The row has a width, a padding and a
 * scroll; each tab's box follows from its words' width (`widths`, by label) and the gap between tabs; each
 * end's cue is drawn at its end and has no box while hidden, as a browser draws `display: none`. Every box
 * follows the row's `scrollLeft` as a browser's would, left to right or right to left (where `scrollLeft`
 * runs from 0 down). `install()` patches the window's element boxes and its `ResizeObserver`, whose
 * callbacks `resize()` delivers as a browser does after a layout; `uninstall()` restores both.
 */
export class RowStage {
	#window;
	#left;
	#width;
	#padding;
	#gap;
	#cue;
	#widths;
	#rtl;
	#row = null;
	#scroll = 0;
	#saved = null;
	#observers = [];

	/**
	 * @param {Window} window the happy-dom window
	 * @param {{left?: number, width?: number, padding?: number, gap?: number, cue?: number, widths?: Record<string, number>, rtl?: boolean}} [layout]
	 */
	constructor(window, { left = 16, width = 358, padding = 0, gap = 4, cue = 32, widths = {}, rtl = false } = {}) {
		this.#window = window;
		this.#left = left;
		this.#width = width;
		this.#padding = padding;
		this.#gap = gap;
		this.#cue = cue;
		this.#widths = { ...widths };
		this.#rtl = rtl;
	}

	/** Patches the window's element boxes and its ResizeObserver for this stage; returns the stage. */
	install() {
		const stage = this;
		const prototype = this.#window.Element.prototype;
		this.#saved = { box: prototype.getBoundingClientRect, observer: this.#window.ResizeObserver };
		prototype.getBoundingClientRect = function () {
			return stage.#box(this) ?? stage.#saved.box.call(this);
		};
		this.#window.ResizeObserver = class {
			constructor(callback) {
				stage.#observers.push(callback);
			}
			observe() {}
			unobserve() {}
			disconnect() {}
		};
		return this;
	}

	/** Restores the window's own boxes and ResizeObserver. */
	uninstall() {
		if (!this.#saved) return;
		this.#window.Element.prototype.getBoundingClientRect = this.#saved.box;
		this.#window.ResizeObserver = this.#saved.observer;
		this.#saved = null;
	}

	/** Lays out `row`, a nav's `.bui-productnav-list`: its width, padding, direction, scroll and scroll width. */
	hold(row) {
		this.#row = row;
		row.style.padding = `0 ${this.#padding}px`;
		if (this.#rtl) row.style.direction = 'rtl';
		Object.defineProperties(row, {
			clientWidth: { get: () => this.#width, configurable: true },
			scrollWidth: { get: () => this.#content, configurable: true },
			scrollLeft: { get: () => this.#scroll, set: value => (this.#scroll = this.#clamp(value)), configurable: true },
			// A cue's press scrolls by: at once here, then the scroll event a browser sends
			scrollBy: { value: ({ left = 0 } = {}) => this.move(this.#scroll + left), configurable: true }
		});
		return this;
	}

	/** Where the row rests, as `scrollLeft`. */
	get scroll() {
		return this.#scroll;
	}

	/** The words' widths change, as they do when a web font loads. */
	set widths(widths) {
		this.#widths = { ...this.#widths, ...widths };
		this.#scroll = this.#clamp(this.#scroll);
	}

	/** Delivers a change of size to every ResizeObserver, as a browser does after a layout. */
	resize() {
		for (const callback of this.#observers) callback([]);
	}

	/** The person moves the row (a swipe, a wheel): its scroll changes and a scroll event follows. */
	move(left) {
		this.#scroll = this.#clamp(left);
		this.#row.dispatchEvent(new this.#window.Event('scroll'));
	}

	/** A tab's box, by its label, and each cue's, from the patched `getBoundingClientRect`. */
	measure(label) {
		const tab = [...this.#row.querySelectorAll('a')].find(link => link.textContent === label);
		const cue = side => this.#row.parentElement.querySelector(`.bui-scroll-edge-${side}`);
		return { tab: tab.getBoundingClientRect(), start: cue('start').getBoundingClientRect(), end: cue('end').getBoundingClientRect() };
	}

	get #content() {
		const tabs = this.#row ? [...this.#row.children] : [];
		return 2 * this.#padding + tabs.reduce((sum, tab) => sum + this.#of(tab), 0) + this.#gap * Math.max(0, tabs.length - 1);
	}

	get #extent() {
		return Math.max(0, this.#content - this.#width);
	}

	#clamp(value) {
		return this.#rtl ? Math.min(0, Math.max(-this.#extent, value)) : Math.max(0, Math.min(this.#extent, value));
	}

	#of(tab) {
		return this.#widths[tab.textContent] ?? 80;
	}

	#box(node) {
		const row = this.#row;
		if (!row) return null;
		if (node === row) return this.#rect(this.#left, this.#width);
		if (node.classList?.contains('bui-scroll-edge') && node.parentElement === row.parentElement) {
			if (node.hidden) return this.#rect(0, 0);
			const left = node.classList.contains('bui-scroll-edge-start') !== this.#rtl;
			return this.#rect(left ? this.#left : this.#left + this.#width - this.#cue, this.#cue);
		}
		const tab = node.parentElement === row ? node : node.parentElement?.parentElement === row ? node.parentElement : null;
		if (!tab) return null;
		const tabs = [...row.children];
		const before = tabs.slice(0, tabs.indexOf(tab)).reduce((sum, other) => sum + this.#of(other) + this.#gap, 0);
		const width = this.#of(tab);
		// From the left of the scrolled content: a right-to-left row lays its first tab at the right end
		const start = this.#rtl ? this.#content - this.#padding - before - width : this.#padding + before;
		const offset = this.#rtl ? this.#scroll + this.#extent : this.#scroll;
		return this.#rect(this.#left + start - offset, width);
	}

	#rect(left, width) {
		return { left, right: left + width, width, top: 0, bottom: width ? 40 : 0, height: width ? 40 : 0, x: left, y: 0 };
	}
}
