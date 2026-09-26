import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { Ids } from './core/ids.js';

/**
 * A button that shows and hides a panel: the disclosure pattern.
 *
 * It traps nothing: Tab moves on normally. Escape and the button close the panel and return focus to
 * the button; a press outside closes it without moving focus. Closing it from code returns focus to
 * the button when focus was inside the panel, so it is never left on a hidden element. The panel works the same with a mouse,
 * a keyboard and touch, which is what essential help and header panels need. Help, the account slot
 * and the notification entry are built on it.
 *
 * Closing hides the panel at once (nothing in it can be reached after `close()` returns), and a
 * picture of it eases out where it was: an inert copy without identifiers, hidden from assistive
 * technology, removed as soon as its movement ends. With reduced motion there is no picture.
 */
export class Disclosure extends Component {
	#element;
	#button;
	#panel;
	#open = false;
	#onchange;
	#release = null;

	/**
	 * @param {object} options
	 * @param {string|Node|Array<string|Node>} options.label visible content of the button
	 * @param {string} [options.name] accessible name of the button when the label is not enough
	 * @param {Node[]} [options.children] panel content
	 * @param {'start'|'end'} [options.align] which edge of the button the panel aligns to
	 * @param {(open: boolean) => void} [options.onchange]
	 */
	constructor({ label, name = null, children = [], align = 'start', variant = 'plain', role = null, onchange = null, class: extra = '' }) {
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

	open() {
		if (this.#open || this.destroyed) return;
		this.#open = true;
		this.#panel.hidden = false;
		this.#button.setAttribute('aria-expanded', 'true');
		this.#release = this.listen(this.#element.ownerDocument, 'pointerdown', event => {
			if (!this.#element.contains(event.target)) this.#shut(false);
		});
		this.#onchange?.(true);
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
		this.#panel.hidden = true;
		this.#button.setAttribute('aria-expanded', 'false');
		this.#release?.();
		this.#release = null;
		if (refocus) this.#button.focus();
		this.#onchange?.(false);
	}

	/**
	 * An inert picture of a floating panel eases out where it was, then removes itself. A panel in the
	 * page's flow (help) closes at once: a picture of it would hold its place and push what follows.
	 */
	#leave() {
		const view = this.#element.ownerDocument.defaultView;
		if (!this.#element.isConnected || view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
		const position = view?.getComputedStyle?.(this.#panel).position;
		if (position !== 'absolute' && position !== 'fixed') return;
		const picture = this.#panel.cloneNode(true);
		for (const node of [picture, ...picture.querySelectorAll('[id]')]) node.removeAttribute('id');
		picture.removeAttribute('role');
		picture.classList.replace('bui-disclosure-panel', 'bui-disclosure-leaving');
		picture.setAttribute('aria-hidden', 'true');
		picture.inert = true;
		this.#element.append(picture);
		const remove = () => picture.remove();
		picture.addEventListener('animationend', remove, { once: true });
		view.setTimeout(remove, 400);
	}

	#escape(event) {
		if (event.key !== 'Escape' || !this.#open) return;
		event.stopPropagation();
		this.close(true);
	}
}
