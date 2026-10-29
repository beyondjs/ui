import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { SidebarView } from './view.js';

/** Global destination presentation; independent from the contextual panel and mobile drawer. */
export class SidebarNavigation {
	#element;
	#button;
	#view;
	#search;
	#options = null;
	#storage = null;
	#collapsed = false;
	#labels;
	#change;
	#window;
	#place = null;
	#inline = false;
	#finding = false;
	#panel;
	#global;

	constructor({ name, labels, view, change, panel, global }) {
		this.#panel = panel;
		this.#global = global;
		this.#labels = labels;
		this.#window = view;
		this.#change = change;
		this.#view = new SidebarView({ name, labels });
		this.#view.element.setAttribute('role', 'presentation');
		this.#view.element.removeAttribute('aria-label');
		this.#button = el('button', { type: 'button', class: 'bui-sidebar-global-toggle', 'aria-controls': panel, 'data-bui-hint': '', onclick: () => this.set(!this.#collapsed) }, [glyph('menu')]);
		this.#search = el('button', { type: 'button', class: 'bui-sidebar-global-search', 'data-bui-hint': '', hidden: true, onclick: () => { this.set(false); (this.#place?.() || this.#view.seek()); } }, [glyph('search')]);
		this.#element = el('div', { class: 'bui-sidebar-global-head' }, [this.#button, this.#search, this.#view.element]);
	}

	get element() { return this.#element; }
	get enabled() { return this.#options !== null; }
	get options() { return this.#options; }
	get collapsed() { return this.#collapsed; }
	set inline(value) { this.#inline = value; this.#draw(); }

	set options(value) {
		if (value != null && (typeof value !== 'object' || !String(value.key ?? '').trim())) throw new TypeError('Sidebar navigation needs a stable product key');
		const previous = this.#options;
		this.#options = value ? { ...value } : null;
		if (!value) return;
		if (value.key !== previous?.key || value.storage !== previous?.storage) {
			try { this.#storage = value.storage === undefined ? this.#window?.localStorage : value.storage; } catch { this.#storage = null; }
			try { this.#collapsed = this.#storage?.getItem(this.#key) === 'collapsed'; } catch { this.#collapsed = false; }
		}
		if (typeof value.collapsed === 'boolean') this.#collapsed = value.collapsed;
		this.#draw();
	}

	/** Only explicit desktop choices write storage and notify the product. */
	set(value) {
		if (!this.enabled || this.#collapsed === Boolean(value)) return;
		if (this.#view.element.contains(this.#element.ownerDocument.activeElement)) this.#button.focus({ preventScroll: true });
		this.#collapsed = Boolean(value);
		try { this.#storage?.setItem(this.#key, this.#collapsed ? 'collapsed' : 'expanded'); } catch { /* Keep this view's choice. */ }
		this.#draw();
		this.#change();
		this.#options.onchange?.(this.#collapsed);
	}

	set context(value) { this.#view.context = value; }
	set action(value) { this.#view.action = value; this.#draw(); }
	set search(value) {
		this.#view.search = value;
		this.#finding = Boolean(value);
		this.#draw();
		this.#search.setAttribute('aria-label', value?.config.label ?? this.#labels.text('search'));
	}
	place(callback) { this.#place = callback; }
	seek() { this.set(false); return this.#view.seek(); }
	destroy() { this.#view.destroy(); this.#element.remove(); }

	get #key() { return `bui-sidebar-navigation:v1:${this.#options.key}`; }
	#draw() {
		this.#button.setAttribute('aria-controls', this.#inline ? this.#panel : this.#global);
		this.#element.toggleAttribute('data-collapsed', this.#collapsed);
		this.#view.element.hidden = this.#inline || this.#collapsed;
		this.#search.hidden = !this.#finding || !this.#collapsed;
		this.#button.setAttribute('aria-expanded', String(!this.#collapsed));
		this.#button.setAttribute('aria-label', this.#labels.text(this.#collapsed ? 'expand' : 'collapse'));
		const action = this.#view.element.querySelector('.bui-sidebar-action');
		if (action) { action.setAttribute('aria-label', action.textContent.trim()); action.toggleAttribute('data-bui-hint', this.#collapsed); }
	}
}
