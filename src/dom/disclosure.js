import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { Ids } from './core/ids.js';
import { Interaction } from './core/interaction.js';
import { Hint } from './core/hint.js';
import { Leaving } from './core/leaving.js';
import { Floating } from './core/floating.js';

/**
 * A button that shows and hides a panel: the disclosure pattern.
 *
 * It traps nothing: Tab moves on normally. Escape and the button close the panel and return focus to
 * the button; a press outside closes it without moving focus. Escape also closes it when focus rests
 * on the page's body, as it does in Safari after a click on a button, and focus then goes to the
 * button. Closing it from code returns focus to the button when focus was inside the panel, so it is
 * never left on a hidden element. The panel works the same with a mouse,
 * a keyboard and touch, which is what essential help and header panels need. Help, the account slot
 * and the notification entry are built on it.
 *
 * Closing hides the panel at once (nothing in it can be reached after `close()` returns), and a
 * picture of it eases out where it was: an inert copy without identifiers, hidden from assistive
 * technology, removed as soon as its movement ends. With reduced motion there is no picture. The
 * picture keeps the panel's classes so it looks the same, so it never outlives a reopening: opening
 * again or destroying removes it, and an open panel has no copy beside it.
 *
 * A floating panel (one the stylesheet positions over the page) is placed by `Floating` since 0.15.0:
 * in the top layer, on its preferred side (`placement: 'auto'` and `'below'` prefer below, `'above'` above,
 * for a button whose page docks something under it) and flipped when that side has no room and the other
 * has more, shifted and capped to the room, never under the family bar, and placed again on scroll and
 * resize. A panel inside a header (the family bar's menus) and a bell's panel (`NotificationEntry`, also in
 * a host's own bar) keep their own geometry, and a panel in the page's flow (help) is not moved. A button that is not drawn opens
 * nothing: `open()` returns false.
 */
export class Disclosure extends Component {
	#element;
	#button;
	#panel;
	#open = false;
	#onchange;
	#releases = [];
	#hint = null;
	#picture = null;
	#floating;

	/**
	 * @param {object} options
	 * @param {string|Node|Array<string|Node>} options.label visible content of the button
	 * @param {string} [options.name] accessible name of the button when the label is not enough
	 * @param {Node[]} [options.children] panel content
	 * @param {'start'|'end'} [options.align] which edge of the button the panel aligns to
	 * @param {(open: boolean) => void} [options.onchange]
	 * @param {boolean} [options.hint] the button shows a glyph alone: its name appears as a tooltip (D11)
	 * @param {'auto'|'above'|'below'} [options.placement] where a floating panel opens (0.11.2): above when there is no room below (`auto`), or always on one side
	 */
	constructor({ label, name = null, children = [], align = 'start', variant = 'plain', role = null, onchange = null, hint = false, placement = 'auto', class: extra = '' }) {
		super();
		this.#onchange = onchange;
		const id = Ids.next('bui-panel');
		this.#button = el(
			'button',
			{
				type: 'button',
				class: `bui-disclosure-button bui-disclosure-${variant}`,
				'aria-expanded': 'false',
				'aria-controls': id,
				'aria-label': name,
				onclick: () => this.toggle()
			},
			[].concat(label).map(content)
		);
		this.#panel = el('div', { id, class: `bui-disclosure-panel bui-align-${align}`, role, hidden: true }, children);
		this.#element = el('div', { class: `bui-disclosure ${extra}`.trim(), onkeydown: event => this.#escape(event) }, [
			this.#button,
			this.#panel
		]);
		this.#floating = new Floating(this.#panel, { anchor: this.#button, placement, align, above: 'bui-disclosure-above' });
		this.#floating.retry = () => this.open();
		if (hint) this.hint = true;
	}

	/** Whether the button's name shows as a tooltip, for a button that shows a glyph alone (D11). */
	set hint(value) {
		this.#button.toggleAttribute('data-bui-hint', Boolean(value));
		if (value) this.#hint ??= new Hint(this.#element);
	}

	destroy() {
		this.#hint?.destroy();
		this.#picture?.remove();
		this.#floating.destroy();
		super.destroy();
	}

	get element() {
		return this.#element;
	}

	get button() {
		return this.#button;
	}

	get panel() {
		return this.#panel;
	}

	get expanded() {
		return this.#open;
	}

	toggle() {
		if (this.#open) this.close(true);
		else this.open();
	}

	/** Opens the panel; false when it did not open (destroyed, or a floating panel whose button is not drawn). */
	open() {
		if (this.#open) return true;
		if (this.destroyed) return false;
		this.#picture?.remove();
		this.#panel.hidden = false;
		if (this.#floats() && !this.#floating.show()) return this.#open || ((this.#panel.hidden = true), false);
		this.#open = true;
		this.#button.setAttribute('aria-expanded', 'true');
		const document = this.#element.ownerDocument;
		this.#releases = [
			this.listen(document, 'pointerdown', event => {
				if (!this.#element.contains(event.target)) this.#shut(false);
			}),
			// Escape that reaches the document from nowhere in particular (the body) still closes the panel.
			this.listen(document, 'keydown', event => {
				if (event.key === 'Escape' && !event.defaultPrevented && !this.#element.contains(event.target) && Interaction.adrift(document)) this.#shut(true);
			})
		];
		this.#onchange?.(true);
		return true;
	}

	/**
	 * Closes the panel; `refocus` returns focus to the button, as does focus that was inside the
	 * panel.
	 */
	close(refocus = false) {
		if (!this.#open) return;
		this.#shut(refocus || this.#panel.contains(this.#element.ownerDocument.activeElement));
	}

	#shut(refocus) {
		if (!this.#open) return;
		this.#open = false;
		this.#leave();
		this.#floating.hide();
		this.#panel.hidden = true;
		this.#button.setAttribute('aria-expanded', 'false');
		for (const release of this.#releases) release();
		this.#releases = [];
		if (refocus) this.#button.focus();
		this.#onchange?.(false);
	}

	/**
	 * An inert picture of a floating panel eases out where it was, then removes itself. A panel in the
	 * page's flow (help) closes at once: a picture of it would hold its place and push what follows.
	 */
	#leave() {
		this.#picture?.remove();
		this.#picture = Leaving.play(this.#panel, { host: this.#element, swap: ['bui-disclosure-panel', 'bui-disclosure-leaving'] });
	}

	/** Whether the panel floats over the page and is not a header's (which places its panels itself). */
	#floats() {
		const view = this.#element.ownerDocument.defaultView;
		// A bell's panel (`bui-notify`) keeps its own geometry wherever its bar is (0.13.1)
		if (!view || !this.#element.isConnected || this.#element.closest('.bui-header') || this.#element.classList.contains('bui-notify')) return false;
		const position = view.getComputedStyle?.(this.#panel).position;
		return position === 'absolute' || position === 'fixed';
	}

	#escape(event) {
		if (event.key !== 'Escape' || !this.#open) return;
		event.stopPropagation();
		this.close(true);
	}
}
