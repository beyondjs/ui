import { el } from '../core/element.js';
import { Ids } from '../core/ids.js';

/**
 * The answers a `CommandCard` offers (0.16.0, the audit's CNV-10): by default Allow (Enter) and Deny
 * (Escape); a product may give scoped decisions instead, such as "Allow once", "Allow for this
 * conversation" and "Deny with a note". A decision is `{ value, label, kind: 'allow'|'deny', keys?:
 * 'Enter'|'Escape', note?: boolean|{ label?, placeholder? } }`: the first allow takes Enter and the first
 * deny without a note takes Escape unless `keys` says otherwise. A decision with a note first shows its
 * field ("Describe an alternative"), whose Enter sends the decision with the note and whose Escape
 * goes back to the answers.
 */
export class CommandDecisions {
	#element = el('div', { class: 'bui-command-actions' });
	#note = el('div', { class: 'bui-command-note', hidden: true });
	#field = el('textarea', { class: 'bui-input bui-command-note-field', rows: 2 });
	#decisions;
	#labels;
	#ondecide;
	#pending = null;

	/**
	 * @param {object} options
	 * @param {Array<object>} options.decisions
	 * @param {import('../core/labels.js').Labels} options.labels the card's copy
	 * @param {(decision: object, note: string|null) => void} options.ondecide
	 */
	constructor({ decisions, labels, ondecide }) {
		this.#labels = labels;
		this.#ondecide = ondecide;
		this.#decisions = CommandDecisions.#keyed(decisions.filter(decision => decision && decision.label && decision.value !== undefined));
		const id = Ids.next('bui-command-note');
		this.#field.id = id;
		this.#field.addEventListener('keydown', event => this.#keys(event));
		this.#note.append(el('label', { class: 'bui-field-label', for: id }), this.#field, el('div', { class: 'bui-command-note-actions' }, [el('button', { type: 'button', class: 'bui-button bui-button-secondary bui-button-small', onclick: () => this.#send() }, [el('span', { text: labels.text('send') })]), el('button', { type: 'button', class: 'bui-button bui-button-quiet bui-button-small', onclick: () => this.back() }, [el('span', { text: labels.text('back') })])]));
		this.#element.append(...this.#decisions.map((decision, index) => this.#button(decision, index)));
	}

	/** The answers' buttons, then the note's field while one is asked. */
	get elements() {
		return [this.#element, this.#note];
	}

	/** Whether the note's field is shown. */
	get noting() {
		return !this.#note.hidden;
	}

	/** The decision a key takes (`Enter`, `Escape`), or null. */
	key(name) {
		return this.#decisions.find(decision => decision.keys === name) ?? null;
	}

	/** Shows the answers, or neither while the card is not pending. */
	set shown(value) {
		this.#element.hidden = !value || this.noting;
		if (!value) this.#note.hidden = true;
	}

	/** Chooses a decision: one with a note asks for it first. */
	choose(decision) {
		if (!decision.note) return this.#ondecide(decision, null);
		this.#pending = decision;
		const words = typeof decision.note === 'object' ? decision.note : {};
		this.#note.querySelector('label').textContent = words.label ?? this.#labels.text('note');
		this.#field.placeholder = words.placeholder ?? '';
		this.#element.hidden = true;
		this.#note.hidden = false;
		this.#field.focus();
	}

	/** Leaves the note's field for the answers again. */
	back() {
		this.#pending = null;
		this.#note.hidden = true;
		this.#element.hidden = false;
		this.#element.querySelector('button')?.focus({ preventScroll: true });
	}

	#send() {
		if (!this.#pending) return;
		this.#ondecide(this.#pending, this.#field.value.trim() || null);
	}

	#keys(event) {
		if (event.isComposing) return;
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			event.stopPropagation();
			this.#send();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			this.back();
		}
	}

	#button(decision, index) {
		const variant = index === 0 ? 'primary' : decision.kind === 'deny' ? 'secondary' : 'secondary';
		const key = decision.keys === 'Enter' ? '⏎' : decision.keys === 'Escape' ? 'Esc' : null;
		return el('button', { type: 'button', class: `bui-button bui-button-${variant} bui-button-small`, 'data-value': String(decision.value), 'aria-keyshortcuts': decision.keys ?? null, onclick: () => this.choose(decision) }, [el('span', { text: decision.label }), key ? el('kbd', { class: 'bui-keys', 'aria-hidden': 'true', text: key }) : null]);
	}

	/** The first allow takes Enter and the first deny without a note Escape, unless one says its keys. */
	static #keyed(decisions) {
		const given = new Set(decisions.map(decision => decision.keys).filter(Boolean));
		const enter = given.has('Enter') ? null : decisions.find(decision => decision.kind === 'allow');
		const escape = given.has('Escape') ? null : decisions.find(decision => decision.kind === 'deny' && !decision.note);
		return decisions.map(decision => ({ ...decision, keys: decision.keys ?? (decision === enter ? 'Enter' : decision === escape ? 'Escape' : null) }));
	}
}
