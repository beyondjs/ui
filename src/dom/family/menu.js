import { Component } from '../core/component.js';
import { el, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Disclosure } from '../disclosure.js';

/**
 * A navigation menu of the family bar: the shared `Disclosure` holding sections of links.
 *
 * It follows the disclosure pattern rather than the ARIA menu role, because its entries are ordinary
 * navigation links (`ActionMenu` is for actions on a record). The disclosure owns opening with Enter
 * or Space, Escape returning focus to the button and closing on a press outside; this adds what a
 * navigation list needs: section headings, focus on the first entry when it opens, arrow keys, Home
 * and End between entries, and closing once an entry is chosen. An entry that is not a link (an
 * unavailable product) stays reachable with the arrow keys, so its reason can be read.
 */
export class NavigationMenu extends Component {
	#disclosure;

	/**
	 * @param {object} options
	 * @param {string|Node|Array<string|Node>} options.label visible content of the button (a chevron follows)
	 * @param {string} options.name accessible name of the button, stating what it chooses
	 * @param {Array<{heading?: string|Node|null, items: Array<Node|null>, class?: string}|null>} options.sections
	 * @param {'start'|'end'} [options.align]
	 * @param {string} [options.part] names the menu for focus restoration after a redraw
	 * @param {string} [options.class]
	 */
	constructor({ label, name, sections, align = 'start', part = null, class: extra = '' }) {
		super();
		this.#disclosure = new Disclosure({
			label: [].concat(label, glyph('chevron')),
			name,
			align,
			class: `bui-navmenu ${extra}`.trim(),
			children: sections.filter(Boolean).map(section => this.#section(section)),
			onchange: open => open && this.#entries()[0]?.focus({ preventScroll: true })
		});
		const { element, button, panel } = this.#disclosure;
		if (part) element.dataset.part = part;
		button.classList.add('bui-navmenu-button');
		panel.classList.add('bui-navmenu-panel');
		panel.addEventListener('keydown', event => this.#keys(event));
		panel.addEventListener('click', event => {
			if (event.target.closest('a[href], button')) this.#disclosure.close(false);
		});
	}

	get element() {
		return this.#disclosure.element;
	}

	get button() {
		return this.#disclosure.button;
	}

	get panel() {
		return this.#disclosure.panel;
	}

	get expanded() {
		return this.#disclosure.expanded;
	}

	open() {
		this.#disclosure.open();
	}

	close(refocus = false) {
		this.#disclosure.close(refocus);
	}

	destroy() {
		this.#disclosure.destroy();
		super.destroy();
	}

	#section({ heading = null, items, class: extra = '' }) {
		const id = heading ? Ids.next('bui-navmenu-heading') : null;
		return el('div', { class: `bui-navmenu-section ${extra}`.trim() }, [
			heading ? el('p', { id, class: 'bui-navmenu-heading' }, [content(heading)]) : null,
			el('ul', { class: 'bui-navmenu-list', 'aria-labelledby': id }, items.filter(Boolean).map(item => el('li', {}, [item])))
		]);
	}

	/** The entries arrow keys move between: links, buttons and unavailable entries that are shown. */
	#entries() {
		const view = this.element.ownerDocument.defaultView;
		const shown = node => view.getComputedStyle(node).display !== 'none';
		return [...this.panel.querySelectorAll('.bui-navmenu-item')].filter(node => shown(node.parentElement) && shown(node.closest('.bui-navmenu-section')));
	}

	#keys(event) {
		if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
		event.preventDefault();
		const items = this.#entries();
		const index = items.indexOf(this.element.ownerDocument.activeElement);
		const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: items.length - 1 }[event.key];
		items[(next + items.length) % items.length]?.focus({ preventScroll: true });
	}
}

/**
 * One entry of a navigation menu: a link, a button (`run`) or, with neither, an unavailable entry
 * that is reachable by the arrow keys but goes nowhere. `note` is a node after the text, such as a
 * badge with a reason; `current` is the `aria-current` value.
 */
export function entry({ label, meta = null, href = null, run = null, current = null, note = null, class: extra = '' }) {
	const children = [
		el('span', { class: 'bui-navmenu-text' }, [el('span', { class: 'bui-navmenu-label' }, [content(label)]), meta ? el('span', { class: 'bui-navmenu-meta' }, [content(meta)]) : null]),
		note
	];
	const kind = href || run ? '' : ' bui-navmenu-item-off';
	const props = { class: `bui-navmenu-item${kind} ${extra}`.trim(), 'aria-current': current };
	if (href) return el('a', { ...props, href }, children);
	if (run) return el('button', { ...props, type: 'button', onclick: run }, children);
	return el('span', { ...props, tabindex: '-1' }, children);
}
