import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { icon } from './core/icons.js';
import { Ids } from './core/ids.js';

/**
 * A menu button of actions: the ARIA menu pattern.
 *
 * The button opens the menu and focuses its first item (ArrowUp opens on the last). Arrow keys, Home
 * and End move between items, Escape closes and returns focus to the button, Tab closes and moves
 * on, and a press outside closes. A disabled item stays reachable so its reason can be read, but it
 * does nothing. Choosing an item closes the menu, returns focus and runs the item.
 *
 * The list stays inside the viewport. With `placement: 'auto'` (the default) it opens below the
 * button, or above it when there is no room below and more room above; `'below'` and `'above'` fix
 * the side. Whatever the side, it is shifted sideways when an edge of the viewport would cut it, and
 * no taller than the room on its side (it then scrolls). Moving focus into it, within it and back to
 * the button never scrolls the page or a scroll container around the menu.
 *
 * Items: `{ label, run?, href?, disabled?, reason?, tone? }`; `tone: 'danger'` marks destructive ones.
 */
export class ActionMenu extends Component {
	static #margin = 8;
	#element;
	#button;
	#list;
	#items = [];
	#open = false;
	#release = null;
	#placement;

	/**
	 * @param {object} options
	 * @param {string|Node|null} options.label visible content of the button
	 * @param {string|null} [options.name] accessible name of the button when the label is not enough
	 * @param {Array<object|null|false>} options.items the actions
	 * @param {'start'|'end'} [options.align] which edge of the button the list aligns to
	 * @param {string|null} [options.glyph] the button's icon
	 * @param {'auto'|'below'|'above'} [options.placement] which side of the button the list opens on
	 */
	constructor({ label, name = null, items, align = 'end', glyph = 'more', placement = 'auto' }) {
		super();
		this.#placement = ['auto', 'below', 'above'].includes(placement) ? placement : 'auto';
		const id = Ids.next('bui-menu');
		this.#button = el(
			'button',
			{
				type: 'button',
				class: 'bui-menu-button',
				'aria-haspopup': 'menu',
				'aria-expanded': 'false',
				'aria-controls': id,
				'aria-label': name,
				onclick: () => (this.#open ? this.close(true) : this.open(0)),
				onkeydown: event => this.#opener(event)
			},
			[glyph ? icon(glyph) : null, label ? el('span', {}, [content(label)]) : null]
		);
		this.#list = el('ul', { id, class: `bui-menu bui-align-${align}`, role: 'menu', hidden: true, onkeydown: event => this.#keys(event) });
		this.items = items;
		this.#element = el('div', { class: 'bui-menu-holder' }, [this.#button, this.#list]);
	}

	get element() {
		return this.#element;
	}

	get expanded() {
		return this.#open;
	}

	/** Replaces the items. */
	set items(items) {
		this.#items = items.filter(Boolean).map(item => this.#item(item));
		this.#list.replaceChildren(...this.#items.map(entry => entry.holder));
	}

	/** Opens the menu and focuses the item at `index` (negative counts from the end). */
	open(index = 0) {
		if (this.destroyed) return;
		if (!this.#open) {
			this.#open = true;
			this.#list.hidden = false;
			this.#button.setAttribute('aria-expanded', 'true');
			this.#place();
			this.#release = this.listen(this.#element.ownerDocument, 'pointerdown', event => {
				if (!this.#element.contains(event.target)) this.close(false);
			});
		}
		const targets = this.#items.map(entry => entry.node);
		targets.at(index < 0 ? targets.length + index : index)?.focus({ preventScroll: true });
	}

	close(refocus = false) {
		if (!this.#open) return;
		this.#open = false;
		this.#list.hidden = true;
		this.#button.setAttribute('aria-expanded', 'false');
		this.#release?.();
		if (refocus) this.#button.focus({ preventScroll: true });
	}

	/**
	 * Keeps the open list inside the viewport: on the side its placement asks for (below, or above when
	 * `auto` finds no room below and more room above), shifted sideways when an edge would cut it, and
	 * no taller than the room on its side.
	 */
	#place() {
		const list = this.#list;
		list.classList.remove('bui-menu-above');
		list.style.removeProperty('max-height');
		list.style.removeProperty('translate');
		const view = this.#element.ownerDocument.defaultView;
		if (!view) return;
		const margin = ActionMenu.#margin;
		const anchor = this.#button.getBoundingClientRect();
		const height = list.getBoundingClientRect().height;
		const below = view.innerHeight - anchor.bottom - margin;
		const above = anchor.top - margin;
		const up = this.#placement === 'above' || (this.#placement === 'auto' && height > below && above > below);
		list.classList.toggle('bui-menu-above', up);
		const box = list.getBoundingClientRect();
		const room = up ? box.bottom - margin : view.innerHeight - margin - box.top;
		if (box.height > room) list.style.maxHeight = `${Math.max(Math.floor(room), 0)}px`;
		const shift = box.left < margin ? margin - box.left : box.right > view.innerWidth - margin ? view.innerWidth - margin - box.right : 0;
		if (shift) list.style.translate = `${Math.round(shift)}px 0`;
	}

	#item({ label, run = null, href = null, disabled = false, reason = null, tone = null }) {
		const note = reason ? Ids.next('bui-reason') : null;
		const props = {
			role: 'menuitem',
			tabindex: '-1',
			class: `bui-menu-item${tone ? ` bui-menu-item-${tone}` : ''}`,
			'aria-disabled': disabled ? 'true' : null,
			'aria-describedby': note
		};
		const children = [el('span', {}, [content(label)]), reason ? el('span', { id: note, class: 'bui-menu-reason', text: reason }) : null];
		const node = href && !disabled ? el('a', { ...props, href }, children) : el('button', { ...props, type: 'button' }, children);
		node.addEventListener('click', event => {
			if (disabled) {
				event.preventDefault();
				return;
			}
			this.close(!href);
			run?.(event);
		});
		return { node, holder: el('li', { role: 'none' }, [node]) };
	}

	#opener(event) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			this.open(event.key === 'ArrowDown' ? 0 : -1);
		}
	}

	#keys(event) {
		const targets = this.#items.map(entry => entry.node);
		const index = targets.indexOf(this.#element.ownerDocument.activeElement);
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			this.close(true);
		} else if (event.key === 'Tab') this.close(false);
		else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
			event.preventDefault();
			const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: targets.length - 1 }[event.key];
			targets[(next + targets.length) % targets.length]?.focus({ preventScroll: true });
		}
	}
}
