import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';

/** The object's optional action in the narrow sidebar row, kept separate from its navigation. */
export class SidebarStart {
	#row;
	#element = null;

	constructor(row) { this.#row = row; }

	set groups(groups) {
		const action = (Array.isArray(groups) ? groups : []).find(group => group?.kind === 'object' && group.action?.row && group.action.href && group.action.label)?.action ?? null;
		if (!action) return this.destroy();
		this.#element ??= el('a', { class: 'bui-sidebar-item bui-sidebar-start' });
		if (this.#element.getAttribute('href') !== action.href) this.#element.setAttribute('href', action.href);
		if (this.#element.textContent !== action.label) this.#element.replaceChildren(glyph(action.glyph ?? 'plus'), el('span', { class: 'bui-sidebar-label', text: action.label }));
		if (this.#element.parentNode !== this.#row) this.#row.append(this.#element);
	}

	destroy() {
		this.#element?.remove();
		this.#element = null;
	}
}
