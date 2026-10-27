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
 *
 * Since 0.44.0 (D185) a line whose way back is known only after a read (the receiving product's address of
 * the other product, the family bar's descriptor) holds its place from the first frame: with `href: null`
 * it is drawn unseen (`visibility: hidden`), `inert` and hidden from assistive technology, so nothing moves
 * when `href` is set and it shows. A product that learns there is no way back removes the line.
 */
export class Arrival extends Component {
	/** The line's copy in English and Spanish. */
	static labels = Object.freeze({
		en: Object.freeze({ from: 'Opened from {product}', back: 'Back to {product}', dismiss: 'Dismiss' }),
		es: Object.freeze({ from: 'Abierto desde {product}', back: 'Volver a {product}', dismiss: 'Descartar' })
	});

	#element;
	#hint;
	#back;

	/**
	 * @param {object} options
	 * @param {string} options.product the display name of the product the person came from
	 * @param {string|null} options.href the exact place to return to; null holds the line's place, unseen, until it is known (0.44.0)
	 * @param {(() => void)|null} [options.ondismiss] offers Dismiss, which removes the line and calls it
	 * @param {(item: {href: string, url: string}, event: MouseEvent) => void} [options.onnavigate] takes over a plain click on a same-origin way back
	 * @param {{from?: string, back?: string, dismiss?: string}} [options.labels]
	 */
	constructor({ product, href, ondismiss = null, onnavigate = null, labels = {} }) {
		super();
		const text = new Labels(Arrival.labels, labels);
		const back = el('a', { class: 'bui-arrival-back', text: text.text('back', { product }) });
		this.#back = back;
		if (onnavigate) back.addEventListener('click', event => this.#navigate(event, onnavigate));
		const dismiss = ondismiss
			? el('button', { type: 'button', class: 'bui-icon-button bui-arrival-dismiss', 'aria-label': text.text('dismiss'), 'data-bui-hint': true, onclick: () => this.#dismiss(ondismiss) }, [glyph('close')])
			: null;
		this.#element = el('p', { class: 'bui-arrival', role: 'note' }, [el('span', { class: 'bui-arrival-from', text: text.text('from', { product }) }), el('span', { 'aria-hidden': 'true', text: ' · ' }), back, dismiss]);
		this.#hint = dismiss ? new Hint(this.#element) : null;
		this.href = href;
	}

	get element() {
		return this.#element;
	}

	/** The way back, or null while it is not known and the line holds its place unseen (0.44.0). */
	get href() {
		return this.#back.getAttribute('href');
	}

	set href(href) {
		const known = typeof href === 'string' && href !== '';
		if (known) this.#back.setAttribute('href', href);
		else this.#back.removeAttribute('href');
		this.#element.toggleAttribute('data-held', !known);
		this.#element.toggleAttribute('inert', !known);
		if (known) this.#element.removeAttribute('aria-hidden');
		else this.#element.setAttribute('aria-hidden', 'true');
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
