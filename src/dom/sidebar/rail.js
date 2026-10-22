import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Hint } from '../core/hint.js';
import { KeyedList } from '../core/keyed.js';
import { Status } from '../status/status.js';

/**
 * An opt-in desktop rail over the sidebar's own sections and one contextual object group. Its `foot`
 * (0.19.1, D161) keeps the product's one object in use in view at the rail's end, as code editors keep
 * their remote machine: its glyph with its state's mark (`Status`: shape as well as hue), its name and
 * state as the control's name and hint, and a press that opens the product's own panel about it.
 */
export class SidebarRail extends Component {
	#element;
	#collapse;
	#order;
	#entries = new Map();
	#groups = [];
	#options = null;
	#labels;
	#panel;
	#onchange;
	#hint;
	#foot = null;

	constructor({ name, panel, labels, onchange }) {
		super();
		this.#panel = panel;
		this.#labels = labels;
		this.#onchange = onchange;
		this.#element = el('nav', { class: 'bui-sidebar-rail', 'aria-label': name });
		this.#order = new KeyedList(this.#element);
		this.#collapse = el('button', { type: 'button', class: 'bui-icon-button bui-sidebar-collapse', 'data-bui-hint': '', onclick: () => this.#change(false) }, [glyph('close')]);
		this.#hint = new Hint(this.#element);
	}

	get element() { return this.#element; }
	get collapse() { return this.#collapse; }
	get options() { return this.#options; }
	get enabled() { return this.#options !== null; }
	get shown() { return this.enabled && Boolean(this.#group) && this.#options.open !== false; }

	set options(value) {
		if (value !== null && value !== undefined && (typeof value !== 'object' || Array.isArray(value))) throw new TypeError("Sidebar rail is an options object or null");
		this.#options = value ? { ...value } : null;
		this.#draw();
	}

	set groups(groups) {
		this.#groups = Array.isArray(groups) ? groups : [];
		this.#draw();
	}

	open() {
		if (!this.shown && this.#group) this.#change(true);
	}

	/** Moves focus out before a contextual panel becomes hidden. */
	return() {
		const target = this.#entries.get(`object:${this.#options?.panel}`) ?? this.#element.querySelector('[aria-current="page"]') ?? this.#element.querySelector('a[href], button');
		target?.focus({ preventScroll: true });
	}

	destroy() {
		this.#hint.destroy();
		this.#collapse.remove();
		super.destroy();
	}

	get #group() {
		return this.#groups.find(group => group?.kind === 'object' && String(group.key ?? group.heading ?? '') === this.#options?.panel) ?? null;
	}

	#change(open) {
		if (!this.#options || !this.#group) return;
		this.#options = { ...this.#options, open };
		this.#draw();
		this.#onchange(open);
		if (!open) this.return();
		this.#options?.onchange?.(open);
	}

	#draw() {
		if (!this.enabled) {
			this.#order.order([]);
			this.#entries.clear();
			return;
		}
		const entries = [];
		for (const group of this.#groups) {
			if (!group || ['entries', 'object'].includes(group.kind)) continue;
			for (const item of group.items ?? []) if (item?.label) entries.push({ ...item, key: String(item.key ?? item.href ?? item.label), object: false });
		}
		const group = this.#group;
		if (group) entries.push({ key: `object:${this.#options.panel}`, order: this.#options.panel, label: group.heading, href: group.href, current: group.current, glyph: group.glyph ?? 'chat', object: true });
		const order = this.#options?.order ?? [];
		const rank = item => { const index = order.indexOf(item.order ?? item.key); return index < 0 ? order.length : index; };
		entries.sort((a, b) => rank(a) - rank(b));
		const kept = new Map();
		const nodes = entries.map(item => {
			let node = this.#entries.get(item.key);
			const tag = item.href ? 'a' : item.object ? 'button' : 'span';
			if (!node || node.localName !== tag) node = this.#make(item, tag);
			this.#patch(node, item);
			kept.set(item.key, node);
			return node;
		});
		const foot = this.#footing();
		this.#order.order(foot ? [...nodes, foot] : nodes);
		this.#entries = kept;
		this.#collapse.setAttribute('aria-label', this.#labels.text('hide', { name: SidebarRail.#text(group?.heading) }));
	}

	#make(item, tag) {
		return el(tag, { type: tag === 'button' ? 'button' : null, role: tag === 'span' ? 'link' : null, 'aria-disabled': tag === 'span' ? 'true' : null, tabindex: tag === 'span' ? '0' : null, class: 'bui-sidebar-rail-item', 'data-bui-hint': '', onclick: tag === 'button' ? () => this.#change(!this.shown) : null });
	}

	#patch(node, item) {
		const name = SidebarRail.#text(item.label);
		const mark = item.glyph ?? 'grid';
		const meta = item.meta === null || item.meta === undefined || item.meta === '' ? '' : String(item.meta);
		if (node.dataset.glyph !== mark || node.dataset.meta !== meta) {
			node.replaceChildren(glyph(mark), ...(meta ? [el('span', { class: 'bui-sidebar-rail-meta', 'aria-hidden': 'true', text: meta.length <= 3 ? meta : '•' })] : []));
			node.dataset.glyph = mark;
			node.dataset.meta = meta;
		}
		node.dataset.label = name;
		node.setAttribute('aria-label', meta ? `${name} · ${meta}` : name);
		if (item.current) node.setAttribute('aria-current', 'page');
		else node.removeAttribute('aria-current');
		if (item.object && !item.href) {
			node.setAttribute('aria-controls', this.#panel);
			node.setAttribute('aria-expanded', String(this.shown));
		} else {
			if (item.href) node.setAttribute('href', item.href);
		}
	}

	/** The foot's control, patched in place so a change of state keeps focus and its hint; null without a foot. */
	#footing() {
		const foot = this.#options?.foot;
		if (!foot?.label) return null;
		this.#foot ??= el('button', { type: 'button', class: 'bui-sidebar-rail-item bui-sidebar-rail-foot', 'data-bui-hint': '', 'aria-haspopup': 'dialog', onclick: () => this.#options?.foot?.onclick?.(this.#foot) });
		const name = SidebarRail.#text(foot.label);
		const state = foot.status?.state ?? null;
		const said = foot.status ? SidebarRail.#text(foot.status.label ?? Status.labels.en[state] ?? '') : '';
		const mark = foot.glyph ?? 'box';
		const tone = state ? Status.tone(state) : '';
		if (this.#foot.dataset.glyph !== mark || this.#foot.dataset.tone !== tone) {
			this.#foot.replaceChildren(glyph(mark), ...(tone ? [el('span', { class: `bui-status bui-status-${tone} bui-sidebar-rail-state`, 'aria-hidden': 'true' }, [el('span', { class: 'bui-status-dot' })])] : []));
			this.#foot.dataset.glyph = mark;
			this.#foot.dataset.tone = tone;
		}
		this.#foot.dataset.state = state ?? '';
		this.#foot.setAttribute('aria-label', said ? `${name} · ${said}` : name);
		return this.#foot;
	}

	static #text(value) { return value?.textContent ?? String(value ?? ''); }
}
