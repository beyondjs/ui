import { Component } from '../core/component.js';
import { el, fill } from '../core/element.js';
import { Labels } from '../core/labels.js';
import { ComposerKeys } from './keys.js';
import { ComposerField } from './field.js';
import { ComposerActions } from './actions.js';
import { ComposerStatus } from './status.js';
import { ComposerContext } from './context.js';
import { ComposerSend } from './send.js';
import { ComposerToolbar } from './toolbar.js';
import { ComposerExpand } from './expand.js';
import { composer as copy } from './labels.js';

/**
 * A message box, the same wherever a person writes to an agent or a person (the components guide,
 * "Conversations", states every option): an optional state line above the box; a field of one line that
 * grows with its text and then scrolls (named by `label`, with no visible label, and a `placeholder` that
 * says what sending will do); a toolbar with Attach, the turn's `settings` and the product's `tools` at
 * its start (kept on one row by `ComposerToolbar`), then `extras`, the reason sending is unavailable, the
 * `stop` action and the primary action with the other `actions` in a split menu.
 *
 * Keys follow `submit` (`ComposerKeys`). Sending is one path for the keys, the button and the menu: the
 * text (trimmed) leaves the field at once and `onsubmit({ text, action, attachments? })` runs, one send at
 * a time and none while `busy` or `disabled`; a rejection gives the text back with `explain(error)`.
 *
 * Since 0.14.0 (D100) the same composer serves a new and a started conversation: a `tray` of compact
 * chips sits on the box's lower edge while the product needs it (the context to choose before the first
 * send) and leaves by `tray = null`; focus draws the box's own border in the focus color; `commands` list
 * after a "/" at the field's start; `recall` brings a message back on ArrowUp in an empty field; the field
 * stops near a third of the window (`--bui-composer-cap`) and **Expand** opens a taller editor; and
 * `dictation` offers **Dictate**: voice to editable text, never sent by itself.
 */
