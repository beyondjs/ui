import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { icon } from './core/icons.js';
import { Labels } from './core/labels.js';

const defaults = { region: 'Messages', dismiss: 'Dismiss' };

/**
 * Transient outcome messages ("Saved", "Published to production").
 *
 * One region per page. Successes and information are announced politely and leave after `duration`;
 * failures are announced assertively and stay until dismissed. A toast is not a notification: it
 * says what just happened on this screen and is never stored, whereas notifications are durable
 * inbox items for things that happened elsewhere or later.
 */
export class Toaster extends Component {
	#element;
	#labels;
	#polite;
	#assertive;

	constructor({ labels = {} } = {}) {
		super();
		this.#labels = new Labels(defaults, labels);
		// Live regions must exist before their content changes to be announced reliably.
		this.#polite = el('div', { class: 'bui-toast-stack', role: 'status', 'aria-live': 'polite' });
		this.#assertive = el('div', { class: 'bui-toast-stack', role: 'alert', 'aria-live': 'assertive' });
		this.#element = el('section', { class: 'bui-toaster', 'aria-label': this.#labels.text('region') }, [this.#assertive, this.#polite]);
	}

	get element() {
		return this.#element;
	}

	/**
	 * Shows a message. Tones: `success`, `info`, `warning`, `danger`. Returns a function that removes it.
	 * @param {string|Node} message
	 * @param {{tone?: string, detail?: string|Node, duration?: number}} [options]
	 */
	show(message, { tone = 'success', detail = null, duration = 5000 } = {}) {
		const glyph = { success: 'check', info: 'info', warning: 'alert', danger: 'alert' }[tone] ?? 'info';
		const toast = el('div', { class: `bui-toast bui-toast-${tone}` }, [
			icon(glyph),
			el('div', { class: 'bui-toast-text' }, [
				el('p', { class: 'bui-toast-title' }, [content(message)]),
				detail ? el('p', { class: 'bui-toast-detail' }, [content(detail)]) : null
			]),
			el('button', { type: 'button', class: 'bui-icon-button', 'aria-label': this.#labels.text('dismiss'), onclick: () => remove() }, [icon('close')])
		]);
		(tone === 'danger' ? this.#assertive : this.#polite).append(toast);
		const cancel = tone === 'danger' ? null : this.later(() => toast.remove(), duration);
		const remove = () => {
			cancel?.();
			toast.remove();
		};
		return remove;
	}

	/** Removes every message. */
	clear() {
		this.#polite.replaceChildren();
		this.#assertive.replaceChildren();
	}
}
