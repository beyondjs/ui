import { Component } from '../core/component.js';
import { el, fill } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Focus } from '../core/focus.js';
import { Labels } from '../core/labels.js';
import { SideSheet } from '../sheet.js';
import { PanelHead } from './head.js';

/**
 * A page's side panel kept in view (0.10.0), such as a conversation's context: beside the main column
 * once the page's region is at least `cut` wide (decided by the region's own width, never the
 * window's), sticky under the family bar with a scroll of its own, `--layout-aside` wide; below the cut
 * it is not in the page's flow and `open()` shows it in a `SideSheet` (modal, focus in and back).
 *
 * On a wide region the person may hide it (`close()`, `toggle()`); `onchange(shown)` reports each such
 * choice so the product keeps it on the device, and `open` gives it back on the next visit. A toggle
 * the product draws ("Details") is joined with `control(button)`: a press shows or hides the panel, or
 * opens its sheet, and the button's `aria-expanded` and `aria-controls` follow. Crossing the cut while
 * the sheet is open closes it and shows the panel beside, focus included.
 *
 * Since 0.11.0, `head: true` gives it a head of its own beside the main column: its title and a hide
 * control (in its sheet, the sheet's head and Close stand for it). On a wide region the panel's width
 * is fluid from `--layout-aside` up to `--layout-aside-max`, taking the width a capped main column
 * (the `thread` tier) leaves rather than an empty band; `wide` (a product's toggle, such as while it
 * shows a diff) lets it grow: since 0.11.2 it takes every width the main column leaves, to the region's
 * far edge, the main column keeping its tier where the region holds both and giving down to
 * `--layout-aside` first (it took at most `--layout-aside-wide`, the main column giving down to the form
 * tier, in 0.11.0 and 0.11.1). `--layout-aside-max` is 40rem since token set 0.4.1.
 */
export class PagePanel extends Component {
	/** The region width from which the panel sits beside the main column, by default (68rem). */
	static cut = '68rem';
	/** The copy in English and Spanish (0.11.0): the hide control's name. */
	static labels = Object.freeze({ en: Object.freeze({ hide: 'Hide {title}', close: 'Close' }), es: Object.freeze({ hide: 'Ocultar {title}', close: 'Cerrar' }) });

	#page;
	#body;
	#element;
	#slot = el('div', { class: 'bui-page-slot' });
	#sheet;
	#cut;
	#shown;
	#mode = null;
	#empty = true;
	#onchange;
	#controls = new Map();
	#observer = null;
	#head = null;
	#wide = false;

	/**
	 * @param {object} options
	 * @param {HTMLElement} options.page the page's element (`.bui-page`), whose width decides
	 * @param {HTMLElement} options.body the page's body (`.bui-page-body`), where the panel goes
	 * @param {number|string} [options.cut] the region width (CSS pixels, or a `rem` or `px` length) from which it is beside
	 * @param {boolean} [options.open] shown beside on a wide region (default true): the person's kept choice
	 * @param {(shown: boolean) => void} [options.onchange] the person showed or hid it beside
	 * @param {string|null} [options.label] its accessible name
	 * @param {string|null} [options.title] the sheet's title (the label by default)
	 * @param {{close?: string, hide?: string}} [options.labels] the sheet's and the head's copy
	 * @param {boolean} [options.head] a head of its own beside the main column: the title and a hide control (0.11.0)
	 * @param {boolean} [options.wide] the wide form, up to `--layout-aside-wide` (0.11.0)
	 */
	constructor({ page, body, cut = PagePanel.cut, open = true, onchange = null, label = null, title = null, labels = {}, head = false, wide = false }) {
		super();
		this.#page = page;
		this.#body = body;
		this.#cut = cut;
		this.#shown = open !== false;
		this.#onchange = onchange;
		this.#element = el('aside', { id: Ids.next('bui-panel'), class: 'bui-page-aside bui-page-panel', 'aria-label': label, hidden: true }, [this.#slot]);
		const copy = new Labels(PagePanel.labels.en, labels);
		if (head) {
			this.#head = new PanelHead({ title: title ?? label ?? '', labels: copy, onhide: () => this.close() });
			this.#element.prepend(this.#head.element);
		}
		this.wide = wide;
		this.#sheet = new SideSheet({ title: title ?? label ?? '', label: title ? null : label, labels: { close: copy.text('close') }, onclose: () => this.#back() });
		this.#sheet.element.id = Ids.next('bui-panel-sheet');
		this.#observe();
		this.measure();
	}

