import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { Ids } from './core/ids.js';
import { Floating } from './core/floating.js';

/**
 * A short supplementary description of a control, shown on hover, keyboard focus and a touch press.
 *
 * It describes the trigger (`aria-describedby`), stays while the pointer moves onto it, and Escape
 * hides it. It never carries the only copy of essential information: use `Help` for that, which
 * opens from a button on any device. It is placed by `Floating` (0.15.0): below its trigger, or above
 * without room, inside the viewport so it never widens the page, in the top layer and never under the
 * family bar.
 */
export class Tooltip extends Component {
	#element;
	#trigger;
	#hide = null;
	#when;
	#floating;

	/**
	 * @param {Element} trigger the described control, owned by the consumer
	 * @param {{text: string|Node, delay?: number, describe?: boolean}} options `describe: false` for a
	 *   tooltip that only shows the control's own accessible name (an icon-only control, D11): it is
	 *   then hidden from assistive technology, so the name is not heard twice. `when` is asked each time
	 *   it would show, and it shows only while that returns true (a name shown whole only while it is
	 *   cut, D44)
	 */
	constructor(trigger, { text, delay = 120, describe = true, when = null }) {
		super();
		this.#trigger = trigger;
		this.#when = typeof when === 'function' ? when : null;
		const id = Ids.next('bui-tooltip');
		this.#element = el('span', { id, role: describe ? 'tooltip' : null, 'aria-hidden': describe ? null : 'true', class: 'bui-tooltip', hidden: true }, [content(text)]);
		const described = trigger.getAttribute('aria-describedby');
		if (describe) trigger.setAttribute('aria-describedby', [described, id].filter(Boolean).join(' '));
		trigger.ownerDocument.body.append(this.#element);
		this.#floating = new Floating(this.#element, { anchor: trigger, placement: 'below', align: 'center', gap: 8, quiet: true });
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
		if (this.#when && !this.#when()) return this.hide();
		this.#element.hidden = false;
		if (!this.#floating.show()) this.#element.hidden = true;
	}

	hide() {
		this.#hide?.();
		this.#floating.hide();
		this.#element.hidden = true;
	}

	destroy() {
		const ids = (this.#trigger.getAttribute('aria-describedby') ?? '').split(' ').filter(id => id && id !== this.#element.id);
		if (ids.length) this.#trigger.setAttribute('aria-describedby', ids.join(' '));
		else this.#trigger.removeAttribute('aria-describedby');
		this.#floating.destroy();
		super.destroy();
	}
}
