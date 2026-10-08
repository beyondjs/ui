import { Tooltip } from '../tooltip.js';

/**
 * Whether a name is shown cut (decision D44 as amended on 2026-10-03): a user-written name may be
 * truncated in a closed control only while its whole text is available on hover and keyboard focus.
 * The components that cut a name ask here before showing it whole in a tooltip, so a name that fits
 * shows no tooltip. Stateless measurements: the standard's exception for pure functions, kept as
 * static members of one class.
 */
export class Cut {
	/** Whether the text of an element with `text-overflow: ellipsis` overflows its box. */
	static text(node) {
		if (!node?.isConnected) return false;
		return node.scrollWidth > node.clientWidth + 0.5;
	}

	/** Whether the text of a block clamped to a number of lines (`line-clamp`) has more lines than it shows (0.10.0). */
	static clamp(node) {
		if (!node?.isConnected) return false;
		return node.scrollHeight > node.clientHeight + 0.5 || Cut.text(node);
	}

	/**
	 * Whether a native select's chosen text is wider than the room its box gives it: a select clips
	 * without an ellipsis and reports no overflow, so the text is measured in the select's own font.
	 */
	static select(control) {
		if (!control?.isConnected) return false;
		const text = Cut.chosen(control);
		if (!text) return false;
		const view = control.ownerDocument.defaultView;
		const style = view.getComputedStyle(control);
		const room = control.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
		const context = Cut.#canvas(control.ownerDocument);
		if (!context || !(room > 0)) return false;
		context.font = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
		return context.measureText(text).width > room + 0.5;
	}

	/** The text of a select's chosen option, or an empty string. */
	static chosen(control) {
		return control?.options?.[control.selectedIndex]?.textContent ?? '';
	}

	static #canvas(document) {
		try {
			return document.createElement('canvas').getContext?.('2d') ?? null;
		} catch {
			return null;
		}
	}
}

/**
 * The tooltip that shows a cut name whole (D44): on hover and on keyboard focus of `trigger`, only
 * while `cut()` says the name is cut, with the text `text()` returns then. It is created on the first
 * hover or focus, so a control whose name is never looked at adds nothing to the page, and a press on
 * the control hides it. It repeats a name the control's accessible name already carries, so it is
 * hidden from assistive technology.
 */
export class NameTip {
	#trigger;
	#text;
	#cut;
	#tip = null;
	#open;
	#close = () => this.#tip?.hide();

	/**
	 * @param {Element} trigger the control or text that may be cut
	 * @param {{text: () => string, cut: () => boolean}} options
	 */
	constructor(trigger, { text, cut }) {
		this.#trigger = trigger;
		this.#text = text;
		this.#cut = cut;
		this.#open = event => {
			if (event.type === 'pointerenter' && event.pointerType === 'touch') return;
			this.#make().show();
		};
		trigger.addEventListener('pointerenter', this.#open);
		trigger.addEventListener('focus', this.#open);
		// A press opens what the control holds (a menu, the platform's list): the tooltip makes way.
		trigger.addEventListener('click', this.#close);
	}

	/** The tooltip once it exists, or null. */
	get tooltip() {
		return this.#tip;
	}

	destroy() {
		this.#trigger.removeEventListener('pointerenter', this.#open);
		this.#trigger.removeEventListener('focus', this.#open);
		this.#trigger.removeEventListener('click', this.#close);
		this.#tip?.destroy();
		this.#tip = null;
	}

	#make() {
		if (this.#tip) return this.#tip;
		this.#trigger.removeEventListener('pointerenter', this.#open);
		this.#trigger.removeEventListener('focus', this.#open);
		const tip = new Tooltip(this.#trigger, {
			text: this.#text(),
			describe: false,
			when: () => {
				if (!this.#cut()) return false;
				tip.text = this.#text();
				return true;
			}
		});
		this.#tip = tip;
		return tip;
	}
}
