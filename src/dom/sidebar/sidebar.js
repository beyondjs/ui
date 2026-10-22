import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { SidebarSections } from './sections.js';
import { Drawer } from './drawer.js';
import { SidebarMerge } from './merge.js';
import { SidebarFolds } from './folds.js';
import { SidebarShortcut } from './shortcut.js';
import { Hint } from '../core/hint.js';
import { words } from './labels.js';
import { SidebarRail } from './rail.js';
import { SidebarStart } from './start.js';
import { SidebarContext } from './context.js';

/**
 * A product's own sections, the same in every product that has them (Delegate, Conduict, CDN's
 * administration, Workspace).
 *
 * From `cut` (1024 px, D49; a departure requires a recorded fit measurement), it is a permanent
 * sidebar: flush under the family bar, full height and sticky,
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
 *
 * Since 0.10.0 a product may also list its person's own items as groups of entries (`kind:
 * 'entries'`, with a mark in words and a `more` link), put a top `action` link ("New conversation")
 * and a `search` of its service; every setter patches both forms by keys, so a live change never
 * redraws the navigation or moves focus (`SidebarSections`).
 *
 * Since 0.14.0 (D97, D98) the product's own objects are a group of `kind: 'object'` after its sections
 * and a divider: their heading line carries the primary action ("New", with `plus`) and the search as
 * its icon, which expands into the field in place; their groups of entries fold under disclosure
 * headings that keep their count, kept per device and product; their `more` link ends them. `shortcut:
 * true` makes ⌘K / Ctrl+K open the search (the drawer below the cut); `sidebar.shortcut = false` lets a
 * host keep the key. Below the cut the objects' action may sit at the product row's end (`action.row`).
 * The current item is drawn in the text color at weight 500 with the accent bar, never as a link.
 */
export class Sidebar extends Component {
	/** The copy in English and Spanish (0.7.2). */
	static labels = Object.freeze({ en: Object.freeze({ ...words.en }), es: Object.freeze({ ...words.es }) });

	#element;
	#panel;
	#row;
	#button;
	#drawer;
	#merge = new SidebarMerge();
	#sections;
	#labels;
	#cut;
	#product;
	#section = null;
	#query = null;
	#onnavigate;
	#folds;
	#shortcut;
	#hint;
	#start;
	#rail;
	#context;

