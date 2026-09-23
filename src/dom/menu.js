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
 * Items: `{ label, run?, href?, disabled?, reason?, tone? }`; `tone: 'danger'` marks destructive ones.
 */
export class ActionMenu extends Component {
	#element;
	#button;
	#list;
	#items = [];
	#open = false;
	#release = null;

	constructor({ label, name = null, items, align = 'end', glyph = 'more' }) {
		super();
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
			this.#release = this.listen(this.#element.ownerDocument, 'pointerdown', event => {
				if (!this.#element.contains(event.target)) this.close(false);
			});
		}
		const targets = this.#items.map(entry => entry.node);
		targets.at(index < 0 ? targets.length + index : index)?.focus();
	}

	close(refocus = false) {
		if (!this.#open) return;
		this.#open = false;
		this.#list.hidden = true;
		this.#button.setAttribute('aria-expanded', 'false');
		this.#release?.();
		if (refocus) this.#button.focus();
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
			targets[(next + targets.length) % targets.length]?.focus();
		}
	}
}
