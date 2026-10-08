import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { Interaction } from '../core/interaction.js';
import { ComposerKeys } from './keys.js';
import { ComposerField } from './field.js';
import { ComposerActions } from './actions.js';
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
 */
export class Composer extends Component {
	/** The copy in English and Spanish. */
	static labels = copy;
	static submits = ComposerKeys.submits;

	#element;
	#status;
	#guide;
	#problem;
	#tools = el('div', { class: 'bui-composer-tools' });
	#field;
	#keys;
	#actions;
	#labels;
	#onsubmit;
	#onchange;
	#explain;
	#disabled = null;
	#busy = false;
	#sending = false;

	/**
	 * @param {object} options
	 * @param {string} options.label the field's accessible name ("Message to Claude Code"), never drawn
	 * @param {(message: {text: string, action: string}) => Promise<unknown>} options.onsubmit sends; a rejection gives the text back
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
	 */
	constructor({ label, onsubmit, placeholder = null, status = null, tools = [], extras = [], actions = null, stop = null, disabled = null, busy = false, submit = 'enter', value = '', min = 1, max = 12, name = null, onchange = null, explain = undefined, labels = {} }) {
		super();
		if (typeof onsubmit !== 'function') throw new TypeError('A composer sends through onsubmit');
		this.#labels = new Labels(copy.en, labels);
		this.#keys = new ComposerKeys({ submit, view: document.defaultView ?? null });
		this.#onsubmit = onsubmit;
		this.#onchange = onchange;
		this.#explain = explain;
		this.#field = new ComposerField({ label, placeholder, value, min, max, name });
		const id = Ids.next('bui-composer');
		this.#status = el('p', { id: `${id}-status`, class: 'bui-composer-status', hidden: true });
		this.#guide = el('span', { id: `${id}-hint`, class: 'bui-hidden' });
		this.#problem = el('p', { id: `${id}-problem`, class: 'bui-composer-problem', role: 'alert', hidden: true });
		this.#actions = new ComposerActions({ labels: this.#labels, run: action => this.#send(action, true), refocus: () => this.focus() });
		const bar = el('div', { class: 'bui-composer-bar' }, [this.#tools, this.#actions.element]);
		this.#element = el('div', { class: 'bui-composer', 'data-submit': submit }, [el('div', { class: 'bui-composer-box' }, [this.#status, this.#field.element, this.#problem, bar]), this.#guide]);
		const control = this.#field.control;
		control.addEventListener('keydown', event => {
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

	/** The state line: one sentence (text or a node with its action), or null for none. */
	set status(value) {
		const empty = value === null || value === undefined || value === '';
		this.#status.hidden = empty;
		fill(this.#status, empty ? [] : [content(value)]);
		this.#describe();
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
		return this.#sending;
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
		this.#actions.destroy();
		super.destroy();
	}

	async #send(action, pressed) {
		if (this.#sending || this.#busy || this.#disabled || this.destroyed) return false;
		const raw = this.#field.value;
		const text = raw.trim();
		if (!text) {
			// An empty Enter does nothing; a press on the button says why nothing was sent
			if (pressed) {
				this.#say(this.#labels.text('empty'));
				this.focus();
			}
			return false;
		}
		this.#sending = true;
		this.#say(null);
		this.#field.value = '';
		this.#onchange?.('');
		this.#draw();
		try {
			await this.#onsubmit({ text, action: action ?? this.#actions.primary.id });
			return true;
		} catch (error) {
			if (this.destroyed) return false;
			const typed = this.#field.value;
			this.#field.value = typed ? `${raw}\n${typed}` : raw;
			this.#onchange?.(this.#field.value);
			this.#say(this.#explain === undefined ? this.#labels.text('failed') : (this.#explain?.(error) ?? null));
			return false;
		} finally {
			if (!this.destroyed) {
				this.#sending = false;
				this.#draw();
				if (this.#within()) this.focus();
			}
		}
	}

	/** Whether focus is in the composer, or nowhere (a pressed button in Safari): it then goes to the field. */
	#within() {
		const document = this.#element.ownerDocument;
		return Interaction.adrift(document) || this.#element.contains(document.activeElement);
	}

	#say(text) {
		if (!text && this.#problem.hidden) return;
		this.#problem.hidden = !text;
		fill(this.#problem, text ? [glyph('alert'), el('span', { text })] : []);
		this.#describe();
	}

	#draw() {
		const busy = this.#busy || this.#sending;
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
		const ids = [this.#status.hidden ? null : this.#status.id, this.#guide.id, this.#disabled?.reason ? this.#actions.reason : null, this.#problem.hidden ? null : this.#problem.id];
		this.#field.control.setAttribute('aria-describedby', ids.filter(Boolean).join(' '));
	}

	static #nodes(nodes) {
		return [].concat(nodes ?? []).filter(Boolean).map(node => node.element ?? node);
	}
}
