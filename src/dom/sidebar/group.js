import { el, fill, content } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { KeyedList } from '../core/keyed.js';
import { hidden } from '../feedback.js';
import { SidebarItem } from './item.js';

/**
 * One group of a sidebar, patched by key: a heading when it has one (naming its list), its items and,
 * for a group of entries, a `more` link after them ("All conversations"). Items are matched by `key`
 * (else `href`, else label), so an update changes only what differs, keeps every link that stays in
 * place (the one holding focus is never moved) and removes what left; focus on a removed link moves
 * to the one now at its place.
 *
 * Since 0.11.0 a group may say how many items it holds (`count`, "Recent, 12") beside its heading.
 */
export class SidebarGroup {
	#element;
	#list = el('ul', { class: 'bui-sidebar-list' });
	#order = new KeyedList(this.#list);
	#heading = null;
	#more = null;
	#items = new Map();
	#entries;
	#labels;

	/** @param {{kind: 'sections'|'entries', labels?: import('../core/labels.js').Labels|null}} options */
	constructor({ kind, labels = null }) {
		this.#entries = kind === 'entries';
		this.#labels = labels;
		this.#element = el('div', { class: `bui-sidebar-group${this.#entries ? ' bui-sidebar-entries' : ''}` }, [this.#list]);
	}

	get element() {
		return this.#element;
	}

	get kind() {
		return this.#entries ? 'entries' : 'sections';
	}

	/** The label of its current item, or null. */
	get current() {
		for (const item of this.#items.values()) if (item.current) return item.text;
		return null;
	}

	/** @param {{heading?: string|Node|null, count?: number|string|null, items: Array<object|null|false>, more?: {label: string, href: string}|null}} group */
	update({ heading = null, count = null, items = [], more = null }) {
		this.#head(heading, count);
		const seen = new Map();
		const next = new Map();
		for (const item of items.filter(Boolean)) {
			const base = String(item.key ?? item.href ?? (typeof item.label === 'string' ? item.label : ''));
			const count = seen.get(base) ?? 0;
			seen.set(base, count + 1);
			const key = count ? `${base}\u0000${count}` : base;
			const view = this.#items.get(key) ?? new SidebarItem({ entry: this.#entries, labels: this.#labels });
			view.update(item);
			next.set(key, view);
		}
		this.#order.order([...next.values()].map(view => view.element));
		for (const [key, view] of this.#items) if (next.get(key) !== view) view.destroy();
		this.#items = next;
		this.#link(this.#entries ? more : null);
	}

	destroy() {
		for (const view of this.#items.values()) view.destroy();
		this.#items.clear();
	}

	#head(heading, count) {
		if (heading === null || heading === undefined || heading === '') {
			this.#heading?.remove();
			this.#heading = null;
			this.#list.removeAttribute('aria-labelledby');
			return;
		}
		if (!this.#heading) {
			this.#heading = el('p', { id: Ids.next('bui-sidebar-heading'), class: 'bui-sidebar-heading' });
			this.#element.prepend(this.#heading);
		}
		const counted = count === null || count === undefined || count === '' ? null : String(count);
		const text = counted === null ? heading : `${heading}, ${counted}`;
		if (typeof heading !== 'string' || this.#heading.textContent !== text) fill(this.#heading, [content(heading), counted === null ? null : [hidden(', '), el('span', { class: 'bui-sidebar-count', text: counted })]]);
		this.#list.setAttribute('aria-labelledby', this.#heading.id);
	}

	/** The `more` link after the entries, patched in place. */
	#link(more) {
		if (!more?.href || !more.label) {
			if (this.#more?.contains(this.#more.ownerDocument.activeElement)) this.#list.querySelector('a[href]')?.focus({ preventScroll: true });
			this.#more?.remove();
			this.#more = null;
			return;
		}
		if (!this.#more) {
			this.#more = el('a', { class: 'bui-sidebar-item bui-sidebar-more' }, [el('span', { class: 'bui-sidebar-label' })]);
			this.#element.append(this.#more);
		}
		if (this.#more.getAttribute('href') !== more.href) this.#more.setAttribute('href', more.href);
		const label = this.#more.firstChild;
		if (label.textContent !== more.label) label.textContent = more.label;
	}
}
