import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { hidden } from '../feedback.js';

/**
 * The heading of a group of a sidebar's entries as a disclosure (0.14.0, D97): a button with the
 * chevron, the group's name and its count, which the count keeps while the group is folded ("Recent,
 * 12"). Folded, the group lists only its current item (`li[data-current]`) and hides its `more` link.
 * The choice is the person's, kept per device and product (`SidebarFolds`), and both copies of the
 * sidebar follow it. A group whose items need the person (`attention`) keeps its tone while folded and
 * opens by itself when an item that needs the person arrives. Sections never fold.
 */
export class SidebarFold {
	#element = el('p', { id: Ids.next('bui-sidebar-heading'), class: 'bui-sidebar-heading bui-sidebar-folding' });
	#button;
	#group;
	#list;
	#folds;
	#key = null;
	#seen = null;
	#attention = false;
	#release;

	/**
	 * @param {object} options
	 * @param {import('./folds.js').SidebarFolds} options.folds the sidebar's kept choices
	 * @param {HTMLElement} options.group the group's element (`data-folded` while folded)
	 * @param {HTMLElement} options.list the group's list, which the button controls
	 */
	constructor({ folds, group, list }) {
		this.#folds = folds;
		this.#group = group;
		this.#list = list;
		list.id ||= Ids.next('bui-sidebar-list');
		this.#button = el('button', { type: 'button', class: 'bui-sidebar-fold', 'aria-controls': list.id, onclick: () => this.toggle() });
		this.#element.append(this.#button);
		this.#release = folds.subscribe(group => group === this.#key && this.#paint());
	}

	/** The heading (`p`), whose id names the list. */
	get element() {
		return this.#element;
	}

	/** Whether the group is folded now. */
	get folded() {
		return this.#key !== null && this.#folds.folded(this.#key);
	}

	/**
	 * @param {{key: string, heading: string|Node, count?: string|null, attention?: boolean, items?: string[]}} values
	 *   the group's key (its kept choice), name, count, whether its items need the person, and their keys
	 */
	update({ key, heading, count = null, attention = false, items = [] }) {
		if (this.#key !== key) this.#seen = null;
		this.#key = key;
		this.#attention = Boolean(attention);
		const text = count === null ? heading : `${heading}, ${count}`;
		if (typeof heading !== 'string' || this.#button.dataset.text !== text) {
			fill(this.#button, [glyph('chevron'), el('span', { class: 'bui-sidebar-fold-label' }, [content(heading)]), count === null ? null : [hidden(', '), el('span', { class: 'bui-sidebar-count', text: count })]]);
			this.#button.dataset.text = typeof heading === 'string' ? text : '';
		}
		this.#group.toggleAttribute('data-attention', this.#attention);
		// A group that needs the person opens by itself when something new needs them
		const arrived = this.#seen !== null && items.some(item => !this.#seen.has(item));
		this.#seen = new Set(items);
		if (this.#attention && arrived && this.folded) this.#folds.keep(this.#key, false);
		this.#paint();
	}

	/** Folds or opens the group, as a press does, and keeps the choice. */
	toggle(folded = !this.folded) {
		if (this.#key !== null) this.#folds.keep(this.#key, folded);
	}

	destroy() {
		this.#release();
		this.#element.remove();
		this.#group.removeAttribute('data-folded');
		this.#group.removeAttribute('data-attention');
	}

	#paint() {
		const folded = this.folded;
		this.#button.setAttribute('aria-expanded', String(!folded));
		this.#group.toggleAttribute('data-folded', folded);
	}
}
