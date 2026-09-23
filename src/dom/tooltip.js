import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { Ids } from './core/ids.js';

/**
 * A short supplementary description of a control, shown on hover, keyboard focus and a touch press.
 *
 * It describes the trigger (`aria-describedby`), stays while the pointer moves onto it, and Escape
 * hides it. It never carries the only copy of essential information: use `Help` for that, which
 * opens from a button on any device. Tooltips are positioned in the viewport so they never widen
 * the page on narrow screens.
 */
export class Tooltip extends Component {
	#element;
	#trigger;
	#hide = null;

	/**
	 * @param {Element} trigger the described control, owned by the consumer
	 * @param {{text: string|Node, delay?: number}} options
	 */
	constructor(trigger, { text, delay = 120 }) {
		super();
		this.#trigger = trigger;
		const id = Ids.next('bui-tooltip');
		this.#element = el('span', { id, role: 'tooltip', class: 'bui-tooltip', hidden: true }, [content(text)]);
		const described = trigger.getAttribute('aria-describedby');
		trigger.setAttribute('aria-describedby', [described, id].filter(Boolean).join(' '));
		trigger.ownerDocument.body.append(this.#element);
		const soon = () => (this.#hide = this.later(() => this.hide(), delay));
		this.listen(trigger, 'pointerenter', event => event.pointerType !== 'touch' && this.show());
		this.listen(trigger, 'pointerleave', event => event.pointerType !== 'touch' && soon());
		this.listen(trigger, 'focus', () => this.show());
		this.listen(trigger, 'blur', () => this.hide());
		this.listen(trigger, 'pointerdown', event => {
			if (event.pointerType !== 'touch') return;
			this.show();
			this.#hide = this.later(() => this.hide(), 2500);
		});
		this.listen(this.#element, 'pointerenter', () => this.#hide?.());
		this.listen(this.#element, 'pointerleave', soon);
		this.listen(trigger.ownerDocument, 'keydown', event => event.key === 'Escape' && !this.#element.hidden && this.hide());
	}

	get element() {
		return this.#element;
	}

	get shown() {
		return !this.#element.hidden;
	}

	set text(value) {
		this.#element.replaceChildren(content(value) ?? '');
	}

	show() {
		this.#hide?.();
		this.#element.hidden = false;
		this.#place();
	}

	hide() {
		this.#hide?.();
		this.#element.hidden = true;
	}

	destroy() {
		const ids = (this.#trigger.getAttribute('aria-describedby') ?? '').split(' ').filter(id => id && id !== this.#element.id);
		if (ids.length) this.#trigger.setAttribute('aria-describedby', ids.join(' '));
		else this.#trigger.removeAttribute('aria-describedby');
		super.destroy();
	}

	#place() {
		const view = this.#trigger.ownerDocument.defaultView;
		const box = this.#trigger.getBoundingClientRect();
		const own = this.#element.getBoundingClientRect();
		const margin = 8;
		const left = Math.min(Math.max(margin, box.left + box.width / 2 - own.width / 2), view.innerWidth - own.width - margin);
		const below = box.bottom + margin + own.height <= view.innerHeight;
		this.#element.style.left = `${Math.max(margin, left)}px`;
		this.#element.style.top = `${below ? box.bottom + margin : box.top - own.height - margin}px`;
	}
}
