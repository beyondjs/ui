import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { callout } from '../feedback.js';

/**
 * The frame of the notification entry's panel: heading, announcements, body and footer actions.
 *
 * The panel sets its own text roles, whatever the product's base stylesheet: the title outranks the
 * content and an empty inbox is one quiet line of body text. "View all" is offered only when there is
 * something to see (items, read or not); an unavailable inbox offers "Try again" instead, and a
 * failure its retry. While loading, the body is `aria-busy`. A change of the body's height is
 * animated with `--motion-standard`, except under reduced motion.
 */
export class Panel {
	#element;
	#heading;
	#status;
	#body;
	#everything;
	#all;
	#retry;
	#labels;

	/**
	 * @param {object} options
	 * @param {(event: MouseEvent) => void} options.view runs on a plain primary click of "View all";
	 *   a click that opens elsewhere (a modifier key or another button) is left to the browser
	 * @param {() => void} options.retry loads again after a failure or while unavailable
	 */
	constructor({ labels, id, href, view, retry, everything }) {
		this.#heading = `${id}-title`;
		this.#retry = retry;
		this.#labels = labels;
		this.#status = el('p', { class: 'bui-notify-status', role: 'status' });
		this.#body = el('div', { class: 'bui-notify-body' });
		this.#everything = el('button', { type: 'button', class: 'bui-link-button', hidden: true, onclick: everything }, [labels.text('everything')]);
		this.#all = href
			? el('a', {
					href,
					class: 'bui-notify-all',
					hidden: true,
					onclick: event => {
						if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
						view(event);
					}
				}, [labels.text('all')])
			: null;
		this.#element = el('div', { class: 'bui-notify-frame' }, [
			el('h2', { id: this.#heading, class: 'bui-notify-title', text: labels.text('title') }),
			this.#status,
			this.#body,
			el('div', { class: 'bui-notify-foot' }, [this.#everything, this.#all])
		]);
	}

	get element() {
		return this.#element;
	}

	/** The id of the panel heading. */
	get heading() {
		return this.#heading;
	}

	/** The body element (the part whose height changes). */
	get body() {
		return this.#body;
	}

	/** Marks the body as loading (`aria-busy`) or not. */
	set busy(value) {
		this.#body.setAttribute('aria-busy', String(Boolean(value)));
	}

	/** Replaces the body; `unread` offers "Mark all as read" and `all` "View all". */
	show(children, { unread = false, all = false } = {}) {
		this.#animate(() => fill(this.#body, children));
		this.#everything.hidden = !unread;
		if (this.#all) this.#all.hidden = !all;
		this.#foot();
	}

	/** A failure with its retry button. */
	failed(message) {
		this.show([callout({ tone: 'danger', title: content(message), actions: [this.#again()] })]);
	}

	/** Notifications are unavailable (for example without Beyond Projects): say so and offer "Try again". */
	unavailable(message) {
		this.show([callout({ tone: 'info', title: content(message), actions: [this.#again()] })]);
	}

	/** Announces a short outcome, such as an item that is no longer available. */
	say(message) {
		this.#status.textContent = '';
		this.#status.textContent = message;
	}

	#again() {
		return el('button', { type: 'button', class: 'bui-button bui-button-secondary bui-button-small', onclick: () => this.#retry() }, [glyph('refresh'), el('span', { text: this.#labels.text('retry') })]);
	}

	/** The footer shows only when it holds an action. */
	#foot() {
		this.#everything.parentElement.hidden = this.#everything.hidden && (this.#all?.hidden ?? true);
	}

	/** Runs `change` and eases the body from its old height to its new one. */
	#animate(change) {
		const view = this.#body.ownerDocument.defaultView;
		const shown = this.#body.isConnected && this.#body.getClientRects?.().length > 0;
		const before = shown ? this.#body.getBoundingClientRect().height : null;
		change();
		if (before === null || typeof this.#body.animate !== 'function' || view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
		const after = this.#body.getBoundingClientRect().height;
		if (Math.abs(after - before) < 1) return;
		const duration = Number.parseFloat(view.getComputedStyle(this.#body).getPropertyValue('--motion-standard')) || 200;
		const easing = view.getComputedStyle(this.#body).getPropertyValue('--motion-ease').trim() || 'ease-out';
		this.#body.animate([{ height: `${before}px`, overflow: 'hidden' }, { height: `${after}px`, overflow: 'hidden' }], { duration, easing });
	}
}
