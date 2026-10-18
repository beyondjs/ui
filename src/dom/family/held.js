import { NavigationMenu } from './menu.js';

/**
 * The menu a person has open in the family bar, held across a redraw (0.17.1, D95: what the person
 * opened stays as they left it). The bar draws its menus again when its descriptor, fallback or notice
 * changes; without this, a menu that was open went with the old drawing, with no exit, and focus fell to
 * the page.
 *
 * `of(bar)` reads the open menu before the redraw: which menu (its part), the entry holding focus (by
 * address and words, then by place), what was typed in its search field and how far it was scrolled.
 * `restore(menus)` opens the same menu of the new drawing in the same frame, already in place (no entry,
 * nothing moves), with its new contents, the same search applied, and focus on the same entry, on the
 * panel or left where it was. Escape then closes it as usual, with its exit.
 */
export class HeldMenu {
	#part;
	#focus;
	#query;
	#caret;
	#scroll;

	/** The menu open in `bar`, or null when none is. */
	static of(bar) {
		const button = bar.querySelector('[data-part] > .bui-navmenu-button[aria-expanded="true"]');
		return button ? new HeldMenu(button.parentElement) : null;
	}

	/** @param {HTMLElement} element the open menu's element (a part of the bar) */
	constructor(element) {
		const panel = element.querySelector(':scope > .bui-navmenu-panel');
		const active = element.ownerDocument.activeElement;
		const field = panel.querySelector('.bui-navmenu-field');
		this.#part = element.dataset.part;
		this.#scroll = panel.scrollTop;
		this.#query = field?.value ?? '';
		this.#caret = field === active ? [field.selectionStart, field.selectionEnd] : null;
		this.#focus = HeldMenu.#where(panel, active);
	}

	/** The part the held menu is (`product`, `organization`, `project`, `location`, `account`). */
	get part() {
		return this.#part;
	}

	/**
	 * Opens the same menu among `menus` (the new drawing's), as the person left it. Returns whether it
	 * is open.
	 *
	 * @param {NavigationMenu[]} menus
	 */
	restore(menus) {
		const same = menus.filter(menu => menu.element.dataset.part === this.#part);
		const menu = same.find(item => item.element.getClientRects().length > 0) ?? same[0];
		if (!menu || !menu.open({ arrive: false })) return false;
		const panel = menu.panel;
		// Already open to the person: it does not enter again
		for (const animation of panel.getAnimations?.({ subtree: true }) ?? []) animation.finish();
		const field = panel.querySelector('.bui-navmenu-field');
		if (field && this.#query) {
			field.value = this.#query;
			field.dispatchEvent(new field.ownerDocument.defaultView.Event('input', { bubbles: true }));
		}
		panel.scrollTop = this.#scroll;
		this.#return(panel, field);
		return true;
	}

	#return(panel, field) {
		const focus = this.#focus;
		if (!focus) return;
		if (focus.panel) return panel.focus({ preventScroll: true });
		if (focus.field && field) {
			field.focus({ preventScroll: true });
			if (this.#caret) field.setSelectionRange(...this.#caret);
			return;
		}
		const entries = NavigationMenu.entries(panel);
		const target = entries.find(node => HeldMenu.#same(node, focus)) ?? entries.find(node => node.textContent.trim() === focus.text) ?? entries[Math.min(focus.index, entries.length - 1)] ?? panel;
		target.focus({ preventScroll: true });
	}

	/** Where focus is in the panel: on the panel, on its search field or on an entry; null outside it. */
	static #where(panel, active) {
		if (!active || !panel.contains(active)) return null;
		if (active === panel) return { panel: true };
		if (active.matches('.bui-navmenu-field')) return { field: true };
		const entries = NavigationMenu.entries(panel);
		const entry = entries.find(node => node === active || node.contains(active)) ?? active;
		return { href: entry.getAttribute('href'), text: entry.textContent.trim(), index: Math.max(0, entries.indexOf(entry)) };
	}

	static #same(node, focus) {
		return node.getAttribute('href') === focus.href && node.textContent.trim() === focus.text;
	}
}
