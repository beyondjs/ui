import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { KeyedList } from '../core/keyed.js';
import { waiting } from '../feedback.js';
import { SidebarGroup } from './group.js';
import { SidebarSeek } from './seek.js';

/**
 * A product's own objects in its sidebar (0.14.0, D97: `kind: 'object'`), after the sections and a
 * divider: their heading line ("Conversations") carrying the primary action (a word with the `plus`
 * glyph, "New") and the search as its icon (`SidebarSeek`), then their groups of entries (each a
 * disclosure, `SidebarGroup`), then their `more` link ("All conversations"). Patched by keys, so a live
 * change never moves focus; while a query is typed the results take the groups' place.
 *
 * Since 0.44.0 (LOAD-01) objects whose first read runs wait in place (`waiting`: true or `{ rows }`): the
 * heading line with its action and search stays, the shared wait ("Loading…" above placeholder lines) takes
 * the groups' place and the group is `aria-busy` until the product gives its groups without `waiting`.
 */
export class SidebarObject {
	#element;
	#head;
	#title = el('p', { id: Ids.next('bui-sidebar-object'), class: 'bui-sidebar-object-title' });
	#action = null;
	#seek = null;
	#groups = el('div', { class: 'bui-sidebar-object-groups' });
	#order = new KeyedList(this.#groups);
	#views = new Map();
	#more = null;
	#wait = null;
	#labels;
	#folds;
	#shortcut;

	/**
	 * @param {object} options
	 * @param {import('../core/labels.js').Labels} options.labels the sidebar's copy
	 * @param {import('./folds.js').SidebarFolds|null} options.folds the kept folds
	 * @param {{text: string, keys: string}|null} [options.shortcut] the search's shortcut, when the sidebar has one
	 */
	constructor({ labels, folds, shortcut = null }) {
		this.#labels = labels;
		this.#folds = folds;
		this.#shortcut = shortcut;
		this.#head = el('div', { class: 'bui-sidebar-object-head' }, [this.#title]);
		this.#element = el('section', { class: 'bui-sidebar-group bui-sidebar-object', 'aria-labelledby': this.#title.id }, [this.#head, this.#groups]);
	}

	get element() {
		return this.#element;
	}

	get kind() {
		return 'object';
	}

	/** The search's icon and field, or null. */
	get seek() {
		return this.#seek;
	}

	/** The label of the current item, or null. */
	get current() {
		for (const view of this.#views.values()) if (view.current) return view.current;
		return null;
	}

	/**
	 * @param {{heading: string|Node, action?: {label: string, href: string, glyph?: string}|null, search?: import('./search.js').SidebarSearch|null, groups?: object[], more?: {label: string, href: string}|null, waiting?: boolean|{rows?: number}|null}} object
	 */
	update({ key = null, heading, action = null, search = null, groups = [], more = null, waiting: shape = null }) {
		this.#element.dataset.key = String(key ?? heading ?? '');
		if (typeof heading !== 'string' || this.#title.textContent !== heading) fill(this.#title, [content(heading)]);
		this.#act(action);
		this.#find(search);
		this.#hold(shape);
		const next = new Map();
		(Array.isArray(groups) && !shape ? groups : []).forEach((group, index) => {
			if (!group || !Array.isArray(group.items) || !group.items.some(Boolean)) return;
			const key = String(group.key ?? (typeof group.heading === 'string' && group.heading ? group.heading : `#${index}`));
			const view = this.#views.get(key) ?? new SidebarGroup({ kind: 'entries', labels: this.#labels, folds: this.#folds });
			view.update({ ...group, key, more: null });
			next.set(key, view);
		});
		this.#order.order([...next.values()].map(view => view.element));
		for (const [key, view] of this.#views) if (next.get(key) !== view) view.destroy();
		this.#views = next;
		this.#link(more);
	}

	destroy() {
		this.#seek?.destroy();
		for (const view of this.#views.values()) view.destroy();
		this.#views.clear();
	}

	/** The primary action on the heading line: a link with its word and glyph (`plus` by default). */
	#act(action) {
		if (!action?.href || !action.label) {
			if (this.#action?.contains(this.#element.ownerDocument.activeElement)) this.#title.parentNode.querySelector('button')?.focus({ preventScroll: true });
			this.#action?.remove();
			this.#action = null;
			return;
		}
		if (!this.#action) {
			this.#action = el('a', { class: 'bui-sidebar-item bui-sidebar-object-action' });
			this.#title.after(this.#action);
		}
		if (this.#action.getAttribute('href') !== action.href) this.#action.setAttribute('href', action.href);
		const name = action.glyph ?? 'plus';
		if (this.#action.dataset.glyph !== name || this.#action.textContent !== action.label) {
			fill(this.#action, [glyph(name), el('span', { class: 'bui-sidebar-label' }, [content(action.label)])]);
			this.#action.dataset.glyph = name;
		}
	}

	/** The shared wait in the groups' place while the objects' first read runs, the group busy (0.44.0). */
	#hold(shape) {
		if (!shape) {
			this.#wait?.remove();
			this.#wait = null;
			this.#element.removeAttribute('aria-busy');
			return;
		}
		const rows = Number.isInteger(shape.rows) && shape.rows > 0 ? shape.rows : 3;
		if (Number(this.#wait?.dataset.rows) !== rows) {
			const wait = waiting({ rows, kind: 'lines', frame: false, label: this.#labels.text('loading') });
			wait.dataset.rows = String(rows);
			if (this.#wait) this.#wait.replaceWith(wait);
			else this.#groups.before(wait);
			this.#wait = wait;
		}
		this.#element.setAttribute('aria-busy', 'true');
	}

	#find(search) {
		if (this.#seek?.search === search) return;
		this.#seek?.destroy();
		this.#seek = search ? new SidebarSeek({ search, labels: this.#labels, groups: this.#groups, head: this.#head, shortcut: this.#shortcut }) : null;
		if (!this.#seek) return;
		this.#head.append(this.#seek.button, this.#seek.field);
		this.#groups.after(this.#seek.results);
	}

	#link(more) {
		if (!more?.href || !more.label) {
			this.#more?.remove();
			this.#more = null;
			return;
		}
		if (!this.#more) this.#more = el('a', { class: 'bui-sidebar-item bui-sidebar-more' }, [el('span', { class: 'bui-sidebar-label' })]);
		if (this.#more.parentNode !== this.#element) this.#element.append(this.#more);
		if (this.#more.getAttribute('href') !== more.href) this.#more.setAttribute('href', more.href);
		if (this.#more.firstChild.textContent !== more.label) this.#more.firstChild.textContent = more.label;
	}
}