export class Composer extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;
	static submits = ComposerKeys.submits;

	#element;
	#status = new ComposerStatus();
	#sender;
	#context;
	#toolbar;
	#field;
	#keys;
	#actions;
	#labels;
	#onchange;
	#disabled = null;
	#busy = false;
	#tray = el('div', { class: 'bui-composer-tray', hidden: true });
	#expand;

	/** @param {import('./options.js').ComposerOptions} options what the composer shows and how it sends */
	constructor({ label, onsubmit, placeholder = null, status = null, tools = [], extras = [], actions = null, stop = null, disabled = null, busy = false, submit = 'enter', value = '', min = 1, max = 12, name = null, onchange = null, explain = undefined, labels = {}, settings = [], attach = null, attachments = [], onsuggest = null, suggest = null, locale = undefined, compact = true, summary = null, tray = [], commands = null, recall = null, dictation = null }) {
		super();
		if (typeof onsubmit !== 'function') throw new TypeError('A composer sends through onsubmit');
		this.#labels = new Labels(copy.en, labels);
		this.#keys = new ComposerKeys({ submit, view: document.defaultView ?? null });
		this.#onchange = onchange;
		this.#field = new ComposerField({ label, placeholder, value, min, max, name });
		const host = { alive: () => !this.destroyed, files: () => this.#context.files, primary: () => this.#actions.primary.id, draw: () => this.#draw(), root: () => this.#element };
		this.#sender = new ComposerSend({ field: this.#field, labels: this.#labels, onsubmit, onchange, explain, host });
		this.#actions = new ComposerActions({ labels: this.#labels, run: action => this.#send(action, true), refocus: () => this.focus() });
		const box = el('div', { class: 'bui-composer-box' });
		this.#element = el('div', { class: 'bui-composer', 'data-submit': submit }, [this.#status.element, box, this.#keys.guide]);
		const control = this.#field.control;
		this.#context = new ComposerContext({ root: this.#element, box, field: control, labels: this.#labels, locale, attach, onsuggest, suggest, commands, recall, dictation, refocus: () => this.focus(), oninsert: (text, caret) => this.#write(text, caret) });
		this.#toolbar = new ComposerToolbar({ root: this.#element, controls: this.#context.controls, actions: this.#actions.element, labels: this.#labels, compact });
		this.#expand = new ComposerExpand({ root: this.#element, box, field: control, labels: this.#labels });
		const voice = this.#context.dictation;
		if (voice) this.#actions.voice = voice.button;
		box.prepend(this.#context.files.element, this.#expand.element, this.#field.element, ...[this.#sender.element, voice?.element, this.#toolbar.element, this.#tray].filter(Boolean));
		this.#element.append(this.#context.files.announcer, this.#expand.dialog);
		this.#keys.watch(control, { take: event => this.#context.keys(event), send: () => this.#send(null, false) });
		control.addEventListener('input', () => (this.#say(null), this.#onchange?.(control.value)));
		// The touch screen may change (a keyboard attached): the hint is read again when the field takes focus
		control.addEventListener('focus', () => this.#instruct());
		// Through the setters, in this order
		Object.assign(this, { status, settings, attachments, tools, extras, actions, stop, summary, tray });
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
		this.#toolbar.settings = Composer.#nodes(nodes);
	}

	/** What sending uses ("Opus 5.5"), said beside Options while the settings are folded, or null (0.11.2). */
	set summary(text) {
		this.#toolbar.summary = text;
	}

	/** Options (`ComposerFold`: `open`, `toggle(open?)`, `button`, `available`) (0.11.1). */
	get fold() {
		return this.#toolbar.fold;
	}

	/** The toolbar (`ComposerToolbar`): its one-row `level` (`full`, `short` or `fold`) and `measure()` (0.11.2). */
	get toolbar() {
		return this.#toolbar;
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

	/** The product's work surface where a drop attaches too (a thread with its dock), or null; needs `attach` (0.11.2). */
	set zone(element) {
		if (this.#context.intake) this.#context.intake.zone.element = element;
	}

	/** The context tray on the box's lower edge (0.14.0): compact chips, or null or an empty list to take it away. */
	set tray(nodes) {
		const list = Composer.#nodes(nodes);
		fill(this.#tray, list);
		this.#tray.hidden = !list.length;
	}

	/** Dictation (`ComposerDictation`: `state`, `start()`, `stop()`, `cancel()`), or null without `dictation` (0.14.0). */
	get dictation() {
		return this.#context.dictation;
	}

	/** The taller editor (`ComposerExpand`: `expanded`, `open()`, `close()`) (0.14.0). */
	get editor() {
		return this.#expand;
	}

	/** Opens the platform's file chooser, as Attach does; nothing without `attach`. */
	attach() {
		this.#context.intake?.pick();
	}

	set tools(nodes) {
		this.#toolbar.tools = Composer.#nodes(nodes);
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
		this.#expand.measure();
	}

	mount(parent, before = null) {
		super.mount(parent, before);
		this.fit();
		return this;
	}

	destroy() {
		this.#expand.destroy();
		this.#context.destroy();
		this.#toolbar.destroy();
		this.#status.destroy();
		this.#actions.destroy();
		super.destroy();
	}

	#send(action, pressed) {
		if (this.#sender.sending || this.#busy || this.#disabled || this.destroyed) return Promise.resolve(false);
		// What Options showed folds again once the message is sent (a refused one keeps it shown)
		return this.#sender.send(action, pressed).then(sent => (sent && (this.#toolbar.fold.toggle(false), this.#expand.close()), sent));
	}

	/** Writes a suggestion's text with the caret after it, as typing would, and says the change. */
	#write(text, caret) {
		const control = this.#field.control;
		this.#field.value = text;
		control.setSelectionRange?.(caret, caret);
		this.#expand.measure();
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
		this.#keys.instruct(this.#labels, this.#actions.primary.label);
	}

	/** The field is described by the state line, the keys, the reason sending is unavailable and a failure. */
	#describe() {
		if (!this.#actions) return;
		const ids = [this.#status.id, this.#keys.guide.id, this.#disabled?.reason ? this.#actions.reason : null, this.#sender.id];
		this.#field.control.setAttribute('aria-describedby', ids.filter(Boolean).join(' '));
	}

	static #nodes(nodes) {
		return [].concat(nodes ?? []).filter(Boolean).map(node => node.element ?? node);
	}
}
