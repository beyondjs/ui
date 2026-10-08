import { el, fill } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Interaction } from '../core/interaction.js';

/**
 * A composer's one path to send (the keys, the button and the menu), one send at a time: the text,
 * trimmed, leaves the field at once and the product's `onsubmit({ text, action, attachments? })` runs.
 * When it rejects, the text comes back before anything typed meanwhile and the line under the field
 * says why (`explain(error)`, the default sentence, or nothing). An empty message is not sent; a press
 * says "Write a message first." Since 0.11.0 a message with a ready attachment may have no text.
 */
export class ComposerSend {
	#problem = el('p', { id: Ids.next('bui-composer-problem'), class: 'bui-composer-problem', role: 'alert', hidden: true });
	#sending = false;
	#field;
	#labels;
	#onsubmit;
	#onchange;
	#explain;
	#host;

	/**
	 * @param {object} options
	 * @param {import('./field.js').ComposerField} options.field the field
	 * @param {import('../core/labels.js').Labels} options.labels the composer's copy
	 * @param {(message: {text: string, action: string, attachments: object[]}) => Promise<unknown>} options.onsubmit
	 * @param {((text: string) => void)|null} options.onchange
	 * @param {((error: unknown) => string|null)|undefined} options.explain
	 * @param {{alive: () => boolean, files: () => {ready: boolean, items: object[]}, primary: () => string, draw: () => void, root: () => HTMLElement}} options.host
	 *   the composer: whether it still lives, its attachments, its primary action, a redraw and its element
	 */
	constructor({ field, labels, onsubmit, onchange, explain, host }) {
		this.#field = field;
		this.#labels = labels;
		this.#onsubmit = onsubmit;
		this.#onchange = onchange;
		this.#explain = explain;
		this.#host = host;
	}

	/** The line under the field that says why a message was not sent. */
	get element() {
		return this.#problem;
	}

	/** The line's id while it says something (it describes the field), else null. */
	get id() {
		return this.#problem.hidden ? null : this.#problem.id;
	}

	/** Whether a send is in flight. */
	get sending() {
		return this.#sending;
	}

	/** Sends with an action (the primary one when null); `pressed` says a button sent it. Resolves whether it was sent. */
	async send(action, pressed) {
		const raw = this.#field.value;
		const text = raw.trim();
		const files = this.#host.files();
		if (!text && !files.ready) {
			// An empty Enter does nothing; a press on the button says why nothing was sent
			if (pressed) {
				this.say(this.#labels.text('empty'));
				this.#host.draw();
				this.#field.control.focus();
			}
			return false;
		}
		this.#sending = true;
		this.say(null);
		this.#field.value = '';
		this.#onchange?.('');
		this.#host.draw();
		try {
			// `attachments` is in the message only when there are some: a message without any keeps its 0.10.0 shape
			const message = { text, action: action ?? this.#host.primary() };
			await this.#onsubmit(files.items.length ? { ...message, attachments: files.items } : message);
			return true;
		} catch (error) {
			if (!this.#host.alive()) return false;
			const typed = this.#field.value;
			this.#field.value = typed ? `${raw}\n${typed}` : raw;
			this.#onchange?.(this.#field.value);
			this.say(this.#explain === undefined ? this.#labels.text('failed') : (this.#explain?.(error) ?? null));
			return false;
		} finally {
			if (this.#host.alive()) {
				this.#sending = false;
				this.#host.draw();
				if (this.#within()) this.#field.control.focus();
			}
		}
	}

	/** Whether focus is in the composer, or nowhere (a pressed button in Safari): it then goes to the field. */
	#within() {
		const root = this.#host.root();
		const document = root.ownerDocument;
		return Interaction.adrift(document) || root.contains(document.activeElement);
	}

	/** Says why a message was not sent, or clears the line with null. */
	say(text) {
		if (!text && this.#problem.hidden) return false;
		this.#problem.hidden = !text;
		fill(this.#problem, text ? [glyph('alert'), el('span', { text })] : []);
		return true;
	}
}
