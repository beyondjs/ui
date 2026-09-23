import { el, fill, content } from '../core/element.js';
import { icon } from '../core/icons.js';
import { callout } from '../feedback.js';

/**
 * The frame of the notification entry's panel: heading, announcements, body and footer actions.
 */
export class Panel {
	#element;
	#heading;
	#status;
	#body;
	#everything;
	#retry;
	#labels;

	constructor({ labels, id, href, onview, retry, everything }) {
		this.#heading = `${id}-title`;
		this.#retry = retry;
		this.#labels = labels;
		this.#status = el('p', { class: 'bui-notify-status', role: 'status' });
		this.#body = el('div', { class: 'bui-notify-body' });
		this.#everything = el('button', { type: 'button', class: 'bui-link-button', hidden: true, onclick: everything }, [labels.text('everything')]);
		const all = href
			? el('a', {
					href,
					class: 'bui-notify-all',
					onclick: event => {
						if (!onview || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
						event.preventDefault();
						onview(event);
					}
				}, [labels.text('all')])
			: null;
		this.#element = el('div', { class: 'bui-notify-frame' }, [
			el('h2', { id: this.#heading, class: 'bui-notify-title', text: labels.text('title') }),
			this.#status,
			this.#body,
			el('div', { class: 'bui-notify-foot' }, [this.#everything, all])
		]);
	}

	get element() {
		return this.#element;
	}

	/** The id of the panel heading. */
	get heading() {
		return this.#heading;
	}

	/** Replaces the body; `unread` offers "Mark all as read". */
	show(children, unread = false) {
		fill(this.#body, children);
		this.#everything.hidden = !unread;
	}

	/** A failure with its retry button. */
	failed(message) {
		const retry = el('button', { type: 'button', class: 'bui-button bui-button-secondary bui-button-small', onclick: () => this.#retry() }, [icon('refresh'), el('span', { text: this.#labels.text('retry') })]);
		this.show([callout({ tone: 'danger', title: content(message), actions: [retry] })]);
	}

	/** Announces a short outcome, such as an item that is no longer available. */
	say(message) {
		this.#status.textContent = '';
		this.#status.textContent = message;
	}
}
