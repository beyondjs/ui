import { Component } from '../core/component.js';
import { el, fill } from '../core/element.js';
import { Labels } from '../core/labels.js';
import { ComposerKeys } from './keys.js';
import { ComposerField } from './field.js';
import { ComposerActions } from './actions.js';
import { ComposerStep } from './step.js';
import { ComposerStatus } from './status.js';
import { ComposerContext } from './context.js';
import { ComposerSend } from './send.js';
import { ComposerToolbar } from './toolbar.js';
import { ComposerExpand } from './expand.js';
import { ComposerMarks } from './marks.js';
import { ComposerBox } from './box.js';
import { composer as copy } from './labels.js';

/**
 * A message box, the same wherever a person writes to an agent or a person; the components guide
 * ("Conversations") states every option. One rounded box: an optional state line as its first band, a
 * field that grows with its text and then scrolls (named by `label`, a `placeholder` saying what sending
 * does), and a toolbar whose controls share one geometry since 0.26.0 (D165): the **+**, the `settings`
 * by their value and the `tools`, then `extras`, the reason sending is unavailable, Dictate, `stop` and
 * Send (glyphs alone, their words their name and tooltip; the other `actions` in Send's split menu).
 *
 * Sending is one path for the keys (`submit`, `ComposerKeys`), the button and the menu: the trimmed text
 * leaves the field at once and `onsubmit({ text, action, attachments? })` runs, one send at a time and
 * none while `busy` or `disabled`; a rejection gives the text back with `explain(error)`, said in the
 * state band. With nothing to send, Send is quiet and a press says nothing (0.29.0, D183). Since 0.14.0
 * (D100) a new and a started conversation share it (a `tray` of chips, focus as the box's border, `commands`
 * after "/", `recall`, **Expand**, `dictation`); its states and marks are `ComposerMarks`'.
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
	#box = new ComposerBox();
	#expand;
	#step = new ComposerStep();
	#marks;

	/** @param {import('./options.js').ComposerOptions} options what the composer shows and how it sends */
	constructor({ label, onsubmit, placeholder = null, status = null, tools = [], extras = [], actions = null, stop = null, disabled = null, busy = false, submit = 'enter', value = '', min = 1, max = 12, name = null, onchange = null, explain = undefined, labels = {}, settings = [], attach = null, attachments = [], onsuggest = null, suggest = null, locale = undefined, compact = true, summary = null, tray = [], commands = null, recall = null, dictation = null, step = null, add = [], live = false }) {
		super();
		if (typeof onsubmit !== 'function') throw new TypeError('A composer sends through onsubmit');
		this.#labels = new Labels(copy.en, labels);
		this.#keys = new ComposerKeys({ submit, view: document.defaultView ?? null });
		this.#onchange = onchange;
		this.#field = new ComposerField({ label, placeholder, value, min, max, name });
		const host = { alive: () => !this.destroyed, files: () => this.#context.files, sendable: () => Boolean(this.#context?.sendable), primary: () => this.#actions.primary.id, draw: () => this.#draw(), root: () => this.#element };
		this.#sender = new ComposerSend({ field: this.#field, status: this.#status, labels: this.#labels, onsubmit, onchange, explain, host });
		this.#actions = new ComposerActions({ labels: this.#labels, run: action => this.#send(action, true), refocus: () => this.focus() });
		const box = this.#box.element;
		this.#element = el('div', { class: 'bui-composer', 'data-submit': submit }, [box, this.#keys.guide]);
		this.#marks = new ComposerMarks(this.#element, () => !this.#field.value.trim() && !this.#context?.sendable, empty => ((this.#actions.empty = empty), (this.#field.hint = this.#context?.hint)));
		const control = this.#field.control;
		this.#context = new ComposerContext({ root: this.#element, box, field: control, labels: this.#labels, locale, attach, onsuggest, suggest, commands, recall, dictation, refocus: () => this.focus(), oninsert: (text, caret) => this.#write(text, caret) });
		this.#toolbar = new ComposerToolbar({ root: this.#element, box, controls: this.#context.controls, actions: this.#actions.element, labels: this.#labels, compact });
		this.#expand = new ComposerExpand({ root: this.#element, box, field: control, labels: this.#labels });
		const voice = this.#context.dictation;
		if (voice) this.#actions.voice = voice.button;
		this.#box.hold([this.#status.element, this.#context.files.element, this.#expand.element, this.#field.element, voice?.element, this.#toolbar.element], control);
		this.#element.append(this.#context.files.announcer, this.#expand.dialog);
		this.#keys.watch(control, { take: event => this.#context.keys(event), send: () => this.#send(null, false) });
		control.addEventListener('input', () => (this.#say(null), this.#marks.empty(), this.#onchange?.(control.value)));
		// The touch screen may change (a keyboard attached): the hint is read again when the field takes focus
		control.addEventListener('focus', () => this.#instruct());
		// The busy and disabled setters draw the composer
		Object.assign(this, { status, settings, attachments, tools, extras, actions, stop, summary, tray, step, add, live, disabled, busy });
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
		this.#marks.empty();
	}

	set placeholder(text) {
		this.#field.placeholder = text;
	}

	/** The state line, the box's first band: text, a node, `{ text, action }` (0.11.0), or null for none. */
	set status(value) {
		this.#status.value = value;
		this.#describe();
	}

	/** The turn's choices at the toolbar's start, before the tools (0.11.0). */
	set settings(nodes) {
		this.#toolbar.settings = ComposerBox.nodes(nodes);
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
		this.#marks.empty();
	}

	/** The **+** menu's entries after Attach files, `[{ label, run, keys? }]`; none: the + attaches at once (0.26.0). */
	set add(entries) {
		this.#context.add.entries = entries;
	}

	/** Whether the product's work runs now (the engine answering), shown on the box's edge (0.26.0). */
	set live(value) {
		this.#marks.live = value;
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
		this.#box.tray = nodes;
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
		this.#toolbar.tools = ComposerBox.nodes(nodes);
	}

	set extras(nodes) {
		fill(this.#actions.extras, ComposerBox.nodes(nodes));
	}

	/** `[{ id, label, primary? }]`: the primary button and the split menu's other ways to send. */
	set actions(list) {
		this.#actions.actions = list;
		this.#instruct();
	}

	/** The step a message needs first, `{ label, run }` ("Choose a machine and send"), or null (0.16.0, DQ-03). */
	set step(value) {
		this.#actions.step = this.#step.use(value);
		this.#instruct();
	}

	/** `{ label, run, busy? }` while work runs (Interrupt), or null. */
	set stop(value) {
		this.#actions.stop = value;
	}

	get disabled() {
		return this.#marks.disabled;
	}

	/** `{ reason, place? }` while sending is unavailable, or null; a press on Send then goes to `place()` (0.35.0). */
	set disabled(value) {
		this.#marks.disabled = value || null;
		this.#draw();
	}

	/** The product's own work: nothing is sent while busy. */
	get busy() {
		return this.#marks.busy;
	}

	set busy(value) {
		this.#marks.busy = Boolean(value);
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

	#send(action, pressed, stepped = false) {
		if (this.destroyed || this.#sender.sending || this.#marks.busy || this.#step.running || this.#marks.held(pressed)) return Promise.resolve(false);
		if (this.#step.active && !stepped) return this.#step.pass({ text: this.#field.value, draw: () => this.#draw(), send: () => this.#send(action, pressed, true) });
		// What Options showed folds again once the message is sent (a refused one keeps it shown)
		return this.#sender.send(action, pressed).then(sent => (sent && (this.#toolbar.fold.toggle(false), this.#expand.close()), sent));
	}

	/** Writes a suggestion's text with the caret after it, as typing would, and says the change. */
	#write(text, caret) {
		this.value = text;
		this.#field.control.setSelectionRange?.(caret, caret);
		this.#expand.measure();
		this.#say(null);
		this.#onchange?.(text);
	}

	#say(text) {
		if (this.#sender.say(text)) this.#describe();
	}

	#draw() {
		const busy = this.#marks.busy || this.#sender.sending || this.#step.running;
		this.#actions.draw({ disabled: this.#marks.disabled, busy });
		this.#marks.draw(busy);
		this.#describe();
	}

	/** Writes the hidden guide to the keys, read with the field. */
	#instruct() {
		this.#keys.instruct(this.#labels, this.#actions.primary.label);
	}

	/** The field is described by a failure, the state line, the keys and the reason sending is unavailable. */
	#describe() {
		if (!this.#actions) return;
		const ids = [this.#status.problem, this.#status.id, this.#keys.guide.id, this.#marks.disabled?.reason ? this.#actions.reason : null];
		this.#field.control.setAttribute('aria-describedby', ids.filter(Boolean).join(' '));
	}
}
