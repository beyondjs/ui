import { Dialog } from './dialog.js';
import { Button } from './button.js';
import { Field } from './field.js';
import { el, content } from './core/element.js';
import { Labels } from './core/labels.js';
import { callout } from './feedback.js';

const defaults = { accept: 'Confirm', cancel: 'Cancel', ok: 'OK', close: 'Close', failure: 'That did not work. Try again or cancel.' };

/**
 * One in-app question: the dialog behind `confirm`, `prompt` and `alert`.
 *
 * Unlike the browser's native prompts it is styled, localized by the consumer, never blocks the
 * page's script and answers through a promise. With `work`, accepting runs that operation while the
 * dialog is busy and cannot be dismissed; a failure stays in the dialog with its message so the
 * person can retry or cancel, and the promise resolves only once the work succeeded or they cancel.
 */
export class Question {
	#dialog;
	#labels;
	#options;
	#field = null;
	#accept;
	#cancel;
	#problem = el('div', { class: 'bui-question-problem', role: 'alert' });

	constructor(kind, options) {
		this.#options = options;
		this.#labels = new Labels(defaults, { ...options.labels, ...pick(options, ['accept', 'cancel', 'ok']) });
		const danger = options.tone === 'danger';
		const cancel = kind === 'alert' ? null : new Button({ label: this.#labels.text('cancel'), onclick: () => this.#dialog.dismiss() });
		this.#accept = new Button({
			label: this.#labels.text(kind === 'alert' ? 'ok' : 'accept'),
			variant: danger ? 'danger' : 'primary',
			type: kind === 'prompt' ? 'submit' : 'button',
			onclick: kind === 'prompt' ? null : () => this.#answer(true)
		});
		if (kind === 'prompt') this.#field = new Field({ label: options.label, value: options.value ?? '', hint: options.hint, required: options.required ?? true, type: options.type ?? 'text', messages: options.messages, validate: options.validate });
		this.#cancel = cancel;
		const buttons = [cancel?.element, this.#accept.element].filter(Boolean);
		const body = [
			options.message ? el('p', { class: 'bui-question-message' }, [content(options.message)]) : null,
			this.#field ? this.#field.element : null,
			this.#problem
		];
		const form = kind === 'prompt' ? el('form', { class: 'bui-question-form', novalidate: true, onsubmit: event => this.#submit(event) }, [...body, el('div', { class: 'bui-dialog-actions' }, buttons)]) : null;
		this.#dialog = new Dialog({
			title: options.title,
			size: 'small',
			restore: options.restore ?? null,
			labels: { close: this.#labels.text('close') },
			children: form ? [form] : body,
			actions: form ? [] : buttons
		});
		// A prompt starts in its field; a confirmation on Cancel when it is a danger or asks for it with `focus: 'cancel'`.
		const safe = cancel && (options.focus ? options.focus === 'cancel' : danger);
		const first = this.#field ? this.#field.control : safe ? cancel.element : this.#accept.element;
		first.setAttribute('data-autofocus', '');
	}

	/** Opens the question and resolves with the raw dialog value. */
	async ask() {
		const value = await this.#dialog.open();
		this.#dialog.destroy();
		return value;
	}

	#submit(event) {
		event.preventDefault();
		if (this.#field.check()) this.#answer(this.#field.value);
		else this.#field.focus();
	}

	async #answer(value) {
		const work = this.#options.work;
		if (!work) {
			this.#dialog.close({ value });
			return;
		}
		if (this.#dialog.busy) return;
		this.#problem.replaceChildren();
		this.#dialog.busy = true;
		this.#accept.busy = true;
		if (this.#cancel) this.#cancel.disabled = true;
		try {
			await work(value);
			this.#dialog.busy = false;
			this.#dialog.close({ value });
		} catch (error) {
			const message = this.#options.explain?.(error) ?? this.#labels.text('failure');
			this.#problem.replaceChildren(callout({ tone: 'danger', title: message }));
		} finally {
			if (!this.#dialog.destroyed) {
				this.#dialog.busy = false;
				this.#accept.busy = false;
				if (this.#cancel) this.#cancel.disabled = false;
			}
		}
	}
}

function pick(source, keys) {
	return Object.fromEntries(keys.filter(key => typeof source[key] === 'string').map(key => [key, source[key]]));
}

/**
 * Asks for confirmation. Resolves true when accepted (after `work` succeeded) and false otherwise.
 * Options: `title`, `message`, `accept`, `cancel`, `tone: 'danger'`, `focus: 'cancel' | 'accept'` (Cancel
 * for a danger, Accept otherwise), `work`, `explain`, `labels`.
 */
export async function confirm(options) {
	const answer = await new Question('confirm', options).ask();
	return Boolean(answer);
}

/**
 * Asks for one value. Resolves with the text, or null when cancelled.
 * Options: `title`, `message`, `label`, `value`, `hint`, `required`, `type`, `messages`, `validate`, `work`.
 */
export async function prompt(options) {
	const answer = await new Question('prompt', options).ask();
	return answer ? answer.value : null;
}

/** Tells the person something and resolves once they acknowledge it. Options: `title`, `message`, `ok`. */
export async function alert(options) {
	await new Question('alert', options).ask();
}
