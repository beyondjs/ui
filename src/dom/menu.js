import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { Glyph } from './core/icons.js';
import { Hint } from './core/hint.js';
import { Ids } from './core/ids.js';
import { Floating } from './core/floating.js';
import { Leaving } from './core/leaving.js';

/**
 * A menu button of actions: the ARIA menu pattern.
 *
 * The button opens the menu and focuses its first item (ArrowUp opens on the last). Arrow keys, Home
 * and End move between items, Escape closes and returns focus to the button, Tab closes and moves
 * on, and a press outside closes. A disabled item stays reachable so its reason can be read, but it
 * does nothing. Choosing an item closes the menu, returns focus and runs the item. Since 0.34.0 (D183) an
 * item may wait (`waiting`) for a step not yet taken: it looks quiet, as a disabled one, and a press still
 * closes the menu and runs it, so its `run` puts the person where they can act.
 *
 * The list is placed by `Floating` (0.15.0): in the top layer, so no scroller clips it, on its
 * preferred side (`placement: 'auto'` and `'below'` prefer below, `'above'` above) and flipped when that
 * side has no room and the other has more, shifted to stay inside the room, capped to it (it then
 * scrolls), never under the family bar, and placed again while the page scrolls or resizes. A button
 * that is not drawn opens nothing: `open()` returns false and the button dispatches `bui-refused`.
 * Moving focus into it, within it and back to the button never scrolls the page or a scroll container
 * around the menu.
 *
 * Items: `{ label, run?, href?, disabled?, reason?, tone?, waiting? }`; `tone: 'danger'` marks destructive ones.
 *
 * Since 0.14.0 (D95) a closed menu leaves as it came: the list is hidden at once and an inert picture of
 * it eases out (`Leaving`), none under reduced motion.
 */
export class ActionMenu extends Component {
	#hint;
	#element;
	#button;
	#list;
	#items = [];
	#open = false;
	#release = null;
	#floating;
	#picture = null;

	/**
	 * @param {object} options
	 * @param {string|Node|null} options.label visible content of the button
	 * @param {string|null} [options.name] accessible name of the button when the label is not enough
	 * @param {Array<object|null|false>} options.items the actions
	 * @param {'start'|'end'} [options.align] which edge of the button the list aligns to
	 * @param {string|null} [options.glyph] the button's icon
	 * @param {'auto'|'below'|'above'} [options.placement] the side of the button the list prefers (it flips without room, 0.15.0)
	 */
	constructor({ label, name = null, items, align = 'end', glyph = 'more', placement = 'auto' }) {
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
				// A glyph alone shows its name as a tooltip (D11).
				'data-bui-hint': Boolean(glyph && !label && name),
				onclick: () => (this.#open ? this.close(true) : this.open(0)),
				onkeydown: event => this.#opener(event)
			},
			[glyph ? new Glyph(glyph).element : null, label ? el('span', {}, [content(label)]) : null]
		);
		this.#list = el('ul', { id, class: `bui-menu bui-align-${align}`, role: 'menu', hidden: true, onkeydown: event => this.#keys(event) });
		this.items = items;
		this.#element = el('div', { class: 'bui-menu-holder' }, [this.#button, this.#list]);
		this.#floating = new Floating(this.#list, { anchor: this.#button, placement, align, above: 'bui-menu-above' });
		this.#hint = glyph && !label ? new Hint(this.#element) : null;
	}

	get element() {
		return this.#element;
	}

	destroy() {
		this.#hint?.destroy();
		this.#picture?.remove();
		this.#floating.destroy();
		super.destroy();
	}

	get expanded() {
		return this.#open;
	}

	/** Replaces the items. */
	set items(items) {
		this.#items = items.filter(Boolean).map(item => this.#item(item));
		this.#list.replaceChildren(...this.#items.map(entry => entry.holder));
	}

	/**
	 * Opens the menu and focuses the item at `index` (negative counts from the end); false when its
	 * button is not drawn (0.15.0).
	 */
	open(index = 0) {
		if (this.destroyed) return false;
		if (!this.#open) {
			this.#picture?.remove();
			this.#list.hidden = false;
			this.#floating.retry = () => this.open(index);
			// A refusal another part answered (Options unfolded) may have opened it meanwhile
			if (!this.#floating.show()) return this.#open || ((this.#list.hidden = true), false);
			this.#open = true;
			this.#button.setAttribute('aria-expanded', 'true');
			this.#release = this.listen(this.#element.ownerDocument, 'pointerdown', event => {
				if (!this.#element.contains(event.target)) this.close(false);
			});
		}
		const targets = this.#items.map(entry => entry.node);
		targets.at(index < 0 ? targets.length + index : index)?.focus({ preventScroll: true });
		return true;
	}

	close(refocus = false) {
		if (!this.#open) return;
		this.#open = false;
		this.#picture?.remove();
		this.#picture = Leaving.play(this.#list);
		this.#floating.hide();
		this.#list.hidden = true;
		this.#button.setAttribute('aria-expanded', 'false');
		this.#release?.();
		if (refocus) this.#button.focus({ preventScroll: true });
	}

	#item({ label, run = null, href = null, disabled = false, reason = null, tone = null, waiting = false }) {
		const note = reason ? Ids.next('bui-reason') : null;
		const props = {
			role: 'menuitem',
			tabindex: '-1',
			class: `bui-menu-item${tone ? ` bui-menu-item-${tone}` : ''}`,
			'aria-disabled': disabled || waiting ? 'true' : null,
			'aria-describedby': note
		};
		const children = [el('span', {}, [content(label)]), reason ? el('span', { id: note, class: 'bui-menu-reason', text: reason }) : null];
		// An item that waits is never a link: its press only puts the person where they can act
		const node = href && !disabled && !waiting ? el('a', { ...props, href }, children) : el('button', { ...props, type: 'button' }, children);
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
