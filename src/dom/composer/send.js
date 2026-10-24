import { Interaction } from '../core/interaction.js';

/**
 * A composer's one path to send (the keys, the button and the menu), one send at a time: the text,
 * trimmed, leaves the field at once and the product's `onsubmit({ text, action, attachments? })` runs.
 * When it rejects, the text comes back before anything typed meanwhile and the box's state band says why
 * (`explain(error)`, the default sentence, or nothing). Since 0.11.0 a message with a ready attachment
 * may have no text, unless the product's `attach.words` says files wait for words (0.32.0).
 *
 * An empty message is not sent and is no failure (0.29.0, D183): Enter does nothing, and a press on the
 * quiet Send only puts the caret in the field, saying nothing (before 0.29.0 it said "Write a message
 * first." in the danger hue).
 */
export class ComposerSend {
	#sending = false;
	#field;
	#status;
	#labels;
	#onsubmit;
	#onchange;
	#explain;
	#host;

	/**
	 * @param {object} options
	 * @param {import('./field.js').ComposerField} options.field the field
	 * @param {import('./status.js').ComposerStatus} options.status the box's state band, where a failure is said
	 * @param {import('../core/labels.js').Labels} options.labels the composer's copy
	 * @param {(message: {text: string, action: string, attachments: object[]}) => Promise<unknown>} options.onsubmit
	 * @param {((text: string) => void)|null} options.onchange
	 * @param {((error: unknown) => string|null)|undefined} options.explain
	 * @param {{alive: () => boolean, files: () => {ready: boolean, attached: object[]}, sendable: () => boolean, primary: () => string, draw: () => void, root: () => HTMLElement}} options.host
	 *   the composer: whether it still lives, its attachments, its primary action, a redraw and its element
	 */
	constructor({ field, status, labels, onsubmit, onchange, explain, host }) {
		this.#field = field;
		this.#status = status;
		this.#labels = labels;
		this.#onsubmit = onsubmit;
		this.#onchange = onchange;
		this.#explain = explain;
		this.#host = host;
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
		// Ready files are something to send by themselves only without `attach.words` (0.32.0, D183)
		if (!text && !this.#host.sendable()) {
			// Nothing to send is no failure: a press puts the caret where the message is written, and says nothing
			if (pressed) this.#field.control.focus();
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
			await this.#onsubmit(files.attached.length ? { ...message, attachments: files.attached } : message);
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

	/** Says why a message was not sent in the box's state band, or clears it with null; true when that changed. */
	say(text) {
		return this.#status.say(text);
	}
}
