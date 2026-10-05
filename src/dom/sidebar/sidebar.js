import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { SidebarSections } from './sections.js';
import { Drawer } from './drawer.js';

const defaults = { sections: '{product} sections', close: 'Close' };

/**
 * A product's own sections, the same in every product that has them (Delegate, Conduict, CDN's
 * administration, Workspace).
 *
 * At or above `cut` (1024 px, the family's one cut, D49; a product passes another width only with a
 * recorded measurement showing its content cannot fit at 1024 px) it is
 * a permanent sidebar, integrated in the page: flush under the family bar, full height and sticky,
 * with a border on its inner edge, a discretely different surface and a clear current item. It has no
 * toggle in the bar. Below the cut it becomes a product row under the bar, about 44 px and sticky,
 * whose button names the section in view ("≡ Requests") and opens the same sections in a modal
 * `Drawer`. Crossing the cut while the drawer is open closes it at once, and focus that was in it
 * moves to the permanent sidebar's current item.
 *
 * Place it first in a `.bui-shell` element beside the page's main content: the shell lays the
 * permanent sidebar out as a column and the product row above the content. `onnavigate(item, event)`
 * takes over plain primary clicks on same-origin links; a destination chosen in the drawer closes it
 * first, and the product moves focus to its new heading.
 */
export class Sidebar extends Component {
	/** The copy in English and Spanish (0.7.2). */
	static labels = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze({ sections: 'Secciones de {product}', close: 'Cerrar' }) });

	#element;
	#panel;
	#row;
	#button;
	#drawer;
	#sections;
	#labels;
	#cut;
	#product;
	#section = null;
	#query = null;
	#onnavigate;

	/**
	 * @param {object} options
	 * @param {string} options.product the product's display name
	 * @param {Array<{heading?: string|null, items: Array<{label: string, href?: string, current?: boolean, meta?: string|number|null}|null>}>} [options.groups]
	 * @param {string|{label?: string, name: string}|Node|null} [options.context] what the sections belong to
	 * @param {number} [options.cut] the narrowest width, in CSS pixels, with a permanent sidebar (default 1024)
	 * @param {string|null} [options.section] the row's text; the current item's label by default
	 * @param {(item: {href: string, url: string, label: string}, event: MouseEvent) => void} [options.onnavigate]
	 * @param {{sections?: string, close?: string}} [options.labels]
	 */
	constructor({ product, groups = [], context = null, cut = 1024, section = null, onnavigate = null, labels = {} }) {
		super();
		this.#labels = new Labels(defaults, labels);
		this.#cut = Number.isFinite(cut) && cut > 0 ? cut : 1024;
		this.#onnavigate = onnavigate;
		this.#product = product;
		const name = this.#labels.text('sections', { product });
		const id = Ids.next('bui-drawer');
		this.#sections = new SidebarSections({ name });
		this.#panel = el('div', { class: 'bui-sidebar-panel' });
		this.#button = el('button', { type: 'button', class: 'bui-sidebar-button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': id, onclick: () => this.open() });
		this.#row = el('div', { class: 'bui-sidebar-row' }, [this.#button]);
		this.#drawer = new Drawer({ id, title: product, name, close: this.#labels.text('close'), onclose: () => this.#button.setAttribute('aria-expanded', 'false') });
		this.#element = el('div', { class: 'bui-sidebar' }, [this.#panel, this.#row, this.#drawer.element]);
		this.#element.addEventListener('click', event => this.#navigate(event));
		this.#sections.groups = groups;
		this.#sections.context = context;
		this.#section = section;
		this.#draw();
		this.#watch();
	}

	get element() {
		return this.#element;
	}

	/** `permanent` at or above the cut, `drawer` below it. */
	get mode() {
		return this.#element.dataset.mode;
	}

	/** Whether the drawer is open. */
	get expanded() {
		return this.#drawer.shown;
	}

	/** Replaces the groups of links and redraws both forms. */
	set groups(value) {
		this.#sections.groups = value;
		this.#draw();
	}

	/** Replaces the context block and redraws. */
	set context(value) {
		this.#sections.context = value;
		this.#draw();
	}

	/** Replaces the row's text (null: the current item's label). */
	set section(value) {
		this.#section = value ?? null;
		this.#draw();
	}

	/** Opens the drawer (below the cut only). */
	open() {
		if (this.mode !== 'drawer' || this.#drawer.shown) return;
		this.#drawer.open(this.#button);
		this.#button.setAttribute('aria-expanded', String(this.#drawer.shown));
	}

	/** Closes the drawer and returns focus to the row's button. */
	close() {
		this.#drawer.close();
	}

	destroy() {
		this.#drawer.destroy();
		super.destroy();
	}

	#draw() {
		const label = this.#section ?? this.#sections.current ?? this.#product;
		this.#button.replaceChildren(glyph('menu'), el('span', { class: 'bui-sidebar-section', text: label }));
		this.#panel.replaceChildren(this.#sections.navigation());
		// A redraw while the drawer is open keeps focus inside it, on the current item.
		const inside = this.#drawer.shown && this.#drawer.element.contains(this.#element.ownerDocument.activeElement);
		this.#drawer.fill(this.#sections.navigation());
		if (inside) (this.#drawer.element.querySelector('a[aria-current="page"]') ?? this.#drawer.element.querySelector('.bui-drawer-close'))?.focus({ preventScroll: true });
	}

	/** Follows the viewport across the cut. */
	#watch() {
		const view = this.#element.ownerDocument.defaultView;
		this.#query = view.matchMedia?.(`(min-width: ${this.#cut}px)`) ?? null;
		this.#mode();
		if (this.#query?.addEventListener) this.listen(this.#query, 'change', () => this.#mode());
		this.listen(view, 'resize', () => this.#mode());
	}

	#mode() {
		const view = this.#element.ownerDocument.defaultView;
		const wide = this.#query ? this.#query.matches : view.innerWidth >= this.#cut;
		const mode = wide ? 'permanent' : 'drawer';
		if (this.#element.dataset.mode === mode) return;
		this.#element.dataset.mode = mode;
		this.#panel.hidden = !wide;
		this.#row.hidden = wide;
		if (!wide || !this.#drawer.shown) return;
		const inside = this.#drawer.element.contains(this.#element.ownerDocument.activeElement);
		this.#drawer.close({ refocus: false });
		if (inside) (this.#panel.querySelector('[aria-current="page"]') ?? this.#panel.querySelector('a[href]'))?.focus({ preventScroll: true });
	}

	/** A choice in the drawer closes it; plain primary clicks on same-origin links go to `onnavigate`. */
	#navigate(event) {
		const link = event.target.closest?.('a[href].bui-sidebar-item');
		if (!link) return;
		if (this.#drawer.element.contains(link)) this.#drawer.close({ refocus: false });
		const handler = this.#onnavigate;
		if (!handler || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (link.target && link.target !== '_self')) return;
		const document = this.#element.ownerDocument;
		const url = new URL(link.getAttribute('href'), document.baseURI);
		if (url.origin !== document.defaultView.location.origin) return;
		event.preventDefault();
		handler({ href: link.getAttribute('href'), url: url.href, label: link.querySelector('.bui-sidebar-label')?.textContent ?? link.textContent.trim() }, event);
	}
}
