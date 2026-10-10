import { Component } from '../core/component.js';
import { el, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Interaction } from '../core/interaction.js';
import { Disclosure } from '../disclosure.js';
import { hidden } from '../feedback.js';

/**
 * A navigation menu of the family bar: the shared `Disclosure` holding sections of links.
 *
 * It follows the disclosure pattern rather than the ARIA menu role, because its entries are ordinary
 * navigation links (`ActionMenu` is for actions on a record). The disclosure owns opening with Enter
 * or Space, Escape returning focus to the button and closing on a press outside; this adds what a
 * navigation list needs: section headings, arrow keys, Home and End between entries, closing once an
 * entry is chosen and closing when focus moves on past it (Tab out of the panel).
 *
 * Opened from the keyboard, focus goes to the first entry (or the menu's search field); opened with a
 * pointer, it goes to the panel itself, so no entry looks focused and the arrow keys still start at
 * the first one. Entries paint focus only for keyboard use (`:focus-visible`). An entry that is not a
 * link (an unavailable product) is `aria-disabled`, still reachable, so its reason can be read.
 */
export class NavigationMenu extends Component {
	static #reachable = '.bui-navmenu-field, .bui-navmenu-notice a, .bui-navmenu-notice button, .bui-navmenu-item';

	#disclosure;

	/**
	 * @param {object} options
	 * @param {string|Node|Array<string|Node>} options.label visible content of the button (a chevron follows)
	 * @param {string} options.name accessible name of the button, stating what it chooses
	 * @param {Array<{heading?: string|Node|null, lead?: Array<Node|null>, items: Array<Node|null>, class?: string}|null>} options.sections
	 * @param {'start'|'end'} [options.align]
	 * @param {string} [options.part] names the menu for focus restoration after a redraw
	 * @param {string} [options.class]
	 * @param {boolean} [options.hint] the button shows glyphs alone: its name appears as a tooltip (D11)
	 * @param {boolean} [options.chevron] whether the disclosure chevron follows the label; the avatar has none (D78, 0.13.0)
	 * @param {(open: boolean) => void} [options.onchange] after the menu opens or closes
	 */
	constructor({ label, name, sections, align = 'start', part = null, hint = false, chevron = true, onchange = null, class: extra = '' }) {
		super();
		this.#disclosure = new Disclosure({
			label: [].concat(label, chevron ? glyph('chevron') : []),
			name,
			align,
			hint,
			class: `bui-navmenu ${extra}`.trim(),
			children: sections.filter(Boolean).map(section => this.#section(section)),
			onchange: open => {
				if (open) this.#arrive();
				onchange?.(open);
			}
		});
		const { element, button, panel } = this.#disclosure;
		if (part) element.dataset.part = part;
		button.classList.add('bui-navmenu-button');
		panel.classList.add('bui-navmenu-panel');
		panel.tabIndex = -1;
		panel.addEventListener('keydown', event => this.#keys(event));
		// An entry marked `data-bui-keep` (signing out) keeps the menu open while it works.
		panel.addEventListener('click', event => {
			const target = event.target.closest('a[href], button');
			if (target && !target.hasAttribute('data-bui-keep')) this.#disclosure.close(false);
		});
		// Tab past the last entry (or Shift+Tab before the button) leaves the menu: it closes. A focus
		// change with no new target (a press on the panel's text, the window losing focus) keeps it open.
		element.addEventListener('focusout', event => {
			const next = event.relatedTarget;
			if (!this.expanded) return;
			if (next) {
				if (!element.contains(next)) this.#disclosure.close(false);
				return;
			}
			// Some engines (WebKit) report no new target: look once focus has settled.
			this.later(() => {
				const active = element.ownerDocument.activeElement;
				if (this.expanded && active && active !== element.ownerDocument.body && !element.contains(active)) this.#disclosure.close(false);
			}, 0);
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

	#arrive() {
		const keyboard = Interaction.of(this.element.ownerDocument)?.keyboard ?? false;
		const target = keyboard ? this.#entries()[0] : null;
		(target ?? this.panel).focus({ preventScroll: true });
	}

	#section({ heading = null, lead = [], items, class: extra = '' }) {
		const id = heading ? Ids.next('bui-navmenu-heading') : null;
		return el('div', { class: `bui-navmenu-section ${extra}`.trim() }, [
			heading ? el('p', { id, class: 'bui-navmenu-heading' }, [content(heading)]) : null,
			...lead.filter(Boolean),
			el('ul', { class: 'bui-navmenu-list', 'aria-labelledby': id }, items.filter(Boolean).map(item => (item.tagName === 'LI' ? item : el('li', {}, [item]))))
		]);
	}

	/** The entries arrow keys move between: the search field, links, buttons and unavailable entries that are shown. */
	#entries() {
		const view = this.element.ownerDocument.defaultView;
		const shown = node => view.getComputedStyle(node).display !== 'none' && !node.closest('[hidden]');
		return [...this.panel.querySelectorAll(NavigationMenu.#reachable)].filter(node => shown(node) && shown(node.parentElement) && shown(node.closest('.bui-navmenu-section')));
	}

	#keys(event) {
		if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
		// In the search field Home and End move the caret.
		if (event.target.matches?.('input') && (event.key === 'Home' || event.key === 'End')) return;
		event.preventDefault();
		const items = this.#entries();
		const index = items.indexOf(this.element.ownerDocument.activeElement);
		const from = index < 0 && event.key === 'ArrowUp' ? items.length : index;
		const next = { ArrowDown: from + 1, ArrowUp: from - 1, Home: 0, End: items.length - 1 }[event.key];
		items[(next + items.length) % items.length]?.focus({ preventScroll: true });
	}
}

/**
 * One entry of a navigation menu: a link, a button (`run`) or, with neither, an unavailable entry
 * (`aria-disabled`, focusable, reachable by the arrow keys) that goes nowhere. `note` is a node after
 * the text, such as a badge with a reason; `state` is a short neutral text at the row's end that is
 * also part of its accessible name ("Handbook, Not set up in Delegate"); `current` is `aria-current`.
 */
export function entry({ label, meta = null, href = null, run = null, current = null, note = null, state = null, class: extra = '' }) {
	const children = [
		el('span', { class: 'bui-navmenu-text' }, [el('span', { class: 'bui-navmenu-label' }, [content(label)]), meta ? el('span', { class: 'bui-navmenu-meta' }, [content(meta)]) : null]),
		state ? el('span', { class: 'bui-navmenu-state' }, [hidden(', '), content(state)]) : null,
		note
	];
	const kind = href || run ? '' : ' bui-navmenu-item-off';
	const props = { class: `bui-navmenu-item${kind} ${extra}`.trim(), 'aria-current': current };
	if (href) return el('a', { ...props, href }, children);
	if (run) return el('button', { ...props, type: 'button', onclick: run }, children);
	return el('span', { ...props, role: 'link', 'aria-disabled': 'true', tabindex: '0' }, children);
}
