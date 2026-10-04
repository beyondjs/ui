import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Hint } from '../core/hint.js';
import { Labels } from '../core/labels.js';

/**
 * The arrival line (decision D54, which merges D05 and FR-1): the first line of a page opened from
 * another product, small and at the region's start, "Opened from {product} · Back to {product}".
 * The link reopens the exact place the person came from and is also the way to cancel a task; the
 * product builds it from its own configuration, never from the address it received. It is kept for
 * the visit and may be dismissed; a product returns by itself on a task's success, so the line is
 * the only way back a page draws (never a button among its controls, never in the family bar).
 */
export class Arrival extends Component {
	/** The line's copy in English and Spanish. */
	static labels = Object.freeze({
		en: Object.freeze({ from: 'Opened from {product}', back: 'Back to {product}', dismiss: 'Dismiss' }),
		es: Object.freeze({ from: 'Abierto desde {product}', back: 'Volver a {product}', dismiss: 'Descartar' })
	});

	#element;
	#hint;

	/**
	 * @param {object} options
	 * @param {string} options.product the display name of the product the person came from
	 * @param {string} options.href the exact place to return to
	 * @param {(() => void)|null} [options.ondismiss] offers Dismiss, which removes the line and calls it
	 * @param {(item: {href: string, url: string}, event: MouseEvent) => void} [options.onnavigate] takes over a plain click on a same-origin way back
	 * @param {{from?: string, back?: string, dismiss?: string}} [options.labels]
	 */
	constructor({ product, href, ondismiss = null, onnavigate = null, labels = {} }) {
		super();
		const text = new Labels(Arrival.labels.en, labels);
		const back = el('a', { class: 'bui-arrival-back', href, text: text.text('back', { product }) });
		if (onnavigate) back.addEventListener('click', event => this.#navigate(event, onnavigate));
		const dismiss = ondismiss
			? el('button', { type: 'button', class: 'bui-icon-button bui-arrival-dismiss', 'aria-label': text.text('dismiss'), 'data-bui-hint': true, onclick: () => this.#dismiss(ondismiss) }, [glyph('close')])
			: null;
		this.#element = el('p', { class: 'bui-arrival', role: 'note' }, [el('span', { class: 'bui-arrival-from', text: text.text('from', { product }) }), el('span', { 'aria-hidden': 'true', text: ' · ' }), back, dismiss]);
		this.#hint = dismiss ? new Hint(this.#element) : null;
	}

	get element() {
		return this.#element;
	}

	destroy() {
		this.#hint?.destroy();
		super.destroy();
	}

	#dismiss(ondismiss) {
		this.destroy();
		ondismiss();
	}

	/** A plain primary click on a same-origin way back goes to the product's own navigation. */
	#navigate(event, onnavigate) {
		if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		const document = this.#element.ownerDocument;
		const url = new URL(event.currentTarget.getAttribute('href'), document.baseURI);
		if (url.origin !== document.defaultView.location.origin) return;
		event.preventDefault();
		onnavigate({ href: event.currentTarget.getAttribute('href'), url: url.href }, event);
	}
}