	get element() {
		return this.#element;
	}

	/** `beside` from the cut, `sheet` below it. */
	get mode() {
		return this.#mode;
	}

	/** Whether the person keeps it shown beside the main column. */
	get shown() {
		return this.#shown;
	}

	/** Sets the kept choice without reporting it (a product's stored value). */
	set shown(value) {
		this.#shown = value !== false;
		this.#paint();
	}

	/** Whether it is in the wide form (0.11.0). */
	get wide() {
		return this.#wide;
	}

	/** The wide form: beside, it may grow to `--layout-aside-wide`, such as while it shows a review of changes. */
	set wide(value) {
		this.#wide = Boolean(value);
		this.#page.toggleAttribute('data-panel-wide', this.#wide);
	}

	/** The head's title (beside) and the sheet's, when it has a head (0.11.0). */
	set title(text) {
		if (this.#head) this.#head.title = text;
	}

	/** Whether it is in view now: beside and shown, or open in its sheet. */
	get expanded() {
		if (this.#empty) return false;
		return this.#mode === 'sheet' ? this.#sheet.shown : this.#shown;
	}

	/** The element that holds the panel's content, beside or in the sheet (a React adapter fills it). */
	get slot() {
		return this.#slot;
	}

	/** Replaces the panel's content; null takes the panel out of the page. */
	set content(children) {
		if (children) fill(this.#slot, [].concat(children).map(child => child?.element ?? child));
		this.present = Boolean(children);
	}

	/** Whether the panel is in the page, its content left as it is; out of it, its sheet closes too. */
	set present(value) {
		this.#empty = !value;
		if (this.#empty) {
			this.#sheet.close(null);
			this.#element.remove();
		} else if (this.#element.parentNode !== this.#body) this.#body.append(this.#element);
		this.#paint();
	}

	/**
	 * Shows it beside, or opens its sheet below the cut. Closing the sheet returns focus to `from` (the
	 * toggle pressed), else to the panel's first toggle: an engine that does not focus a clicked button
	 * (WebKit) would otherwise leave nothing to return to.
	 *
	 * @param {HTMLElement|null} [from] the element focus returns to once the sheet closes
	 */
	open(from = null) {
		if (this.#empty || this.destroyed) return;
		if (this.#mode === 'sheet') {
			if (this.#sheet.shown) return;
			this.#sheet.body.append(this.#slot);
			this.#sheet.open({ restore: from ?? [...this.#controls.keys()][0] ?? null });
		} else if (!this.#shown) {
			this.#shown = true;
			this.#onchange?.(true);
		}
		this.#paint();
	}

	/**
	 * Hides it beside (focus inside goes to its toggle, else to the page's heading), or closes its
	 * sheet.
	 */
	close() {
		if (this.#mode === 'sheet') return void this.#sheet.close(null);
		if (!this.#shown) return;
		const inside = this.#element.contains(this.#element.ownerDocument.activeElement);
		this.#shown = false;
		this.#onchange?.(false);
		this.#paint();
		if (inside) ([...this.#controls.keys()][0] ?? this.#page.querySelector('h1[tabindex]'))?.focus({ preventScroll: true });
	}

	/** @param {HTMLElement|null} [from] the toggle pressed, where focus returns from the sheet */
	toggle(from = null) {
		if (this.expanded) this.close();
		else this.open(from);
	}

	/** Makes `button` the panel's toggle; returns the release. */
	control(button) {
		const press = () => this.toggle(button);
		button.addEventListener('click', press);
		this.#controls.set(button, press);
		this.#paint();
		return () => {
			button.removeEventListener('click', press);
			this.#controls.delete(button);
			button.removeAttribute('aria-expanded');
			button.removeAttribute('aria-controls');
		};
	}

	/** Decides beside or sheet from the region's width now (after a mount, or when it may have changed). */
	measure() {
		if (this.destroyed) return;
		const view = this.#page.ownerDocument.defaultView;
		const width = this.#page.getBoundingClientRect().width || view?.innerWidth || 0;
		const mode = width >= this.#pixels(view) ? 'beside' : 'sheet';
		if (mode === this.#mode) return;
		const document = this.#page.ownerDocument;
		const inside = this.#sheet.element.contains(document.activeElement) || this.#element.contains(document.activeElement);
		const open = this.#sheet.shown;
		this.#mode = mode;
		this.#page.dataset.panel = mode;
		if (mode === 'beside' && open) {
			// The person was looking at it: it stays in view, beside now
			this.#shown = true;
			this.#sheet.close(null);
		}
		this.#paint();
		if (inside && mode === 'beside') (new Focus(this.#element).targets[0] ?? null)?.focus({ preventScroll: true });
		else if (inside) [...this.#controls.keys()][0]?.focus({ preventScroll: true });
	}

	destroy() {
		this.#observer?.disconnect();
		for (const [button, press] of this.#controls) button.removeEventListener('click', press);
		this.#controls.clear();
		this.#sheet.destroy();
		this.#head?.destroy();
		delete this.#page.dataset.panel;
		this.#page.removeAttribute('data-panel-wide');
		super.destroy();
	}

	#back() {
		this.#element.append(this.#slot);
		this.#paint();
	}

	#paint() {
		this.#element.hidden = this.#empty || this.#mode === 'sheet' || !this.#shown;
		const expanded = String(this.expanded);
		const target = this.#mode === 'sheet' ? this.#sheet.element.id : this.#element.id;
		for (const button of this.#controls.keys()) {
			button.setAttribute('aria-expanded', expanded);
			button.setAttribute('aria-controls', target);
		}
	}

	/** The cut in CSS pixels: a number, or a `rem` (of the root's font size) or `px` length. */
	#pixels(view) {
		if (Number.isFinite(this.#cut)) return this.#cut;
		const [, number, unit] = /^\s*([\d.]+)\s*(rem|px)?\s*$/.exec(String(this.#cut)) ?? [null, '68', 'rem'];
		if (unit !== 'rem') return Number(number);
		const root = parseFloat(view?.getComputedStyle?.(this.#page.ownerDocument.documentElement).fontSize) || 16;
		return Number(number) * root;
	}

	#observe() {
		const view = this.#page.ownerDocument.defaultView;
		if (!view) return;
		const later = view.requestAnimationFrame?.bind(view) ?? (callback => view.setTimeout(callback, 0));
		// A page made outside the document only guesses from the window: one a product places itself in
		// the same task (not through `mount()`) is decided from its region before it is first drawn
		later(() => this.measure());
		if (view.ResizeObserver) {
			// Only the region's width decides, and the decision waits for the next frame: changing the
			// layout inside the observer's own callback is a loop an engine reports (WebKit)
			let width = null;
			let frame = 0;
			this.#observer = new view.ResizeObserver(entries => {
				const next = entries.at(-1)?.contentRect.width ?? null;
				if (next === width || frame) return void (width = next);
				width = next;
				frame = later(() => {
					frame = 0;
					this.measure();
				});
			});
			this.#observer.observe(this.#page);
		}
		this.listen(view, 'resize', () => this.measure());
	}
}
