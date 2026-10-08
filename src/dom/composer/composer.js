import { Component } from '../core/component.js';
import { el, fill } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { ComposerKeys } from './keys.js';
import { ComposerField } from './field.js';
import { ComposerActions } from './actions.js';
import { ComposerStatus } from './status.js';
import { ComposerContext } from './context.js';
import { ComposerSend } from './send.js';
import { composer as copy } from './labels.js';

/**
 * A message box, the same wherever a person writes to an agent or a person: an optional state line
 * (one sentence, only when it changes what sending does), a field of one line that grows with its text
 * to twelve and then scrolls (named by `label`, with no visible label, and a `placeholder` that says
 * what sending will do), and a toolbar: the product's `tools` at its start (context choices on a new
 * conversation), then its `extras`, the reason sending is unavailable, the `stop` action while work
 * runs and the primary action with the other `actions` in a split menu.
 *
 * Keys follow `submit` (`ComposerKeys`): with `'enter'` (the default) Enter sends on a hardware
 * keyboard and Shift+Enter adds a line; ⌘/Ctrl+Enter always sends; on a touch screen Enter adds a line
 * and the button sends; an input method's Enter never sends. Escape is left to menus. A hidden hint
 * says the keys with the field.
 *
 * Sending is one path for the keys, the button and the menu: the text (trimmed) leaves the field at
 * once and `onsubmit({ text, action })` runs; one send at a time, and none while `busy` or `disabled`
 * (`{ reason }`, said beside the action). When its promise rejects the text comes back (before anything
 * typed meanwhile) with `explain(error)` said under the field ("Not sent. Your message is still here."
 * without `explain`; nothing when it answers null). Focus stays in the field.
 *
 * Since 0.11.0: the state line is a line of its own above the field's box, with an optional action at
 * its end (`status: { text, action }`); `settings` are nodes at the toolbar's start (the turn's
 * choices, such as `ChoiceChip`s); `attach` takes files from a paste, a drop and Attach, handed to the
 * product, whose `attachments` are drawn as removable chips; `onsuggest` lists suggestions after a
 * trigger character ("@" by default). A message with ready attachments may have no text.
 */
