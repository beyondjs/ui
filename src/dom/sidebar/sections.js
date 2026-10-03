import { el, content } from '../core/element.js';
import { Ids } from '../core/ids.js';

/**
 * The content of a product's sidebar, drawn the same in the permanent sidebar and in the drawer: an
 * optional context block (what the sections belong to, such as the project in view, as text and
 * never as a control: the family bar chooses the project) and groups of links, the current one with
 * `aria-current="page"`. Each call to `navigation()` builds new nodes with their own ids.
 */
export class SidebarSections {
	#name;
	#groups = [];
	#context = null;

	/**
	 * @param {object} options
	 * @param {string} options.name the navigation's accessible name ("Delegate sections")
	 */
	constructor({ name }) {
		this.#name = name;
	}

	/** `[{ heading?, items: [{ label, href, current?, meta? }] }]`; empty groups are left out. */
	set groups(value) {
		this.#groups = (Array.isArray(value) ? value : []).filter(group => group && Array.isArray(group.items) && group.items.some(Boolean));
	}

	/** A name the sections belong to: a string, `{ label?, name }` or a node; null for none. */
	set context(value) {
		this.#context = value ?? null;
	}

	/** The label of the current item, or null. */
	get current() {
		for (const group of this.#groups) for (const item of group.items) if (item?.current) return item.label;
		return null;
	}

	/** A new `<nav>` with the context and the groups. */
	navigation() {
		return el('nav', { class: 'bui-sidebar-nav', 'aria-label': this.#name }, [this.#block(), ...this.#groups.map(group => this.#group(group))]);
	}

	#block() {
		const value = this.#context;
		if (!value) return null;
		if (value.nodeType) return el('div', { class: 'bui-sidebar-context' }, [value.cloneNode(true)]);
		const { label = null, name } = typeof value === 'string' ? { name: value } : value;
		if (!name) return null;
		return el('div', { class: 'bui-sidebar-context' }, [label ? el('span', { class: 'bui-sidebar-context-label', text: label }) : null, el('span', { class: 'bui-sidebar-context-name', text: name })]);
	}

	#group({ heading = null, items }) {
		const id = heading ? Ids.next('bui-sidebar-heading') : null;
		return el('div', { class: 'bui-sidebar-group' }, [
			heading ? el('p', { id, class: 'bui-sidebar-heading' }, [content(heading)]) : null,
			el('ul', { class: 'bui-sidebar-list', 'aria-labelledby': id }, items.filter(Boolean).map(item => el('li', {}, [SidebarSections.#item(item)])))
		]);
	}

	static #item({ label, href = null, current = false, meta = null }) {
		const children = [el('span', { class: 'bui-sidebar-label' }, [content(label)]), meta !== null && meta !== undefined && meta !== '' ? el('span', { class: 'bui-sidebar-meta' }, [content(meta)]) : null];
		if (!href) return el('span', { class: 'bui-sidebar-item', 'aria-disabled': 'true', 'aria-current': current ? 'page' : null }, children);
		return el('a', { class: 'bui-sidebar-item', href, 'aria-current': current ? 'page' : null }, children);
	}
}