	/**
	 * @param {object} options
	 * @param {string} options.product the product's display name
	 * @param {Array<{kind?: 'sections'|'entries', key?: string, heading?: string|null, items: Array<object|null>, more?: {label: string, href: string}|null}>} [options.groups]
	 * @param {string|{label?: string, name: string}|Node|null} [options.context] what the sections belong to
	 * @param {number} [options.cut] the narrowest width, in CSS pixels, with a permanent sidebar (default 1024)
	 * @param {string|null} [options.section] the row's text; the current item's label by default
	 * @param {{label: string, href: string, glyph?: string}|null} [options.action] a top link ("New conversation", 0.10.0)
	 * @param {{label: string, source: Function, bound?: number, delay?: number, all?: Function|null, placeholder?: string|null}|null} [options.search] a search of the product's entries (0.10.0)
	 * @param {(item: {href: string, url: string, label: string}, event: MouseEvent) => void} [options.onnavigate]
	 * @param {object} [options.labels] replaces entries of `Sidebar.labels.en`
	 * @param {boolean} [options.shortcut] ⌘K / Ctrl+K opens the search (0.14.0)
	 * @param {{panel?: string|null, open?: boolean, order?: string[], onchange?: (open: boolean) => void}|null} [options.rail] opt-in desktop rail and contextual object group (0.18.0)
	 */
	constructor({ product, groups = [], context = null, cut = 1024, section = null, action = null, search = null, onnavigate = null, labels = {}, shortcut = false, rail = null }) {
		super();
		this.#labels = new Labels(words.en, labels);
		this.#cut = Number.isFinite(cut) && cut > 0 ? cut : 1024;
		this.#onnavigate = onnavigate;
		this.#product = product;
		const name = this.#labels.text('sections', { product });
		const id = Ids.next('bui-drawer');
		const view = globalThis.document?.defaultView ?? null;
		this.#folds = new SidebarFolds({ product, view });
		this.#shortcut = new SidebarShortcut({ view, run: () => this.seek(), enabled: shortcut });
		this.#sections = new SidebarSections({ name, labels: this.#labels, folds: this.#folds, shortcut: shortcut ? this.#shortcut.words : null });
		this.#panel = el('div', { class: 'bui-sidebar-panel' }, [this.#sections.panel]);
		this.#panel.id = Ids.next('bui-sidebar-panel');
		this.#rail = new SidebarRail({ name, panel: this.#panel.id, labels: this.#labels, onchange: () => this.#layout() });
		this.#button = el('button', { type: 'button', class: 'bui-sidebar-button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': id, onclick: () => this.open() });
		this.#row = el('div', { class: 'bui-sidebar-row' }, [this.#button]);
		this.#start = new SidebarStart(this.#row);
		this.#drawer = new Drawer({ id, title: product, name, close: this.#labels.text('close'), onclose: () => (this.#button.setAttribute('aria-expanded', 'false'), this.#merge.closed()) });
		this.#element = el('div', { class: 'bui-sidebar' }, [this.#panel, this.#row, this.#drawer.element]);
		this.#context = new SidebarContext(this.#element, this.#panel, (work, delay) => this.later(work, delay));
		this.#element.addEventListener('click', event => this.#navigate(event));
		this.#hint = new Hint(this.#panel);
		this.#drawer.fill(this.#sections.drawer);
		this.#sections.groups = groups;
		this.#rail.groups = groups;
		this.#rail.options = rail;
		this.#start.groups = groups;
		this.#sections.context = context;
		this.#sections.action = action;
		this.#sections.search = search;
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

	/** Replaces the groups of links, patching both forms by keys (focus stays where it is). */
	set groups(value) {
		const inside = this.#panel.contains(this.#element.ownerDocument.activeElement);
		this.#sections.groups = value;
		this.#rail.groups = value;
		this.#start.groups = value;
		this.#draw();
		this.#layout();
		if (inside && this.#rail.enabled && !this.#rail.shown) this.#rail.return();
	}

	/** Opt-in desktop rail. The drawer and merged family bar keep the full navigation. */
	get rail() { return this.#rail.options; }
	set rail(value) {
		const inside = this.#rail.element.contains(this.#element.ownerDocument.activeElement);
		this.#rail.options = value;
		this.#layout();
		if (inside && !this.#rail.enabled) (this.#panel.querySelector('[aria-current="page"]') ?? this.#panel.querySelector('a[href], button'))?.focus({ preventScroll: true });
	}

	/** Replaces the context block. */
	set context(value) {
		this.#sections.context = value;
	}

	/** Replaces the top action link (`{ label, href, glyph? }`), or removes it with null (0.10.0). */
	set action(value) {
		this.#sections.action = value;
	}

	/** Replaces the search (`{ label, source, … }`), or removes it with null; the same label keeps the query (0.10.0). */
	set search(value) {
		this.#sections.search = value;
	}

	/** Replaces the row's text (null: the current item's label). */
	set section(value) {
		this.#section = value ?? null;
		this.#draw();
	}

	/** Whether ⌘K / Ctrl+K opens the search (0.14.0); a host that keeps the key sets it false. */
	get shortcut() {
		return this.#shortcut.enabled;
	}

	set shortcut(value) {
		this.#shortcut.enabled = value;
	}

	/** The kept folds of the groups of entries (`SidebarFolds`: `folded(key)`, `keep(key, folded)`) (0.14.0). */
	get folds() {
		return this.#folds;
	}

	/**
	 * Opens the search with focus in its field, as ⌘K / Ctrl+K does: in the permanent sidebar, or in the
	 * drawer below the cut, which opens first. Answers whether there was a search to open (0.14.0).
	 */
	seek() {
		if (this.mode === 'drawer') {
			if (!this.#sections.searches.length && !this.#sections.search) return false;
			this.open();
			return this.#sections.seek('drawer');
		}
		this.#rail.open();
		return this.#sections.seek('panel');
	}

	/** Opens the drawer (below the cut only). */
	open() {
		if (this.mode !== 'drawer' || this.#drawer.shown) return;
		this.#drawer.open(this.#merge.trigger ?? this.#button);
		this.#button.setAttribute('aria-expanded', String(this.#drawer.shown));
	}

	/** FamilyBar's `toggle` for this drawer (0.16.0, DQ-19): pass it to the bar, then `merge(bar)`. */
	get toggle() {
		return this.#merge.toggle(this.#drawer.element.id, open => (open ? this.open() : this.close()));
	}

	/** One bar on a phone (0.16.0, DQ-19): the bar's menu button opens the drawer and the product row goes. */
	merge(bar) {
		this.#merge.attach(bar, this.#element, this.toggle);
		this.#merge.mode(this.mode);
	}

	/** Closes the drawer and returns focus to the row's button. */
	close() {
		this.#drawer.close();
	}

	destroy() {
		this.#context.destroy();
		this.#start.destroy();
		this.#rail.destroy();
		this.#shortcut.destroy();
		this.#hint.destroy();
		this.#folds.destroy();
		this.#drawer.destroy();
		this.#sections.destroy();
		super.destroy();
	}

	/** The row's button names the section in view; the navigation itself is patched, never redrawn. */
	#draw() {
		const label = this.#section ?? this.#sections.current ?? this.#product;
		const shown = this.#button.querySelector('.bui-sidebar-section');
		if (shown?.textContent === label) return;
		this.#button.replaceChildren(glyph('menu'), el('span', { class: 'bui-sidebar-section', text: label }));
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
		this.#merge.mode(mode);
		this.#layout();
		this.#row.hidden = wide;
		if (!wide || !this.#drawer.shown) return;
		const inside = this.#drawer.element.contains(this.#element.ownerDocument.activeElement);
		this.#drawer.close({ refocus: false });
		const target = this.#rail.enabled ? this.#rail.element : this.#panel;
		if (inside) (target.querySelector('[aria-current="page"]') ?? target.querySelector('a[href], button'))?.focus({ preventScroll: true });
	}

	#layout() {
		const wide = this.mode === 'permanent';
		const enabled = this.#rail.enabled;
		const shown = enabled && this.#rail.shown;
		if (enabled && this.#rail.element.parentNode !== this.#element) this.#element.prepend(this.#rail.element);
		if (!enabled) this.#rail.element.remove();
		if (enabled && !shown && this.#panel.contains(this.#element.ownerDocument.activeElement)) this.#rail.return();
		this.#sections.panel = enabled ? this.#rail.options.panel ?? '' : null;
		this.#context.show({ wide, enabled, shown });
		this.#rail.element.hidden = !wide || !enabled;
		const head = enabled ? this.#panel.querySelector('.bui-sidebar-object-head') : null;
		if (head && this.#rail.collapse.parentNode !== head) head.append(this.#rail.collapse);
		if (!head) this.#rail.collapse.remove();
	}

	/** A choice in the drawer closes it; plain primary clicks on same-origin links go to `onnavigate`. */
	#navigate(event) {
		const link = event.target.closest?.('a[href].bui-sidebar-item, a[href].bui-sidebar-rail-item');
		if (!link) return;
		if (this.#drawer.element.contains(link)) this.#drawer.close({ refocus: false });
		const handler = this.#onnavigate;
		if (!handler || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (link.target && link.target !== '_self')) return;
		const document = this.#element.ownerDocument;
		const url = new URL(link.getAttribute('href'), document.baseURI);
		if (url.origin !== document.defaultView.location.origin) return;
		event.preventDefault();
		handler({ href: link.getAttribute('href'), url: url.href, label: link.dataset.label ?? link.querySelector('.bui-sidebar-label')?.textContent ?? link.textContent.trim() }, event);
	}
}