export class Composer extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;
	static submits = ComposerKeys.submits;

	#element;
	#status = new ComposerStatus();
	#guide;
	#sender;
	#tools = el('div', { class: 'bui-composer-tools' });
	#settings = el('div', { class: 'bui-composer-settings' });
	#context;
	#field;
	#keys;
	#actions;
	#labels;
	#onchange;
	#disabled = null;
	#busy = false;

	/**
	 * @param {object} options
	 * @param {string} options.label the field's accessible name ("Message to Claude Code"), never drawn
	 * @param {(message: {text: string, action: string, attachments: object[]}) => Promise<unknown>} options.onsubmit sends; a rejection gives the text back
	 * @param {string|null} [options.placeholder] what sending will do ("Message Claude Code…")
	 * @param {string|Node|null} [options.status] the state line
	 * @param {Array<Node|{element: Node}>} [options.tools] the toolbar's start
	 * @param {Array<Node|{element: Node}>} [options.extras] the toolbar's end, before the actions
	 * @param {Array<{id: string, label: string, primary?: boolean}>|null} [options.actions] the ways to send ("Send" by default)
	 * @param {{label: string, run: () => unknown, busy?: boolean}|null} [options.stop] the stop action while work runs
	 * @param {{reason?: string|null}|null} [options.disabled] sending is unavailable, and why
	 * @param {boolean} [options.busy] the product's own work: nothing is sent meanwhile
	 * @param {'enter'|'mod'} [options.submit] whether Enter sends on a hardware keyboard (default `'enter'`)
	 * @param {string} [options.value] the text, such as a kept draft
	 * @param {number} [options.min] the field's lines when empty (1)
	 * @param {number} [options.max] the lines before it scrolls (12)
	 * @param {string|null} [options.name] the field's form name
	 * @param {(text: string) => void} [options.onchange] the text changed, by the person or by sending
	 * @param {((error: unknown) => string|null)} [options.explain] what a rejected send says
	 * @param {Array<Node|{element: Node}>} [options.settings] the turn's choices at the toolbar's start (0.11.0)
	 * @param {object|null} [options.attach] `{ label?, accept?, multiple?, onfiles(files, via), onremove?(item), onretry?(item) }` (0.11.0)
	 * @param {Array<object>} [options.attachments] the chips: `{ key, name, size?, type?, state, progress?, reason?, thumbnail?, file? }` (0.11.0)
	 * @param {((query: string, signal: AbortSignal) => Promise<unknown>)|null} [options.onsuggest] suggestions after the trigger (0.11.0)
	 * @param {{trigger?: string, bound?: number, delay?: number, label?: string|null, explain?: ((error: unknown) => string|null)|null}|null} [options.suggest]
	 * @param {string} [options.locale] the language of sizes and percents (the runtime's by default)
	 */
	constructor({ label, onsubmit, placeholder = null, status = null, tools = [], extras = [], actions = null, stop = null, disabled = null, busy = false, submit = 'enter', value = '', min = 1, max = 12, name = null, onchange = null, explain = undefined, labels = {}, settings = [], attach = null, attachments = [], onsuggest = null, suggest = null, locale = undefined }) {
		super();
		if (typeof onsubmit !== 'function') throw new TypeError('A composer sends through onsubmit');
		this.#labels = new Labels(copy.en, labels);
		this.#keys = new ComposerKeys({ submit, view: document.defaultView ?? null });
		this.#onchange = onchange;
		this.#field = new ComposerField({ label, placeholder, value, min, max, name });
		this.#guide = el('span', { id: Ids.next('bui-composer-hint'), class: 'bui-hidden' });
		const host = { alive: () => !this.destroyed, files: () => this.#context.files, primary: () => this.#actions.primary.id, draw: () => this.#draw(), root: () => this.#element };
		this.#sender = new ComposerSend({ field: this.#field, labels: this.#labels, onsubmit, onchange, explain, host });
		this.#actions = new ComposerActions({ labels: this.#labels, run: action => this.#send(action, true), refocus: () => this.focus() });
		const box = el('div', { class: 'bui-composer-box' });
		this.#element = el('div', { class: 'bui-composer', 'data-submit': submit }, [this.#status.element, box, this.#guide]);
		const control = this.#field.control;
		this.#context = new ComposerContext({ root: this.#element, box, field: control, labels: this.#labels, locale, attach, onsuggest, suggest, refocus: () => this.focus(), oninsert: (text, caret) => this.#write(text, caret) });
		const start = el('div', { class: 'bui-composer-start' }, [...this.#context.controls, this.#settings, this.#tools]);
		box.prepend(this.#context.files.element, this.#field.element, this.#sender.element, el('div', { class: 'bui-composer-bar' }, [start, this.#actions.element]));
		this.#element.append(this.#context.files.announcer);
		control.addEventListener('keydown', event => {
			if (this.#context.keys(event)) {
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			if (!this.#keys.sends(event)) return;
			event.preventDefault();
			this.#send(null, false);
		});
		control.addEventListener('input', () => {
			this.#say(null);
			this.#onchange?.(control.value);
		});
		// The touch screen may change (a keyboard attached): the hint is read again when the field takes focus
		control.addEventListener('focus', () => this.#instruct());
		this.status = status;
		this.settings = settings;
		this.attachments = attachments;
		this.tools = tools;
		this.extras = extras;
		this.actions = actions;
		this.stop = stop;
		this.#disabled = disabled || null;
		this.#busy = Boolean(busy);
		this.#draw();
	}

	get element() {
		return this.#element;
	}

	/** The textarea, for a product that measures or labels around it. */
	get field() {
		return this.#field.control;
	}

	get value() {
		return this.#field.value;
	}

	/** Replaces the text (a prefilled message, a restored draft) without calling `onchange`. */
	set value(text) {
		this.#field.value = text;
	}

	set placeholder(text) {
		this.#field.placeholder = text;
	}

	/** The state line above the box: text, a node, `{ text, action }` (0.11.0), or null for none. */
	set status(value) {
		this.#status.value = value;
		this.#describe();
	}

	/** The turn's choices at the toolbar's start, before the tools (0.11.0). */
	set settings(nodes) {
		fill(this.#settings, Composer.#nodes(nodes));
	}

	/** The attachments as given (0.11.0). */
	get attachments() {
		return this.#context.files.items;
	}

	/** The chips: `[{ key, name, size?, type?, state, progress?, reason?, thumbnail?, file? }]` (0.11.0). */
	set attachments(items) {
		this.#context.files.items = items;
	}

	/** The suggestions (`ComposerSuggest`: `open`, `state`, `close()`), or null without `onsuggest`. */
	get suggestions() {
		return this.#context.suggest;
	}

	/** Opens the platform's file chooser, as Attach does; nothing without `attach`. */
	attach() {
		this.#context.intake?.pick();
	}

	set tools(nodes) {
		fill(this.#tools, Composer.#nodes(nodes));
	}

	set extras(nodes) {
		fill(this.#actions.extras, Composer.#nodes(nodes));
	}

	/** `[{ id, label, primary? }]`: the primary button and the split menu's other ways to send. */
	set actions(list) {
		this.#actions.actions = list;
		this.#instruct();
	}

	/** `{ label, run, busy? }` while work runs (Interrupt), or null. */
	set stop(value) {
		this.#actions.stop = value;
	}

	get disabled() {
		return this.#disabled;
	}

	/** `{ reason }` while sending is unavailable, or null. */
	set disabled(value) {
		this.#disabled = value || null;
		this.#draw();
	}

	/** The product's own work: nothing is sent while busy. */
	get busy() {
		return this.#busy;
	}

	set busy(value) {
		this.#busy = Boolean(value);
		this.#draw();
	}

	/** Whether a send is in flight. */
	get sending() {
		return this.#sender.sending;
	}

	/** Sends the field's text with an action (the primary one by default). Resolves whether it was sent. */
	submit(action = null) {
		return this.#send(action, true);
	}

	focus() {
		this.#field.control.focus();
	}

	/** Fits the field's height to its text; `mount` does it, a product that places the element itself calls it. */
	fit() {
		this.#field.fit();
	}

	mount(parent, before = null) {
		super.mount(parent, before);
		this.fit();
		return this;
	}

	destroy() {
		this.#context.destroy();
		this.#status.destroy();
		this.#actions.destroy();
		super.destroy();
	}

	#send(action, pressed) {
		if (this.#sender.sending || this.#busy || this.#disabled || this.destroyed) return Promise.resolve(false);
		return this.#sender.send(action, pressed);
	}

	/** Writes a suggestion's text with the caret after it, as typing would, and says the change. */
	#write(text, caret) {
		const control = this.#field.control;
		this.#field.value = text;
		control.setSelectionRange?.(caret, caret);
		this.#say(null);
		this.#onchange?.(text);
	}

	#say(text) {
		if (this.#sender.say(text)) this.#describe();
	}

	#draw() {
		const busy = this.#busy || this.#sender.sending;
		this.#actions.draw({ disabled: this.#disabled, busy });
		this.#element.toggleAttribute('data-busy', busy);
		this.#element.toggleAttribute('data-disabled', Boolean(this.#disabled));
		this.#describe();
	}

	/** Writes the hidden guide to the keys, read with the field. */
	#instruct() {
		this.#guide.textContent = this.#keys.hint(this.#labels, this.#actions.primary.label);
	}

	/** The field is described by the state line, the keys, the reason sending is unavailable and a failure. */
	#describe() {
		if (!this.#actions) return;
		const ids = [this.#status.id, this.#guide.id, this.#disabled?.reason ? this.#actions.reason : null, this.#sender.id];
		this.#field.control.setAttribute('aria-describedby', ids.filter(Boolean).join(' '));
	}

	static #nodes(nodes) {
		return [].concat(nodes ?? []).filter(Boolean).map(node => node.element ?? node);
	}
}
