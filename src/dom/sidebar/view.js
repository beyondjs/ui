import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { KeyedList } from '../core/keyed.js';
import { SidebarGroup } from './group.js';
import { SidebarFinder } from './finder.js';

/**
 * One copy of a sidebar's navigation (the permanent sidebar's, or the drawer's), patched in place: the
 * context (what the sections belong to, as text, never a control), the top action (a link such as "New
 * conversation"), the search, and the groups: sections, and groups of entries with their `more` link.
 * Groups are matched by `key` (else heading, else place), so a live change patches only what differs
 * and never moves focus. While a query is typed the search's results take the groups' place.
 */
export class SidebarView {
	#element;
	#context = null;
	#action = null;
	#finder = null;
	#groups = el('div', { class: 'bui-sidebar-groups' });
	#order = new KeyedList(this.#groups);
	#views = new Map();
	#labels;

	/**
	 * @param {object} options
	 * @param {string} options.name the navigation's accessible name ("Delegate sections")
	 * @param {import('../core/labels.js').Labels} options.labels the sidebar's copy
	 */
	constructor({ name, labels }) {
		this.#labels = labels;
		this.#element = el('nav', { class: 'bui-sidebar-nav', 'aria-label': name }, [this.#groups]);
	}

	get element() {
		return this.#element;
	}

	/** The label of the current item, or null. */
	get current() {
		for (const view of this.#views.values()) if (view.current) return view.current;
		return null;
	}

	/** `[{ kind?, key?, heading?, items, more? }]`; a group with no item (and no `more`) is left out. */
	set groups(groups) {
		const next = new Map();
		(Array.isArray(groups) ? groups : []).forEach((group, index) => {
			if (!group || !Array.isArray(group.items) || !(group.items.some(Boolean) || (group.kind === 'entries' && group.more?.href))) return;
			const kind = group.kind === 'entries' ? 'entries' : 'sections';
			const base = String(group.key ?? (typeof group.heading === 'string' && group.heading ? group.heading : `#${index}`));
			const key = next.has(base) ? `${base}\u0000${index}` : base;
			let view = this.#views.get(key);
			if (!view || view.kind !== kind) view = new SidebarGroup({ kind });
			view.update(group);
			next.set(key, view);
		});
		this.#order.order([...next.values()].map(view => view.element));
		for (const [key, view] of this.#views) if (next.get(key) !== view) view.destroy();
		this.#views = next;
	}

	/** A name the sections belong to: a string, `{ label?, name }` or a node; null for none. */
	set context(value) {
		const block = SidebarView.#block(value);
		if (this.#context) this.#context.replaceWith(...(block ? [block] : []));
		else if (block) this.#element.prepend(block);
		this.#context = block;
	}

	/** The top action, a link (`{ label, href, glyph? }`, the `plus` glyph by default), or null. */
	set action(action) {
		if (!action?.href || !action.label) {
			if (this.#action?.contains(this.#element.ownerDocument.activeElement)) this.#element.querySelector('.bui-sidebar-groups a[href]')?.focus({ preventScroll: true });
			this.#action?.remove();
			this.#action = null;
			return;
		}
		if (!this.#action) {
			this.#action = el('a', { class: 'bui-sidebar-item bui-sidebar-action' });
			this.#element.insertBefore(this.#action, this.#context?.nextSibling ?? this.#element.firstChild);
		}
		if (this.#action.getAttribute('href') !== action.href) this.#action.setAttribute('href', action.href);
		const name = action.glyph ?? 'plus';
		if (this.#action.dataset.glyph !== name || this.#action.textContent !== action.label) {
			fill(this.#action, [glyph(name), el('span', { class: 'bui-sidebar-label' }, [content(action.label)])]);
			this.#action.dataset.glyph = name;
		}
	}

	/** The shared search (`SidebarSearch`) this copy draws, or null. */
	set search(search) {
		if (this.#finder?.search === search) return;
		this.#finder?.destroy();
		this.#finder = search ? new SidebarFinder({ search, labels: this.#labels, groups: this.#groups }) : null;
		if (this.#finder) this.#element.insertBefore(this.#finder.field, this.#groups);
		if (this.#finder) this.#element.append(this.#finder.results);
		this.#groups.hidden = Boolean(this.#finder?.search.query);
	}

	destroy() {
		this.#finder?.destroy();
		for (const view of this.#views.values()) view.destroy();
		this.#views.clear();
	}

	static #block(value) {
		if (!value) return null;
		if (value.nodeType) return el('div', { class: 'bui-sidebar-context' }, [value.cloneNode(true)]);
		const { label = null, name } = typeof value === 'string' ? { name: value } : value;
		if (!name) return null;
		return el('div', { class: 'bui-sidebar-context' }, [label ? el('span', { class: 'bui-sidebar-context-label', text: label }) : null, el('span', { class: 'bui-sidebar-context-name', text: name })]);
	}
}
